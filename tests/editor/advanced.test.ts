import { describe, expect, it } from "vitest";
import { Sim } from "../engine/harness";
import { getMember, readRecords } from "@/catalog/catalog";
import { profileNameFor } from "@/editor/profile";

const openHello = () => Sim.loggedOn().cmd("2").enter({ other: "USER01.JCL(HELLO)" });
const hello = (s: Sim) => readRecords(s.state.catalog, { dsn: "USER01.JCL", member: "HELLO" }).records!.map((r) => r.trimEnd());
const rowsText = (s: Sim) => JSON.stringify(s.rendered().rows);

describe("UNDO and interaction history", () => {
  it("undoes one interaction at a time, newest first", () => {
    const s = openHello();
    const original = s.texts();
    s.enter({ "line:1": "//FIRST" });
    s.enter({ "line:2": "//SECOND" });
    expect(s.texts()[0]).toBe("//FIRST");
    s.enter({ command: "UNDO" });
    expect(s.texts()[1]).toBe(original[1]);
    expect(s.texts()[0]).toBe("//FIRST");
    expect(s.message).toBe("UNDO COMPLETE");
    expect(s.has("UNDO_EXECUTED")).toBe(true);
    s.enter({ command: "UNDO" });
    expect(s.texts()).toEqual(original);
    expect(s.state.editor?.dirty).toBe(false);
    s.enter({ command: "UNDO" });
    expect(s.message).toBe("NO MORE TO UNDO");
  });
  it("treats several line commands in one Enter as one interaction", () => {
    const s = openHello();
    const n = s.texts().length;
    s.enter({ "prefix:1": "D", "prefix:2": "R", "prefix:4": "I" });
    expect(s.texts().length).toBe(n + 1);
    s.enter({ command: "UNDO" });
    expect(s.texts().length).toBe(n);
    expect(s.state.editor?.history.length).toBe(0);
  });
  it("SAVE is a boundary: earlier interactions are no longer undoable", () => {
    const s = openHello();
    s.enter({ "line:1": "//CHANGED" });
    s.enter({ command: "SAVE" });
    s.enter({ command: "UNDO" });
    expect(s.message).toBe("NO MORE TO UNDO");
    expect(s.texts()[0]).toBe("//CHANGED");
  });
  it("UNDO is refused when SETUNDO and RECOVERY are both OFF, and works again with RECOVERY ON", () => {
    const s = openHello();
    s.enter({ command: "SETUNDO OFF" });
    s.enter({ "line:1": "//X" });
    s.enter({ command: "UNDO" });
    expect(s.message).toBe("UNDO NOT AVAILABLE, SETUNDO OFF");
    s.enter({ command: "RECOVERY ON" });
    s.enter({ "line:2": "//Y" });
    s.enter({ command: "UNDO" });
    expect(s.message).toBe("UNDO COMPLETE");
  });
});

describe("edit profile", () => {
  it("names the profile after the data set type and persists across sessions", () => {
    expect(profileNameFor("USER01.JCL")).toBe("JCL");
    const s = openHello();
    s.enter({ command: "CAPS ON" });
    expect(s.has("PROFILE_CHANGED")).toBe(true);
    expect(s.state.editProfiles.JCL.caps).toBe(true);
    s.pf(3);
    s.cmd("2").enter({ other: "USER01.JCL(COPYJOB)" });
    expect(s.state.editor?.profile.caps).toBe(true);
    s.pf(3);
    s.cmd("2").enter({ other: "USER01.COBOL(HELLO)" });
    expect(s.state.editor?.profile.caps).toBe(false);
  });
  it("CAPS ON upper-cases typed text without touching the rest of the member", () => {
    const s = openHello().enter({ command: "CAPS ON" });
    s.enter({ "line:4": "//* lower case comment" });
    expect(s.texts()[3]).toBe("//* LOWER CASE COMMENT");
    expect(s.texts()[0]).toBe(hello(s)[0]);
  });
  it("PROFILE shows =PROF> special lines that are not saved", () => {
    const s = openHello().enter({ command: "PROFILE" });
    expect(rowsText(s)).toContain("=PROF>");
    expect(rowsText(s)).toContain("AUTOSAVE ON");
    s.enter({ command: "SAVE" });
    expect(hello(s).some((r) => r.includes("=PROF>"))).toBe(false);
    s.enter({ command: "RESET SPECIAL" });
    expect(rowsText(s)).not.toContain("=PROF>");
  });
  it("STATS OFF keeps member statistics unchanged on save", () => {
    const s = openHello().enter({ command: "STATS OFF" });
    const before = getMember(s.state.catalog, "USER01.JCL", "HELLO")!;
    s.enter({ "line:1": "//X", command: "SAVE" });
    const after = getMember(s.state.catalog, "USER01.JCL", "HELLO")!;
    expect(after.mod).toBe(before.mod);
    expect(after.modifiedAt).toBe(before.modifiedAt);
    expect(after.records[0].trimEnd()).toBe("//X");
  });
  it("NUMBER ON writes sequence numbers in columns 73-80; UNNUM removes them", () => {
    const s = openHello().enter({ command: "NUMBER ON" });
    expect(s.state.editor!.lines[0].text.slice(72)).toBe("00000100");
    expect(s.state.editor!.lines[1].text.slice(72)).toBe("00000200");
    s.enter({ command: "UNNUM" });
    expect(s.state.editor!.lines[0].text.slice(72)).toBe("        ");
  });
});

