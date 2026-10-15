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
    expect(s.state.editor?.lines.every((l) => l.inserted && l.text.trim() === "")).toBe(true); // empty input lines only
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

describe("scroll events carry the amount used (M3, lesson a-01)", () => {
  const longLines = Array.from({ length: 60 }, (_, i) => `LINE ${String(i + 1).padStart(3, "0")}`);
  const openLong = () => {
    const s = Sim.loggedOn();
    const ds = s.state.catalog.datasets["USER01.DATA"];
    const members = { ...ds.members, LONG: { name: "LONG", records: longLines.map((l) => l.padEnd(80)) } };
    s.state = { ...s.state, catalog: { ...s.state.catalog, datasets: { ...s.state.catalog.datasets, "USER01.DATA": { ...ds, members } } } };
    return s.cmd("2").enter({ other: "USER01.DATA(LONG)" });
  };
  const amounts = (s: Sim) => s.events.filter((e) => e.type === "EDITOR_SCROLLED").map((e) => (e as { amount?: string }).amount);
  const top = (s: Sim) => s.state.editor!.top;

  it("PF8 with the Scroll field at PAGE scrolls a page and reports PAGE", () => {
    const s = openLong();
    const page = s.state.editor!.pageSize;
    s.events = [];
    s.pf(8);
    expect(amounts(s)).toEqual(["PAGE"]);
    expect(top(s)).toBe(page);
  });

  it("HALF typed in the Scroll field scrolls half a page and reports HALF", () => {
    const s = openLong();
    const half = Math.floor(s.state.editor!.pageSize / 2);
    s.events = [];
    s.pf(8, { scroll: "HALF" });
    expect(amounts(s)).toEqual(["HALF"]);
    expect(top(s)).toBe(half);
    expect(s.state.editor!.scrollAmount).toBe("HALF");
  });

  it("DOWN 3 on the command line is a one-time amount: it moves 3 lines and the field keeps HALF", () => {
    const s = openLong();
    s.pf(8, { scroll: "HALF" });
    const before = top(s);
    s.events = [];
    s.enter({ command: "DOWN 3" });
    expect(amounts(s)).toEqual(["3"]);
    expect(top(s)).toBe(before + 3);
    expect(s.state.editor!.scrollAmount).toBe("HALF");
  });

  it("DOWN MAX goes to the bottom, reports MAX and leaves the field alone", () => {
    const s = openLong();
    s.events = [];
    s.enter({ command: "DOWN MAX" });
    expect(amounts(s)).toEqual(["MAX"]);
    expect(top(s)).toBe(60 - s.state.editor!.pageSize);
    expect(s.state.editor!.scrollAmount).toBe("PAGE");
  });
});

describe("MAX typed in the Scroll field is one-time (UG1 'Using the scrolling commands': after a MAX scroll the amount reverts)", () => {
  const longLines = Array.from({ length: 60 }, (_, i) => `LINE ${String(i + 1).padStart(3, "0")}`);
  const openLong = () => {
    const s = Sim.loggedOn();
    const ds = s.state.catalog.datasets["USER01.DATA"];
    const members = { ...ds.members, LONG: { name: "LONG", records: longLines.map((l) => l.padEnd(80)) } };
    s.state = { ...s.state, catalog: { ...s.state.catalog, datasets: { ...s.state.catalog.datasets, "USER01.DATA": { ...ds, members } } } };
    return s.cmd("2").enter({ other: "USER01.DATA(LONG)" });
  };

  it("PF8 with MAX in the field goes to the bottom, then the field returns to its previous value", () => {
    const s = openLong();
    s.pf(8, { scroll: "HALF" });
    s.pf(8, { scroll: "MAX" });
    expect(s.state.editor!.top).toBe(60 - s.state.editor!.pageSize);
    expect(s.state.editor!.scrollAmount).toBe("HALF");
  });

  it("with no earlier amount the field returns to PAGE", () => {
    const s = openLong();
    s.pf(8, { scroll: "MAX" });
    expect(s.state.editor!.scrollAmount).toBe("PAGE");
  });

  it("MAX typed but only a command that does not scroll is sent: the field keeps MAX until a scroll", () => {
    const s = openLong();
    s.enter({ scroll: "MAX", command: "LOCATE 5" });
    expect(s.state.editor!.scrollAmount).toBe("MAX");
  });

  it("UP with MAX in the field goes to the top and reverts too", () => {
    const s = openLong();
    s.enter({ command: "DOWN MAX" });
    s.pf(7, { scroll: "MAX" });
    expect(s.state.editor!.top).toBe(0);
    expect(s.state.editor!.scrollAmount).toBe("PAGE");
  });

  it("a one-time MAX on the command line leaves the field as it was", () => {
    const s = openLong();
    s.pf(8, { scroll: "HALF" });
    s.enter({ command: "DOWN MAX" });
    expect(s.state.editor!.scrollAmount).toBe("HALF");
  });
});

