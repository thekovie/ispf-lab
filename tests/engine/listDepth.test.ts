import { describe, expect, it } from "vitest";
import { Sim } from "./harness";
import { getDataset, getMember, listMembers } from "@/catalog/catalog";

const dslist = (level = "USER01") => Sim.loggedOn().cmd("3.4").enter({ level });
const rowsText = (s: Sim) => JSON.stringify(s.rendered().rows);
const names = (s: Sim) => s.rendered().fields.filter((f) => f.startsWith("cmd:")).map((f) => f.slice(4));

describe("DSLIST line commands", () => {
  it("S opens short information, I the full panel", () => {
    const s = dslist().enter({ "cmd:USER01.JCL": "S" });
    expect(s.screenId).toBe("DATASET_INFO");
    expect(rowsText(s)).toContain("Short information");
    expect(rowsText(s)).not.toContain("Allocated");
    expect(s.events.some((e) => e.type === "DATASET_INFO_VIEWED" && e.short === true)).toBe(true);
    s.pf(3).enter({ "cmd:USER01.JCL": "I" });
    expect(rowsText(s)).toContain("Allocated");
  });
  it("CO opens Move/Copy prefilled and copies a whole PDS member by member", () => {
    const s = dslist().enter({ "cmd:USER01.JCL": "CO" });
    expect(s.screenId).toBe("MOVE_COPY");
    expect(rowsText(s)).toContain("USER01.JCL");
    s.enter({ option: "", from: "", to: "USER01.JCL.BACKUP" });
    expect(s.message).toBe("DATA SET COPIED");
    expect(s.has("DATASET_COPIED")).toBe(true);
    const copy = getDataset(s.state.catalog, "USER01.JCL.BACKUP")!;
    expect(copy.datasetType).toBe("PDS");
    expect(listMembers(copy).map((m) => m.name)).toEqual(listMembers(getDataset(s.state.catalog, "USER01.JCL")!).map((m) => m.name));
    expect(copy.readOnly).toBe(false);
  });
  it("MO moves: the source disappears; system libraries refuse", () => {
    const s = dslist().enter({ "cmd:USER01.NOTES.TXT": "MO" }).enter({ to: "USER01.NOTES.OLD" });
    expect(s.message).toBe("DATA SET MOVED");
    expect(getDataset(s.state.catalog, "USER01.NOTES.TXT")).toBeUndefined();
    expect(getDataset(s.state.catalog, "USER01.NOTES.OLD")?.records?.length).toBeGreaterThan(0);
    const sys = dslist("SYS1").enter({ "cmd:SYS1.PARMLIB": "MO" });
    expect(sys.message).toBe("DATA SET IS READ ONLY");
  });
  it("X hides a data set behind a marker, NX and RESET bring it back", () => {
    const s = dslist();
    const before = names(s).length;
    s.enter({ "cmd:USER01.LOADLIB": "X" });
    expect(names(s)).not.toContain("USER01.LOADLIB");
    expect(rowsText(s)).toContain("1 Data Set(s) Not Displayed");
    expect(s.has("LIST_LINES_EXCLUDED")).toBe(true);
    s.cmd("RESET");
    expect(names(s).length).toBe(before);
    expect(s.has("LIST_RESET")).toBe(true);
    s.cmd("EXCLUDE USER01 ALL");
    expect(names(s).length).toBe(0);
    expect(s.message).toBe(`${before} DATA SET(S) EXCLUDED`);
    s.cmd("RESET").enter({ "cmd:USER01.JCL": "X" }).cmd("RESET");
    expect(names(s)).toContain("USER01.JCL");
  });
  it("Z compresses a PDS (message only) and refuses a sequential data set", () => {
    const s = dslist().enter({ "cmd:USER01.JCL": "Z" });
    expect(s.message).toBe("COMPRESS COMPLETED");
    expect(s.has("DATASET_COMPRESSED")).toBe(true);
    s.enter({ "cmd:USER01.NOTES.TXT": "Z" });
    expect(s.message).toBe("DATA SET IS NOT PARTITIONED");
  });
  it("= repeats the last line command", () => {
    const s = dslist().enter({ "cmd:USER01.JCL": "=" });
    expect(s.message).toBe("NO PREVIOUS LINE COMMAND");
    s.enter({ "cmd:USER01.JCL": "X" }).enter({ "cmd:USER01.COBOL": "=" });
    expect(names(s)).not.toContain("USER01.COBOL");
  });
});

describe("DSLIST primary commands", () => {
  it("SORT orders by field and direction", () => {
    const s = dslist().cmd("SORT LRECL D");
    expect(s.message).toBe("SORTED BY LRECL");
    expect(s.has("LIST_SORTED")).toBe(true);
    const list = names(s).map((n) => getDataset(s.state.catalog, n)!.lrecl);
    expect([...list].sort((a, b) => b - a)).toEqual(list);
    s.cmd("SORT NAME");
    expect(names(s)).toEqual([...names(s)].sort());
    s.cmd("SORT SIZE");
    expect(s.message).toBe("INVALID SORT FIELD");
  });
  it("FIND positions on the match, RFIND/PF5 continues and wraps", () => {
    const s = dslist().cmd("FIND COBOL");
    expect(s.message).toBe("CHARS 'COBOL' FOUND");
    expect(s.state.focusField).toBe("cmd:USER01.COBOL");
    expect(names(s)[0]).toBe("USER01.COBOL");
    s.cmd("FIND NOPE");
    expect(s.message).toBe("NO CHARS 'NOPE' FOUND");
    s.cmd("FIND USER01").pf(5);
    expect(s.message).toBe("CHARS 'USER01' FOUND");
    expect(s.has("LIST_FIND")).toBe(true);
    const fresh = dslist().pf(5);
    expect(fresh.message).toBe("NO PREVIOUS FIND");
  });
});

