import { describe, expect, it } from "vitest";
import { Sim } from "./harness";
import { getMember, readRecords } from "@/catalog/catalog";
import { typedPrefix } from "@/engine/screens/editor";

const openHello = () => Sim.loggedOn().cmd("3.4").enter({ level: "USER01.JCL" }).enter({ "cmd:USER01.JCL": "E" }).enter({ "cmd:HELLO": "E" });
const records = (s: Sim) => readRecords(s.state.catalog, { dsn: "USER01.JCL", member: "HELLO" }).records!.map((r) => r.trimEnd());

describe("typedPrefix", () => {
  it("strips the untouched line-number tail", () => {
    expect(typedPrefix("I00001", "000001")).toBe("I");
    expect(typedPrefix("I50001", "000001")).toBe("I5");
    expect(typedPrefix("D00010", "000010")).toBe("D");
    expect(typedPrefix("DD0003", "000003")).toBe("DD");
    expect(typedPrefix("000003", "000003")).toBe("");
    expect(typedPrefix("C     ", "000003")).toBe("C");
  });
});

describe("editor flow through the reducer", () => {
  it("renders the ISPF editor frame", () => {
    const s = openHello();
    const text = JSON.stringify(s.rendered().rows);
    expect(text).toContain("EDIT       USER01.JCL(HELLO)");
    expect(text).toContain("Columns 00001 00072");
    expect(text).toContain("Top of Data");
    expect(text).toContain("Bottom of Data");
    expect(s.rendered().fields).toContain("prefix:1");
    expect(s.rendered().fields).toContain("line:1");
  });
  it("overwriting a record marks dirty; SAVE persists without leaving", () => {
    const s = openHello();
    s.enter({ "line:3": "//STEP1    EXEC PGM=IEBGENER" });
    expect(s.state.editor?.dirty).toBe(true);
    expect(records(s)[2]).toContain("IEFBR14");
    s.enter({ command: "save" });
    expect(s.screenId).toBe("EDIT");
    expect(s.message).toBe("MEMBER SAVED");
    expect(records(s)[2]).toContain("IEBGENER");
    expect(s.state.editor?.dirty).toBe(false);
    expect(s.has("MEMBER_SAVED")).toBe(true);
    expect(s.has("EDITOR_TEXT_CHANGED")).toBe(true);
  });
  it("CANCEL discards changes and exits to the member list", () => {
    const s = openHello();
    s.enter({ "line:3": "//STEP1    EXEC PGM=CHANGED" });
    s.enter({ command: "CANCEL" });
    expect(s.screenId).toBe("MEMBER_LIST");
    expect(records(s)[2]).toContain("IEFBR14");
    expect(s.has("EDIT_CANCELLED")).toBe(true);
  });
  it("PF3 saves modified data and returns", () => {
    const s = openHello();
    s.pf(3, { "line:3": "//STEP1    EXEC PGM=IEBGENER" });
    expect(s.screenId).toBe("MEMBER_LIST");
    expect(records(s)[2]).toContain("IEBGENER");
    expect(s.has("MEMBER_SAVED")).toBe(true);
  });
  it("PF3 on an unchanged member just returns", () => {
    const s = openHello().pf(3);
    expect(s.screenId).toBe("MEMBER_LIST");
    expect(s.has("MEMBER_SAVED")).toBe(false);
  });
  it("PF12 cancels", () => {
    const s = openHello().pf(12, { "line:1": "changed" });
    expect(s.screenId).toBe("MEMBER_LIST");
    expect(records(s)[0]).not.toContain("changed");
  });
  it("line commands typed over the number: I, D, R", () => {
    const s = openHello();
    const n = s.texts().length;
    s.enter({ "prefix:1": "I00001" });
    expect(s.texts().length).toBe(n + 1);
    expect(s.has("EDITOR_LINE_INSERTED")).toBe(true);
    const blankId = s.lineIds()[1];
    s.enter({ [`line:${blankId}`]: "//* INSERTED" });
    expect(s.texts()[1]).toBe("//* INSERTED");
    s.enter({ [`prefix:${blankId}`]: "D00002" });
    expect(s.texts().length).toBe(n);
    expect(s.has("EDITOR_LINE_DELETED")).toBe(true);
    s.enter({ "prefix:1": "R00001" });
    expect(s.texts()[0]).toBe(s.texts()[1]);
    expect(s.has("EDITOR_LINE_REPEATED")).toBe(true);
  });
  it("C then A over two Enters copies after the destination", () => {
    const s = openHello();
    s.enter({ "prefix:1": "C00001" });
    expect(s.message).toBe("DESTINATION REQUIRED");
    expect(s.state.editor?.pending).toEqual([{ lineId: 1, raw: "C" }]);
    expect(JSON.stringify(s.rendered().rows)).toContain('"value":"C"');
    s.enter({ "prefix:1": "C", "prefix:3": "A00003" });
    expect(s.texts()[3]).toBe(s.texts()[0]);
    expect(s.has("EDITOR_LINES_COPIED")).toBe(true);
  });
  it("invalid prefix command is reported, not ignored", () => {
    const s = openHello().enter({ "prefix:1": "Q00001" });
    expect(s.message).toBe("INVALID LINE COMMAND");
    expect(s.has("MESSAGE_SHOWN")).toBe(true);
  });
  it("FIND and CHANGE work from the command line; PF5 repeats", () => {
    const s = openHello().enter({ command: "FIND EXEC" });
    expect(s.message).toBe("CHARS 'EXEC' FOUND");
    s.enter({ command: "C IEFBR14 IEBGENER" });
    expect(s.texts()[2]).toContain("IEBGENER");
    s.enter({ command: "F NOPE" });
    expect(s.message).toBe("NO CHARS 'NOPE' FOUND");
  });
  it("creating a brand-new member via E on a missing name then SAVE", () => {
    const s = Sim.loggedOn().cmd("2").enter({ other: "USER01.JCL(NEWJOB)" });
    expect(s.screenId).toBe("EDIT");
    expect(s.message).toBe("NEW MEMBER");
    expect(s.state.editor?.lines.length).toBe(0);
    s.enter({ command: "SAVE" });
    expect(getMember(s.state.catalog, "USER01.JCL", "NEWJOB")).toBeDefined();
    expect(s.has("MEMBER_CREATED")).toBe(true);
  });
  it("browse refuses edits and line commands; view refuses SAVE", () => {
    const b = Sim.loggedOn().cmd("3.4").enter({ level: "USER01.JCL" }).enter({ "cmd:USER01.JCL": "B" }).enter({ "cmd:HELLO": "B" });
    expect(b.rendered().fields).toEqual(["command"]);
    b.enter({ command: "SAVE" });
    expect(b.message).toBe("SAVE NOT ALLOWED IN BROWSE");
    const v = Sim.loggedOn().cmd("1").enter({ other: "USER01.JCL(HELLO)" });
    expect(v.screenId).toBe("VIEW");
    v.enter({ command: "SAVE", "line:1": "//CHANGED" });
    expect(v.message).toBe("SAVE NOT ALLOWED IN VIEW");
    v.pf(3);
    expect(records(v)[0]).not.toContain("CHANGED");
  });
  it("read-only library: SAVE fails with a helpful message", () => {
    const s = Sim.loggedOn().cmd("2").enter({ other: "SYS1.PARMLIB(PROG00)" });
    s.enter({ command: "SAVE", "line:1": "APF FORMAT(STATIC)" });
    expect(s.message).toBe("DATA SET IS READ ONLY");
    expect(s.screenId).toBe("EDIT");
  });
  it("scrolls with PF8/PF7 and reports edges", () => {
    const s = Sim.loggedOn().cmd("2").enter({ other: "USER01.JCL(COPYJOB)" });
    s.pf(7);
    expect(s.message).toBe("*** TOP OF DATA ***");
    s.pf(8);
    expect(s.message).toBe("*** BOTTOM OF DATA ***");
  });
});
