import { describe, expect, it } from "vitest";
import { Sim } from "./harness";
import { getDataset, getMember } from "@/catalog/catalog";
import { NOT_AVAILABLE } from "@/engine/navigation";

// The two routes differ only in what was typed (command history / retrieve stack).
const strip = (s: Sim) => {
  const { commandHistory, retrieveStack, retrieveIndex, ...rest } = s.state;
  void commandHistory;
  void retrieveStack;
  void retrieveIndex;
  return rest;
};

describe("logon", () => {
  it("logs on with any userid and seeds the catalog on that HLQ", () => {
    const s = new Sim("abc");
    s.enter({ userid: "abc" });
    expect(s.screenId).toBe("PRIMARY_OPTION_MENU");
    expect(s.state.userid).toBe("ABC");
    expect(getDataset(s.state.catalog, "ABC.JCL")).toBeDefined();
    expect(s.has("LOGGED_ON")).toBe(true);
  });
  it("rejects invalid userids", () => {
    const s = new Sim();
    s.enter({ userid: "1bad" });
    expect(s.screenId).toBe("LOGIN");
    expect(s.message).toBe("INVALID USERID");
  });
});

describe("primary menu navigation", () => {
  it("3 then 4 reaches DSLIST", () => {
    const s = Sim.loggedOn();
    s.cmd("3");
    expect(s.screenId).toBe("UTILITY_SELECTION");
    s.cmd("4");
    expect(s.screenId).toBe("DSLIST_SEARCH");
    expect(s.state.stack.map((f) => f.id)).toEqual(["PRIMARY_OPTION_MENU", "UTILITY_SELECTION"]);
  });
  it("3.4 reaches the identical state", () => {
    const a = Sim.loggedOn().cmd("3").cmd("4");
    const b = Sim.loggedOn().cmd("3.4");
    expect(strip(b)).toEqual(strip(a));
    const c = Sim.loggedOn().cmd("=3.4");
    expect(strip(c)).toEqual(strip(a));
    const d = Sim.loggedOn().cmd("dslist");
    expect(strip(d)).toEqual(strip(a));
  });
  it("PF3 unwinds through the intermediate menu", () => {
    const s = Sim.loggedOn().cmd("3.4");
    s.pf(3);
    expect(s.screenId).toBe("UTILITY_SELECTION");
    s.pf(3);
    expect(s.screenId).toBe("PRIMARY_OPTION_MENU");
    s.pf(3);
    expect(s.screenId).toBe("LOGIN");
  });
  it("unimplemented options show the training message", () => {
    const s = Sim.loggedOn().cmd("4");
    expect(s.screenId).toBe("PRIMARY_OPTION_MENU");
    expect(s.message).toBe(NOT_AVAILABLE);
    expect(Sim.loggedOn().cmd("99").message).toBe("INVALID OPTION");
    expect(Sim.loggedOn().cmd("abc").message).toBe("INVALID OPTION");
  });
  it("opens options 0, 1, 2, 6 and 3.1-3.3", () => {
    expect(Sim.loggedOn().cmd("0").screenId).toBe("SETTINGS");
    expect(Sim.loggedOn().cmd("1").screenId).toBe("EDIT_ENTRY");
    expect(Sim.loggedOn().cmd("2").screenId).toBe("EDIT_ENTRY");
    expect(Sim.loggedOn().cmd("6").screenId).toBe("TSO_COMMAND");
    expect(Sim.loggedOn().cmd("3.1").screenId).toBe("LIBRARY_UTILITY");
    expect(Sim.loggedOn().cmd("3.2").screenId).toBe("DATASET_UTILITY");
    expect(Sim.loggedOn().cmd("3.3").screenId).toBe("MOVE_COPY");
  });
  it("emits OPTION_SELECTED and SCREEN_OPENED events", () => {
    const s = Sim.loggedOn().cmd("3.4");
    expect(s.eventTypes()).toEqual(["COMMAND_ENTERED", "OPTION_SELECTED", "SCREEN_OPENED", "SCREEN_OPENED"]);
  });
  it("PF1 opens help for the current panel", () => {
    const s = Sim.loggedOn().pf(1);
    expect(s.screenId).toBe("HELP");
    s.pf(3);
    expect(s.screenId).toBe("PRIMARY_OPTION_MENU");
  });
});