describe("AUTOSAVE", () => {
  it("ON (default): PF3 saves", () => {
    const s = openHello().pf(3, { "line:1": "//SAVED" });
    expect(hello(s)[0]).toBe("//SAVED");
  });
  it("OFF PROMPT: PF3 asks; 1 saves, 2 cancels, PF3 returns to edit", () => {
    const s = openHello().enter({ command: "AUTOSAVE OFF PROMPT" });
    s.pf(3, { "line:1": "//PROMPTED" });
    expect(s.screenId).toBe("AUTOSAVE_PROMPT");
    expect(s.has("AUTOSAVE_PROMPTED")).toBe(true);
    s.pf(3);
    expect(s.screenId).toBe("EDIT");
    s.pf(3);
    s.enter({ choice: "2" });
    expect(s.screenId).toBe("EDIT_ENTRY");
    expect(hello(s)[0]).not.toBe("//PROMPTED");
    s.enter({ other: "USER01.JCL(HELLO)" }).pf(3, { "line:1": "//PROMPTED" }).enter({ choice: "1" });
    expect(hello(s)[0]).toBe("//PROMPTED");
  });
  it("OFF NOPROMPT: PF3 discards", () => {
    const s = openHello().enter({ command: "AUTOSAVE OFF NOPROMPT" });
    s.pf(3, { "line:1": "//LOST" });
    expect(s.screenId).toBe("EDIT_ENTRY");
    expect(hello(s)[0]).not.toBe("//LOST");
    expect(s.has("EDIT_CANCELLED")).toBe(true);
  });
  it("a jump with AUTOSAVE OFF PROMPT stops at the prompt only when there are unsaved changes", () => {
    const s = openHello().enter({ command: "AUTOSAVE OFF PROMPT" });
    s.cmd("=3.4");
    expect(s.screenId).toBe("DSLIST_SEARCH");
    s.cmd("=2").enter({ other: "USER01.JCL(HELLO)" });
    s.enter({ "line:1": "//J" });
    s.cmd("=3.4");
    expect(s.screenId).toBe("AUTOSAVE_PROMPT");
  });
});

