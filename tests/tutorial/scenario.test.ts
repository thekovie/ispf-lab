/**
 * Scenario reset (M1a-5): the pure part of "apply a lesson's starting state".
 * Replaying a lesson must not depend on what the learner did before (M0 review F-02, F-16).
 */
import { describe, expect, it } from "vitest";
import { allocate, getDataset, getMember, saveRecords } from "@/catalog/catalog";
import { buildSeed } from "@/catalog/seed";
import type { Catalog } from "@/catalog/types";
import type { EditProfiles } from "@/editor/profile";
import { applyScenario, scenarioProfiles, startActions, workAtRisk } from "@/tutorial/scenario";
import { Sim } from "../engine/harness";

const HLQ = "USER01";
const TODAY = "2026/10/15";

function withTestLibrary(): Catalog {
  const r = allocate(buildSeed(HLQ), { name: `${HLQ}.TEST.JCL`, spaceUnits: "TRKS", primary: 1, secondary: 1, dirBlocks: 10, recfm: "FB", lrecl: 80, owner: HLQ }, TODAY);
  expect(r.error).toBeUndefined();
  return r.catalog;
}

describe("applyScenario", () => {
  it("removeDatasets deletes a leftover data set so it can be allocated again", () => {
    const left = withTestLibrary();
    const next = applyScenario(left, HLQ, { removeDatasets: ["{HLQ}.TEST.JCL"] }, TODAY);
    expect(getDataset(next, `${HLQ}.TEST.JCL`)).toBeUndefined();
  });

  it("removeDatasets ignores a data set that is not there", () => {
    const seed = buildSeed(HLQ);
    expect(applyScenario(seed, HLQ, { removeDatasets: ["{HLQ}.NOT.THERE"] }, TODAY).datasets).toEqual(seed.datasets);
  });

  it("removeMembers deletes leftover members", () => {
    let cat = buildSeed(HLQ);
    cat = saveRecords(cat, { dsn: `${HLQ}.REXX`, member: "SCRATCH" }, ["/* x */"], { today: TODAY, userid: HLQ }).catalog;
    expect(getMember(cat, `${HLQ}.REXX`, "SCRATCH")).toBeDefined();
    const next = applyScenario(cat, HLQ, { removeMembers: [{ dsn: "{HLQ}.REXX", member: "SCRATCH" }] }, TODAY);
    expect(getMember(next, `${HLQ}.REXX`, "SCRATCH")).toBeUndefined();
  });

  it("createDatasets creates an empty PDS, replacing a populated one", () => {
    let cat = withTestLibrary();
    cat = saveRecords(cat, { dsn: `${HLQ}.TEST.JCL`, member: "OLD" }, ["//OLD JOB"], { today: TODAY, userid: HLQ }).catalog;
    const next = applyScenario(cat, HLQ, { createDatasets: [{ dsn: "{HLQ}.TEST.JCL", dirBlocks: 10 }] }, TODAY);
    const ds = getDataset(next, `${HLQ}.TEST.JCL`)!;
    expect(ds.datasetType).toBe("PDS");
    expect(ds.dirBlocks).toBe(10);
    expect(Object.keys(ds.members ?? {})).toEqual([]);
  });

  it("resetMembers still restores seed members", () => {
    let cat = buildSeed(HLQ);
    cat = saveRecords(cat, { dsn: `${HLQ}.JCL`, member: "HELLO" }, ["//BROKEN"], { today: TODAY, userid: HLQ }).catalog;
    const next = applyScenario(cat, HLQ, { resetMembers: [{ dsn: "{HLQ}.JCL", member: "HELLO" }] }, TODAY);
    expect(getMember(next, `${HLQ}.JCL`, "HELLO")?.records).toEqual(getMember(buildSeed(HLQ), `${HLQ}.JCL`, "HELLO")?.records);
  });

  it("returns the same object when the lesson asks for nothing", () => {
    const cat = buildSeed(HLQ);
    expect(applyScenario(cat, HLQ, {}, TODAY)).toBe(cat);
  });
});

describe("startActions", () => {
  const logged = () => Sim.loggedOn().state;

  it("always closes the session first and ends with the starting screen", () => {
    const actions = startActions(logged(), { screen: { id: "PRIMARY_OPTION_MENU" } });
    expect(actions.map((a) => a.type)).toEqual(["RESET_SESSION", "GOTO"]);
    expect(actions[0]).toEqual({ type: "RESET_SESSION", retrieve: false });
  });

  it("asks for an empty retrieve stack only when the lesson says so", () => {
    expect(startActions(logged(), { clearRetrieve: true })[0]).toEqual({ type: "RESET_SESSION", retrieve: true });
  });

  it("puts a changed setting back only when the lesson names it", () => {
    const changed = { ...logged(), settings: { ...logged().settings, scrollDefault: "HALF" as const, insertMode: true } };
    const actions = startActions(changed, { resetSettings: ["scrollDefault"] });
    const load = actions.find((a) => a.type === "LOAD_SETTINGS");
    expect(load && load.type === "LOAD_SETTINGS" && load.settings).toEqual({ ...changed.settings, scrollDefault: "PAGE" });
    expect(startActions(changed, {}).some((a) => a.type === "LOAD_SETTINGS")).toBe(false);
  });

  it("does not reload settings that are already at their defaults", () => {
    expect(startActions(logged(), { resetSettings: ["scrollDefault"] }).some((a) => a.type === "LOAD_SETTINGS")).toBe(false);
  });

  it("clears jobs only when the lesson asks", () => {
    expect(startActions(logged(), { resetJobs: true }).some((a) => a.type === "LOAD_JES")).toBe(true);
    expect(startActions(logged(), {}).some((a) => a.type === "LOAD_JES")).toBe(false);
  });
});

