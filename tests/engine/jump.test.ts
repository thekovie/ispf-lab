import { describe, expect, it } from "vitest";
import { Sim } from "./harness";
import { readRecords } from "@/catalog/catalog";
import { INVALID_JUMP, parseSystemCommand } from "@/engine/systemCommands";
import { NOT_AVAILABLE } from "@/engine/navigation";
import { allSessions } from "@/engine/splitScreen";

const strip = (s: Sim) => {
  const { commandHistory, ...rest } = s.state;
  void commandHistory;
  return rest;
};

describe("jump parsing", () => {
  it("recognises =path, RETURN, RETRIEVE", () => {
    expect(parseSystemCommand("=3.4")).toEqual({ kind: "jump", path: ["3", "4"] });
    expect(parseSystemCommand(" =2 ")).toEqual({ kind: "jump", path: ["2"] });
    expect(parseSystemCommand("=x")).toEqual({ kind: "jump", path: [] });
    expect(parseSystemCommand("return")).toEqual({ kind: "return" });
    expect(parseSystemCommand("RETRIEVE")).toEqual({ kind: "retrieve" });
    expect(parseSystemCommand("3.4")).toBeNull();
  });
});

describe("jump function (=path)", () => {
  it("=3.4 from the Primary Option Menu equals 3 then 4", () => {
    const a = Sim.loggedOn().cmd("3").cmd("4");
    const b = Sim.loggedOn().cmd("=3.4");
    expect(strip(b)).toEqual(strip(a));
    expect(b.has("JUMP_EXECUTED")).toBe(true);
  });
  it("=3.4 from Utilities", () => {
    const s = Sim.loggedOn().cmd("3").cmd("=3.4");
    expect(s.screenId).toBe("DSLIST_SEARCH");
    expect(s.state.stack.map((f) => f.id)).toEqual(["PRIMARY_OPTION_MENU", "UTILITY_SELECTION"]);
  });
  it("=2 from a DSLIST results panel unwinds the stack first", () => {
    const s = Sim.loggedOn().cmd("3.4").enter({ level: "USER01" }).cmd("=2");
    expect(s.screenId).toBe("EDIT_ENTRY");
    expect(s.state.stack.map((f) => f.id)).toEqual(["PRIMARY_OPTION_MENU"]);
  });
  it("=0 from a member list", () => {
    const s = Sim.loggedOn().cmd("3.4").enter({ level: "USER01.JCL" }).enter({ "cmd:USER01.JCL": "M" }).cmd("=0");
    expect(s.screenId).toBe("SETTINGS");
  });
  it("=3.4 from a modified Edit session ends the edit (saving) before jumping", () => {
    const s = Sim.loggedOn().cmd("2").enter({ other: "USER01.JCL(HELLO)" });
    s.enter({ "line:3": "//STEP1    EXEC PGM=IEBGENER" });
    s.cmd("=3.4");
    expect(s.screenId).toBe("DSLIST_SEARCH");
    expect(s.state.editor).toBeUndefined();
    expect(s.has("MEMBER_SAVED")).toBe(true);
    expect(readRecords(s.state.catalog, { dsn: "USER01.JCL", member: "HELLO" }).records![2]).toContain("IEBGENER");
  });
  it("=1 from Browse", () => {
    const s = Sim.loggedOn().cmd("3.4").enter({ level: "USER01.JCL" }).enter({ "cmd:USER01.JCL": "B" }).enter({ "cmd:HELLO": "B" }).cmd("=1");
    expect(s.screenId).toBe("EDIT_ENTRY");
    expect(s.state.screen).toMatchObject({ mode: "VIEW" });
    expect(s.state.editor).toBeUndefined();
  });
  it("jump on a read-only member that cannot be saved stays in the editor with the message", () => {
    const s = Sim.loggedOn().cmd("2").enter({ other: "SYS1.PARMLIB(PROG00)" });
    s.enter({ "line:1": "APF FORMAT(STATIC)" });
    s.cmd("=3.4");
    expect(s.screenId).toBe("EDIT");
    expect(s.message).toBe("DATA SET IS READ ONLY");
  });
  it("jump only affects the active logical screen", () => {
    const s = Sim.loggedOn().cmd("3.4").pf(2).cmd("=6");
    expect(s.screenId).toBe("TSO_COMMAND");
    expect(s.state.activeScreen).toBe(1);
    expect(allSessions(s.state)[0].screen.id).toBe("DSLIST_SEARCH");
  });
  it("invalid and unavailable destinations are reported without moving", () => {
    const s = Sim.loggedOn().cmd("3.4");
    s.cmd("=9.9");
    expect(s.message).toBe(INVALID_JUMP);
    expect(s.screenId).toBe("DSLIST_SEARCH");
    s.cmd("=5");
    expect(s.message).toBe(NOT_AVAILABLE);
    expect(s.screenId).toBe("DSLIST_SEARCH");
    s.cmd("=abc");
    expect(s.message).toBe(INVALID_JUMP);
  });
});

describe("RETURN", () => {
  it("RETURN from two panels deep goes straight to the Primary Option Menu", () => {
    const s = Sim.loggedOn().cmd("3.4").enter({ level: "USER01" }).cmd("RETURN");
    expect(s.screenId).toBe("PRIMARY_OPTION_MENU");
    expect(s.state.stack).toEqual([]);
    expect(s.has("RETURN_EXECUTED")).toBe(true);
  });
  it("PF4 is RETURN and ends a modified editor by saving", () => {
    const s = Sim.loggedOn().cmd("2").enter({ other: "USER01.JCL(HELLO)" });
    s.pf(4, { "line:4": "//* ADDED BY PF4" });
    expect(s.screenId).toBe("PRIMARY_OPTION_MENU");
    expect(s.has("MEMBER_SAVED")).toBe(true);
    expect(readRecords(s.state.catalog, { dsn: "USER01.JCL", member: "HELLO" }).records![3]).toContain("ADDED BY PF4");
  });
  it("RETURN on the Primary Option Menu is a no-op with a message", () => {
    const s = Sim.loggedOn().cmd("RETURN");
    expect(s.screenId).toBe("PRIMARY_OPTION_MENU");
    expect(s.message).toBe("ALREADY AT PRIMARY MENU");
  });
  it("RETURN differs from PF3: PF3 pops one panel", () => {
    const s = Sim.loggedOn().cmd("3.4").enter({ level: "USER01" }).pf(3);
    expect(s.screenId).toBe("DSLIST_SEARCH");
  });
  it("F4 appears in every logged-on panel legend", () => {
    const s = Sim.loggedOn().cmd("3.4");
    expect(s.rendered().pfKeys.map((k) => k.key)).toContain(4);
  });
});