describe("special lines: COLS and BOUNDS", () => {
  it("COLS line command inserts a movable =COLS> line that is never saved", () => {
    const s = openHello().enter({ "prefix:2": "COLS" });
    expect(rowsText(s)).toContain("=COLS>");
    expect(rowsText(s)).toContain("----+----1----+----2");
    expect(s.has("COLS_DISPLAYED")).toBe(true);
    s.enter({ "prefix:1": "I" });
    expect(rowsText(s)).toContain("=COLS>");
    s.enter({ command: "SAVE" });
    expect(hello(s).some((r) => r.includes("=COLS>") || r.includes("----+----1"))).toBe(false);
    s.enter({ command: "RESET" });
    expect(rowsText(s)).not.toContain("=COLS>");
  });
  it("a =COLS> line anchored to a deleted record is removed with it", () => {
    const s = openHello().enter({ "prefix:2": "COLS" });
    expect(s.state.editor!.special.length).toBe(1);
    s.enter({ "prefix:2": "D" });
    expect(s.state.editor!.special.length).toBe(0);
    expect(rowsText(s)).not.toContain("=COLS>");
  });
  it("COLS primary command shows a fixed ruler at the top; D on it removes it", () => {
    const s = openHello().enter({ command: "COLS" });
    const specialId = s.state.editor!.special[0].id;
    expect(specialId).toBeLessThan(0);
    s.enter({ [`prefix:${specialId}`]: "D" });
    expect(s.state.editor!.special.length).toBe(0);
  });
  it("BOUNDS restricts FIND/CHANGE and shows =BNDS>", () => {
    const s = openHello();
    s.enter({ command: "BOUNDS 20 72" });
    expect(s.has("BOUNDS_CHANGED")).toBe(true);
    s.enter({ command: "FIND //" }); // the // is in columns 1-2, outside the bounds
    expect(s.message).toBe("NO CHARS '//' FOUND");
    s.enter({ command: "BNDS" });
    expect(rowsText(s)).toContain("=BNDS>");
    s.enter({ command: "BOUNDS 1 72" });
    s.enter({ command: "FIND //" });
    expect(s.message).toBe("CHARS '//' FOUND");
  });
  it("typing < and > on the =BNDS> line sets the bounds", () => {
    const s = openHello().enter({ command: "BNDS" });
    const id = s.state.editor!.special[0].id;
    s.enter({ [`bnds:${id}`]: "    <         >" });
    expect(s.state.editor!.profile.bounds).toEqual({ left: 5, right: 15 });
    expect(s.state.editProfiles.JCL.bounds).toEqual({ left: 5, right: 15 });
  });
});

describe("excluded lines: FLIP and RESET EXCLUDED", () => {
  it("FLIP reverses excluded status; RESET EXCLUDED redisplays", () => {
    const s = openHello().enter({ "prefix:1": "X" });
    s.enter({ command: "FLIP" });
    const ex = s.state.editor!.lines.map((l) => l.excluded);
    expect(ex[0]).toBe(false);
    expect(ex.slice(1).every(Boolean)).toBe(true);
    s.enter({ command: "RESET EXCLUDED" });
    expect(s.state.editor!.lines.every((l) => !l.excluded)).toBe(true);
    expect(s.has("LINES_REDISPLAYED")).toBe(true);
    expect(s.texts().length).toBe(hello(s).length);
  });
});

describe("RETRIEVE", () => {
  it("brings back previous commands newest first and cycles", () => {
    const s = Sim.loggedOn().cmd("3").cmd("4");
    s.pf(3).pf(3);
    s.cmd("RETRIEVE");
    expect(s.state.fieldValues.option).toBe("4");
    expect(s.has("COMMAND_RETRIEVED")).toBe(true);
    s.cmd("RETRIEVE");
    expect(s.state.fieldValues.option).toBe("3");
    s.pf(12);
    expect(s.state.fieldValues.option).toBe("4");
  });
  it("a retrieved command can be edited and re-run", () => {
    const s = Sim.loggedOn().cmd("3.4").pf(3).pf(3).pf(12);
    expect(s.state.fieldValues.option).toBe("3.4");
    s.cmd("3.2");
    expect(s.screenId).toBe("DATASET_UTILITY");
  });
  it("reports an empty stack and does not record RETRIEVE itself", () => {
    const s = Sim.loggedOn().cmd("RETRIEVE");
    expect(s.message).toBe("NO COMMAND TO RETRIEVE");
    expect(s.state.retrieveStack).toEqual([]);
  });
  it("F12 stays Cancel in the editor and on confirmation panels", () => {
    const s = openHello();
    expect(s.rendered().pfKeys.find((k) => k.key === 12)?.label).toBe("Cancel");
    const d = Sim.loggedOn().cmd("3.4").enter({ level: "USER01" }).enter({ "cmd:USER01.LOADLIB": "D" });
    expect(d.rendered().pfKeys.find((k) => k.key === 12)?.label).toBe("Cancel");
    const m = Sim.loggedOn();
    expect(m.rendered().pfKeys.find((k) => k.key === 12)?.label).toBe("Retrieve");
  });
});