describe("multiple line commands per Enter", () => {
  it("immediate commands run top to bottom in one Enter", () => {
    const s = dslist().enter({ "cmd:USER01.JCL": "X", "cmd:USER01.COBOL": "X", "cmd:USER01.DATA": "X" });
    expect(names(s)).not.toContain("USER01.JCL");
    expect(names(s)).not.toContain("USER01.DATA");
    expect(s.message).toBe("3 COMMANDS PROCESSED");
    expect(s.events.some((e) => e.type === "LIST_COMMANDS_PROCESSED" && e.count === 3)).toBe(true);
  });
  it("a panel-opening command suspends the rest; PF3 resumes them", () => {
    // display order is COBOL, DATA, JCL, ...
    const s = dslist().enter({ "cmd:USER01.COBOL": "I", "cmd:USER01.DATA": "X", "cmd:USER01.JCL": "I" });
    expect(s.screenId).toBe("DATASET_INFO");
    expect(rowsText(s)).toContain("USER01.COBOL");
    s.pf(3);
    // X ran on the way back, then the second I opened its panel
    expect(s.screenId).toBe("DATASET_INFO");
    expect(rowsText(s)).toContain("USER01.JCL");
    s.pf(3);
    expect(s.screenId).toBe("DSLIST_RESULTS");
    expect(names(s)).not.toContain("USER01.DATA");
  });
  it("an error stops processing and redisplays the remaining commands", () => {
    const s = dslist().enter({ "cmd:USER01.COBOL": "X", "cmd:USER01.DATA": "Q", "cmd:USER01.JCL": "X" });
    expect(s.message).toBe("INVALID LINE COMMAND");
    expect(names(s)).not.toContain("USER01.COBOL");
    expect(names(s)).toContain("USER01.JCL");
    expect(s.state.fieldValues["cmd:USER01.DATA"]).toBe("Q");
    expect(s.state.fieldValues["cmd:USER01.JCL"]).toBe("X");
    expect(s.state.focusField).toBe("cmd:USER01.DATA");
  });
  it("member list: E on two members edits them one after the other", () => {
    const s = Sim.loggedOn().cmd("2").enter({ other: "USER01.JCL" });
    s.enter({ "cmd:HELLO": "E", "cmd:SORTJOB": "E" });
    expect(s.screenId).toBe("EDIT");
    expect(s.state.editor?.member).toBe("HELLO");
    s.pf(3);
    expect(s.screenId).toBe("EDIT");
    expect(s.state.editor?.member).toBe("SORTJOB");
    s.pf(3);
    expect(s.screenId).toBe("MEMBER_LIST");
  });
  it("a jump out of a suspended sequence discards the parked commands", () => {
    const s = dslist().enter({ "cmd:USER01.JCL": "I", "cmd:USER01.COBOL": "I" });
    s.cmd("=3.4");
    expect(s.screenId).toBe("DSLIST_SEARCH");
    s.enter({ level: "USER01" });
    expect(s.screenId).toBe("DSLIST_RESULTS");
  });
});

describe("member list I, G, J, =", () => {
  const list = () => Sim.loggedOn().cmd("2").enter({ other: "USER01.JCL" });
  it("I shows member statistics", () => {
    const s = list().enter({ "cmd:HELLO": "I" });
    expect(s.screenId).toBe("MEMBER_INFO");
    expect(rowsText(s)).toContain("Version.Mod");
    expect(s.has("MEMBER_INFO_VIEWED")).toBe(true);
    s.pf(3);
    expect(s.screenId).toBe("MEMBER_LIST");
  });
  it("G resets statistics to 01.00 today by the user", () => {
    const s = list();
    s.enter({ "cmd:HELLO": "E" }).enter({ "line:1": "//X", command: "SAVE" }).pf(3);
    expect(getMember(s.state.catalog, "USER01.JCL", "HELLO")!.mod).toBeGreaterThan(0);
    s.enter({ "cmd:HELLO": "G" });
    expect(s.message).toBe("STATISTICS RESET");
    const m = getMember(s.state.catalog, "USER01.JCL", "HELLO")!;
    expect(m).toMatchObject({ version: 1, mod: 0, modifiedBy: "USER01", createdAt: s.state.today });
    expect(s.has("MEMBER_STATS_RESET")).toBe(true);
  });
  it("J submits the member; = repeats", () => {
    const s = list().enter({ "cmd:HELLO": "J" });
    expect(s.message).toBe("JOB USER01H(JOB00001) SUBMITTED");
    expect(s.has("JOB_SUBMITTED")).toBe(true);
    s.enter({ "cmd:HELLO": "G" }).enter({ "cmd:COPYJOB": "=" });
    expect(getMember(s.state.catalog, "USER01.JCL", "COPYJOB")!.mod).toBe(0);
    expect(s.message).toBe("STATISTICS RESET");
  });
});