describe("a new, empty member offers input lines (M3, lesson b-04; EM: 'several empty lines', quotes in the line command field)", () => {
  const openNew = () => Sim.loggedOn().cmd("2").enter({ other: "USER01.JCL(FRESH)" });
  const prefixes = (s: Sim) => s.rendered().fields.filter((f) => f.startsWith("prefix:"));
  const lineIds = (s: Sim) => s.rendered().fields.filter((f) => f.startsWith("line:")).map((f) => f.slice(5));

  it("shows several empty input lines marked with quotes, and the editor is not dirty", () => {
    const s = openNew();
    expect(lineIds(s).length).toBeGreaterThanOrEqual(3);
    expect(prefixes(s).length).toBe(lineIds(s).length);
    expect(JSON.stringify(s.rendered().rows)).toContain("''''''");
    expect(s.state.editor!.dirty).toBe(false);
  });

  it("SAVE without typing still creates an empty member (lesson 12)", () => {
    const s = openNew();
    s.enter({ command: "SAVE" });
    const m = getMember(s.state.catalog, "USER01.JCL", "FRESH");
    expect(m).toBeDefined();
    expect(m!.records).toEqual([]);
  });

  it("typing on an input line and pressing Enter keeps that record and drops the unused lines", () => {
    const s = openNew();
    const first = lineIds(s)[0];
    s.enter({ [`line:${first}`]: "//FRESH   JOB" });
    expect(s.state.editor!.lines.map((l) => l.text.trim())).toEqual(["//FRESH   JOB"]);
  });

  it("SAVE after typing writes only the typed records", () => {
    const s = openNew();
    s.enter({ [`line:${lineIds(s)[1]}`]: "//FRESH   JOB", command: "SAVE" });
    expect(getMember(s.state.catalog, "USER01.JCL", "FRESH")!.records.map((r) => r.trimEnd())).toEqual(["//FRESH   JOB"]);
  });

  it("an Enter with only a primary command keeps the input lines, so the learner is never left without a place to type", () => {
    const s = openNew();
    const before = lineIds(s).length;
    s.enter({ command: "TOP" });
    expect(lineIds(s).length).toBe(before);
    s.enter({});
    expect(lineIds(s).length).toBe(before);
    expect(s.state.editor!.dirty).toBe(false);
  });

  it("an existing member that holds no records also opens with input lines (EM: any empty member or data set)", () => {
    const s = openNew();
    s.enter({ command: "SAVE" });
    s.pf(3);
    s.cmd("2").enter({ other: "USER01.JCL(FRESH)" });
    expect(lineIds(s).length).toBeGreaterThanOrEqual(3);
    expect(JSON.stringify(s.rendered().rows)).toContain("''''''");
  });

  it("Browse and View of an empty member show no input lines", () => {
    const s = openNew();
    s.enter({ command: "SAVE" });
    for (let i = 0; i < 4 && s.state.screen.id !== "PRIMARY_OPTION_MENU"; i++) s.pf(3);
    s.cmd("1").enter({ other: "USER01.JCL(FRESH)" });
    expect(s.state.editor?.mode).toBe("VIEW");
    expect(JSON.stringify(s.rendered().rows)).not.toContain("''''''");
  });

  it("typing data on one input line drops the others once Enter is pressed, as before", () => {
    const s = openNew();
    s.enter({ [`line:${lineIds(s)[0]}`]: "//FRESH   JOB" });
    s.enter({ command: "TOP" });
    expect(s.state.editor!.lines.map((l) => l.text.trim())).toEqual(["//FRESH   JOB"]);
  });

  it("an existing member is unchanged: no extra input lines", () => {
    const s = Sim.loggedOn().cmd("2").enter({ other: "USER01.JCL(HELLO)" });
    expect(s.state.editor!.lines.every((l) => !l.inserted)).toBe(true);
  });
});