describe("DSLIST", () => {
  it("searches by level and lists results", () => {
    const s = Sim.loggedOn().cmd("3.4").enter({ level: "user01" });
    expect(s.screenId).toBe("DSLIST_RESULTS");
    expect(s.events.find((e) => e.type === "DATASET_SEARCHED")).toMatchObject({ level: "USER01", results: 6 });
    const text = JSON.stringify(s.rendered().rows);
    expect(text).toContain("USER01.JCL");
    expect(text).toContain("PO");
  });
  it("reports no matches without leaving the panel", () => {
    const s = Sim.loggedOn().cmd("3.4").enter({ level: "NOBODY" });
    expect(s.screenId).toBe("DSLIST_SEARCH");
    expect(s.message).toBe("NO DATA SETS MATCH LEVEL");
  });
  it("M on a PDS opens its member list; E on a PS opens the editor", () => {
    const s = Sim.loggedOn().cmd("3.4").enter({ level: "USER01" });
    s.enter({ "cmd:USER01.JCL": "M" });
    expect(s.screenId).toBe("MEMBER_LIST");
    expect(s.state.screen).toMatchObject({ dsn: "USER01.JCL", mode: "M" });
    s.pf(3);
    s.enter({ "cmd:USER01.NOTES.TXT": "E" });
    expect(s.screenId).toBe("EDIT");
    expect(s.state.editor?.dsn).toBe("USER01.NOTES.TXT");
    expect(s.has("MEMBER_OPENED")).toBe(true);
  });
  it("B on a PDS opens the member list in browse mode; then B on a member opens browse", () => {
    const s = Sim.loggedOn().cmd("3.4").enter({ level: "USER01.JCL" }).enter({ "cmd:USER01.JCL": "B" });
    expect(s.state.screen).toMatchObject({ id: "MEMBER_LIST", mode: "B" });
    s.enter({ "cmd:HELLO": "B" });
    expect(s.screenId).toBe("BROWSE");
    expect(s.state.editor?.mode).toBe("BROWSE");
  });
  it("rejects bad line commands and read-only deletes", () => {
    const s = Sim.loggedOn().cmd("3.4").enter({ level: "SYS1" });
    s.enter({ "cmd:SYS1.PARMLIB": "Z" });
    expect(s.message).toBe("INVALID LINE COMMAND");
    s.enter({ "cmd:SYS1.PARMLIB": "D" });
    expect(s.message).toBe("DATA SET IS READ ONLY");
  });
  it("I shows data set information", () => {
    const s = Sim.loggedOn().cmd("3.4").enter({ level: "USER01" }).enter({ "cmd:USER01.JCL": "I" });
    expect(s.screenId).toBe("DATASET_INFO");
    expect(JSON.stringify(s.rendered().rows)).toContain("PO");
  });
  it("D with confirmation deletes a data set; PF3 cancels", () => {
    const s = Sim.loggedOn().cmd("3.4").enter({ level: "USER01" }).enter({ "cmd:USER01.LOADLIB": "D" });
    expect(s.screenId).toBe("CONFIRM_DELETE");
    s.pf(3);
    expect(getDataset(s.state.catalog, "USER01.LOADLIB")).toBeDefined();
    s.enter({ "cmd:USER01.LOADLIB": "D" }).enter({ confirm: "Y" });
    expect(getDataset(s.state.catalog, "USER01.LOADLIB")).toBeUndefined();
    expect(s.screenId).toBe("DSLIST_RESULTS");
    expect(s.has("DATASET_DELETED")).toBe(true);
  });
  it("R renames a data set", () => {
    const s = Sim.loggedOn().cmd("3.4").enter({ level: "USER01" }).enter({ "cmd:USER01.NOTES.TXT": "R" }).enter({ newname: "USER01.NOTES.OLD" });
    expect(getDataset(s.state.catalog, "USER01.NOTES.OLD")).toBeDefined();
    expect(s.has("DATASET_RENAMED")).toBe(true);
  });
});