describe("workAtRisk (what starting a lesson would throw away)", () => {
  const entry = (dsn: string) => ({ project: "", group: "", type: "", member: "", other: dsn });
  const editHello = () => {
    const s = Sim.loggedOn();
    s.cmd("2");
    s.enter(entry(`${HLQ}.JCL(HELLO)`));
    return s;
  };

  it("reports nothing for a fresh session", () => {
    expect(workAtRisk(Sim.loggedOn().state, { resetMembers: [{ dsn: "{HLQ}.JCL", member: "HELLO" }] })).toEqual([]);
  });

  it("reports an editor with unsaved changes", () => {
    const s = editHello();
    s.enter({ "line:3": "//STEP1    EXEC PGM=IEBGENER" });
    const risk = workAtRisk(s.state, {});
    expect(risk).toHaveLength(1);
    expect(risk[0]).toMatch(/unsaved changes/i);
    expect(risk[0]).toContain(`${HLQ}.JCL(HELLO)`);
  });

  it("does not report an editor that is open but unchanged", () => {
    expect(workAtRisk(editHello().state, {})).toEqual([]);
  });

  it("reports unsaved changes in another split screen", () => {
    const s = editHello();
    s.enter({ "line:3": "//STEP1    EXEC PGM=IEBGENER" });
    s.pf(2);
    expect(s.state.editor).toBeUndefined();
    expect(workAtRisk(s.state, {}).join(" ")).toMatch(/unsaved changes/i);
  });

  it("reports a saved change to a seed member only when the lesson would restore it", () => {
    const s = editHello();
    s.enter({ "line:3": "//STEP1    EXEC PGM=IEBGENER" });
    s.enter({ command: "SAVE" });
    s.pf(3);
    const restore = { resetMembers: [{ dsn: "{HLQ}.JCL", member: "HELLO" }] };
    expect(workAtRisk(s.state, restore).join(" ")).toContain(`${HLQ}.JCL(HELLO)`);
    expect(workAtRisk(s.state, {})).toEqual([]);
  });

  it("reports a leftover data set that has content, not an empty one", () => {
    let cat = withTestLibrary();
    const base = { ...Sim.loggedOn().state, catalog: cat };
    expect(workAtRisk(base, { removeDatasets: ["{HLQ}.TEST.JCL"] })).toEqual([]);
    cat = saveRecords(cat, { dsn: `${HLQ}.TEST.JCL`, member: "OLD" }, ["//OLD JOB"], { today: TODAY, userid: HLQ }).catalog;
    const risk = workAtRisk({ ...base, catalog: cat }, { removeDatasets: ["{HLQ}.TEST.JCL"] });
    expect(risk).toHaveLength(1);
    expect(risk[0]).toContain(`${HLQ}.TEST.JCL`);
  });

  it("reports leftover members that have content", () => {
    const cat = saveRecords(buildSeed(HLQ), { dsn: `${HLQ}.REXX`, member: "SCRATCH" }, ["/* work */"], { today: TODAY, userid: HLQ }).catalog;
    const risk = workAtRisk({ ...Sim.loggedOn().state, catalog: cat }, { removeMembers: [{ dsn: "{HLQ}.REXX", member: "SCRATCH" }] });
    expect(risk.join(" ")).toContain(`${HLQ}.REXX(SCRATCH)`);
  });

  it("lists at most five items and counts the rest", () => {
    let cat = buildSeed(HLQ);
    const members = ["A1", "A2", "A3", "A4", "A5", "A6", "A7"];
    for (const m of members) cat = saveRecords(cat, { dsn: `${HLQ}.REXX`, member: m }, ["/* x */"], { today: TODAY, userid: HLQ }).catalog;
    const risk = workAtRisk({ ...Sim.loggedOn().state, catalog: cat }, { removeMembers: members.map((member) => ({ dsn: "{HLQ}.REXX", member })) });
    expect(risk).toHaveLength(6);
    expect(risk[5]).toMatch(/and 2 more/);
  });
});

describe("scenarioProfiles", () => {
  const profiles = { JCL: { name: "JCL", caps: true }, COBOL: { name: "COBOL", caps: false } } as unknown as EditProfiles;

  it("resetProfiles removes only the named profiles", () => {
    const next = scenarioProfiles(profiles, { resetProfiles: ["JCL"] });
    expect(Object.keys(next)).toEqual(["COBOL"]);
  });

  it("returns the same object when nothing is reset", () => {
    expect(scenarioProfiles(profiles, {})).toBe(profiles);
  });
});