describe("member list", () => {
  const openList = () => Sim.loggedOn().cmd("3.4").enter({ level: "USER01.JCL" }).enter({ "cmd:USER01.JCL": "E" });
  it("lists members", () => {
    const s = openList();
    expect(JSON.stringify(s.rendered().rows)).toContain("COPYJOB");
  });
  it("deletes a member with confirmation", () => {
    const s = openList().enter({ "cmd:SORTJOB": "D" });
    expect(s.screenId).toBe("CONFIRM_DELETE");
    s.enter({});
    expect(getMember(s.state.catalog, "USER01.JCL", "SORTJOB")).toBeUndefined();
    expect(s.has("MEMBER_DELETED")).toBe(true);
    expect(s.screenId).toBe("MEMBER_LIST");
  });
  it("renames a member", () => {
    const s = openList().enter({ "cmd:HELLO": "R" }).enter({ newname: "HELLO2" });
    expect(getMember(s.state.catalog, "USER01.JCL", "HELLO2")).toBeDefined();
    expect(s.has("MEMBER_RENAMED")).toBe(true);
  });
  it("copies and moves a member to another data set", () => {
    const s = openList().enter({ "cmd:HELLO": "C" }).enter({ to: "USER01.COBOL(HELLOJCL)" });
    expect(getMember(s.state.catalog, "USER01.COBOL", "HELLOJCL")).toBeDefined();
    expect(getMember(s.state.catalog, "USER01.JCL", "HELLO")).toBeDefined();
    s.enter({ "cmd:SORTJOB": "M" }).enter({ to: "USER01.COBOL" });
    expect(getMember(s.state.catalog, "USER01.COBOL", "SORTJOB")).toBeDefined();
    expect(getMember(s.state.catalog, "USER01.JCL", "SORTJOB")).toBeUndefined();
  });
  it("S NEWNAME in an edit list creates a member (in the catalog on SAVE)", () => {
    const s = openList().cmd("S NEWMEM");
    expect(s.screenId).toBe("EDIT");
    expect(s.state.editor?.isNew).toBe(true);
    expect(getMember(s.state.catalog, "USER01.JCL", "NEWMEM")).toBeUndefined();
    s.enter({ command: "SAVE", [`line:${s.lineIds()[0] ?? 0}`]: "" });
    expect(getMember(s.state.catalog, "USER01.JCL", "NEWMEM")).toBeDefined();
    expect(s.has("MEMBER_CREATED")).toBe(true);
  });
});

describe("option 2 edit entry, 3.2 allocate, 3.3 copy, 6 TSO", () => {
  it("opens DSN(MEMBER) from the entry panel", () => {
    const s = Sim.loggedOn().cmd("2").enter({ other: "user01.jcl(hello)" });
    expect(s.screenId).toBe("EDIT");
    expect(s.state.editor?.member).toBe("HELLO");
  });
  it("allocates a PDS through 3.2 A and it appears in 3.4", () => {
    const s = Sim.loggedOn().cmd("3.2").enter({ option: "A", other: "USER01.TEST.JCL" });
    expect(s.screenId).toBe("ALLOCATE_DATASET");
    s.enter({ units: "TRKS", primary: "5", secondary: "2", dirblocks: "10", recfm: "FB", lrecl: "80" });
    expect(s.screenId).toBe("DATASET_UTILITY");
    expect(s.message).toBe("DATA SET ALLOCATED");
    expect(getDataset(s.state.catalog, "USER01.TEST.JCL")?.datasetType).toBe("PDS");
    expect(s.has("DATASET_ALLOCATED")).toBe(true);
    s.pf(3).cmd("4").enter({ level: "USER01.TEST" });
    expect(JSON.stringify(s.rendered().rows)).toContain("USER01.TEST.JCL");
  });
  it("3.3 copies a member between data sets", () => {
    const s = Sim.loggedOn().cmd("3.3").enter({ option: "C", from: "USER01.JCL(HELLO)", to: "USER01.DATA" });
    expect(s.message).toBe("MEMBER COPIED");
    expect(getMember(s.state.catalog, "USER01.DATA", "HELLO")!.records[0]).toMatch(/JOB/);
  });
  it("3.1 D deletes the named member", () => {
    const s = Sim.loggedOn().cmd("3.1").enter({ option: "D", other: "USER01.REXX", member: "TEST01" }).enter({});
    expect(getMember(s.state.catalog, "USER01.REXX", "TEST01")).toBeUndefined();
  });
  it("TSO LISTCAT from the primary menu opens the shell with output", () => {
    const s = Sim.loggedOn().cmd("TSO LISTCAT LEVEL(USER01)");
    expect(s.screenId).toBe("TSO_COMMAND");
    expect(JSON.stringify(s.rendered().rows)).toContain("USER01.JCL");
    expect(s.has("TSO_COMMAND_ENTERED")).toBe(true);
  });
  it("settings persist in state and PF3 returns", () => {
    const s = Sim.loggedOn().cmd("0").pf(3, { pfkeys: "N", insert: "Y", scroll: "HALF" });
    expect(s.screenId).toBe("PRIMARY_OPTION_MENU");
    expect(s.state.settings).toEqual({ pfKeysShown: false, insertMode: true, scrollDefault: "HALF" });
    expect(s.has("SETTING_CHANGED")).toBe(true);
  });
});
