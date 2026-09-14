import { describe, expect, it } from "vitest";
import { parseOptionCommand } from "@/parsers/optionCommand";
import { parseDslistLineCommand, parseMemberLineCommand } from "@/parsers/listLineCommand";
import { parseEditorLineCommand } from "@/parsers/editorLineCommand";
import { parseEditorPrimaryCommand, tokenize } from "@/parsers/editorPrimaryCommand";
import { parseTsoCommand } from "@/parsers/tsoCommand";

const DQ = String.fromCharCode(34);
const SQ = String.fromCharCode(39);

describe("option command", () => {
  it("parses single and dotted paths", () => {
    expect(parseOptionCommand("3")).toEqual({ kind: "path", path: ["3"], jump: false });
    expect(parseOptionCommand(" 3.4 ")).toEqual({ kind: "path", path: ["3", "4"], jump: false });
    expect(parseOptionCommand("=3.4")).toEqual({ kind: "path", path: ["3", "4"], jump: true });
  });
  it("parses aliases, exit, tso, explain", () => {
    expect(parseOptionCommand("dslist")).toEqual({ kind: "path", path: ["3", "4"], jump: false });
    expect(parseOptionCommand("x").kind).toBe("exit");
    expect(parseOptionCommand("TSO LISTCAT LEVEL(USER01)")).toEqual({ kind: "tso", command: "LISTCAT LEVEL(USER01)" });
    expect(parseOptionCommand("explain pds")).toEqual({ kind: "explain", term: "pds" });
    expect(parseOptionCommand("")).toEqual({ kind: "empty" });
    expect(parseOptionCommand("abc").kind).toBe("invalid");
  });
});

describe("list line commands", () => {
  it("accepts valid and rejects invalid", () => {
    expect(parseDslistLineCommand("e")).toEqual({ ok: true, cmd: "E" });
    expect(parseDslistLineCommand("")).toBeNull();
    expect(parseDslistLineCommand("Z")).toEqual({ ok: false, error: "INVALID LINE COMMAND" });
    expect(parseMemberLineCommand("c")).toEqual({ ok: true, cmd: "C" });
    expect(parseMemberLineCommand("I")).toEqual({ ok: false, error: "INVALID LINE COMMAND" });
  });
});

describe("editor line commands", () => {
  it("parses singles with counts", () => {
    expect(parseEditorLineCommand("I")).toEqual({ ok: true, command: { kind: "single", cmd: "I", count: 1 } });
    expect(parseEditorLineCommand("i5")).toEqual({ ok: true, command: { kind: "single", cmd: "I", count: 5 } });
    expect(parseEditorLineCommand("D3")).toEqual({ ok: true, command: { kind: "single", cmd: "D", count: 3 } });
    expect(parseEditorLineCommand("A")).toEqual({ ok: true, command: { kind: "single", cmd: "A", count: 1 } });
    expect(parseEditorLineCommand("COLS")).toEqual({ ok: true, command: { kind: "single", cmd: "COLS", count: 1 } });
  });
  it("parses blocks", () => {
    expect(parseEditorLineCommand("DD")).toEqual({ ok: true, command: { kind: "block", cmd: "DD" } });
    expect(parseEditorLineCommand("cc")).toEqual({ ok: true, command: { kind: "block", cmd: "CC" } });
    expect(parseEditorLineCommand("MM")).toEqual({ ok: true, command: { kind: "block", cmd: "MM" } });
    expect(parseEditorLineCommand("XX")).toEqual({ ok: true, command: { kind: "block", cmd: "XX" } });
  });
  it("rejects garbage", () => {
    expect(parseEditorLineCommand("Q")).toEqual({ ok: false, error: "INVALID LINE COMMAND" });
    expect(parseEditorLineCommand("I0")).toEqual({ ok: false, error: "INVALID LINE COMMAND" });
    expect(parseEditorLineCommand("   ")).toBeNull();
  });
});

describe("editor primary commands", () => {
  it("tokenizes quoted strings", () => {
    expect(tokenize(`FIND ${DQ}HELLO WORLD${DQ} ALL`)).toEqual(["FIND", "HELLO WORLD", "ALL"]);
    expect(tokenize(`c ${SQ}a${SQ} ${SQ}b c${SQ}`)).toEqual(["c", "a", "b c"]);
  });
  it("parses SAVE / CANCEL / RESET / END", () => {
    expect(parseEditorPrimaryCommand("save")).toEqual({ kind: "save" });
    expect(parseEditorPrimaryCommand("CANCEL")).toEqual({ kind: "cancel" });
    expect(parseEditorPrimaryCommand("CAN")).toEqual({ kind: "cancel" });
    expect(parseEditorPrimaryCommand("reset")).toEqual({ kind: "reset", what: "ALL" });
    expect(parseEditorPrimaryCommand("RESET SPECIAL")).toEqual({ kind: "reset", what: "SPECIAL" });
    expect(parseEditorPrimaryCommand("RES X")).toEqual({ kind: "reset", what: "EXCLUDED" });
    expect(parseEditorPrimaryCommand("AUTOSAVE OFF")).toEqual({ kind: "autosave", mode: "OFF PROMPT" });
    expect(parseEditorPrimaryCommand("AUTOSAVE OFF NOPROMPT")).toEqual({ kind: "autosave", mode: "OFF NOPROMPT" });
    expect(parseEditorPrimaryCommand("BOUNDS 1 72")).toEqual({ kind: "bounds", left: 1, right: 72 });
    expect(parseEditorPrimaryCommand("BNDS")).toEqual({ kind: "bounds", show: true });
    expect(parseEditorPrimaryCommand("undo")).toEqual({ kind: "undo" });
    expect(parseEditorPrimaryCommand("SETUNDO OFF")).toEqual({ kind: "setundo", on: false });
    expect(parseEditorPrimaryCommand("NUMBER ON")).toEqual({ kind: "num", on: true });
    expect(parseEditorPrimaryCommand("end")).toEqual({ kind: "end" });
  });
  it("parses FIND / CHANGE with directions and ALL", () => {
    expect(parseEditorPrimaryCommand(`FIND ${DQ}HELLO${DQ}`)).toEqual({ kind: "find", text: "HELLO", direction: "NEXT" });
    expect(parseEditorPrimaryCommand("f hello first")).toEqual({ kind: "find", text: "hello", direction: "FIRST" });
    expect(parseEditorPrimaryCommand(`CHANGE ${DQ}HELLO${DQ} ${DQ}WORLD${DQ}`)).toEqual({ kind: "change", from: "HELLO", to: "WORLD", all: false, direction: "NEXT" });
    expect(parseEditorPrimaryCommand("c a b all")).toEqual({ kind: "change", from: "a", to: "b", all: true, direction: "NEXT" });
    expect(parseEditorPrimaryCommand("FIND").kind).toBe("invalid");
    expect(parseEditorPrimaryCommand("CHANGE X").kind).toBe("invalid");
  });
  it("parses scrolling, locate, top/bottom", () => {
    expect(parseEditorPrimaryCommand("down 5")).toEqual({ kind: "scroll", direction: "DOWN", amount: { kind: "lines", n: 5 } });
    expect(parseEditorPrimaryCommand("UP MAX")).toEqual({ kind: "scroll", direction: "UP", amount: { kind: "max" } });
    expect(parseEditorPrimaryCommand("RIGHT")).toEqual({ kind: "scroll", direction: "RIGHT", amount: undefined });
    expect(parseEditorPrimaryCommand("L 12")).toEqual({ kind: "locate", line: 12 });
    expect(parseEditorPrimaryCommand("top")).toEqual({ kind: "top" });
  });
  it("flags unknown commands", () => {
    const r = parseEditorPrimaryCommand("FROBNICATE");
    expect(r.kind).toBe("invalid");
    if (r.kind === "invalid") expect(r.error).toBe("COMMAND NOT RECOGNIZED");
  });
});

describe("tso commands", () => {
  it("parses LISTCAT, LISTDS, TIME", () => {
    expect(parseTsoCommand("LISTCAT LEVEL(user01)")).toEqual({ kind: "listcat", level: "USER01" });
    expect(parseTsoCommand(`listds ${SQ}USER01.JCL${SQ} members`)).toEqual({ kind: "listds", dsn: "USER01.JCL", members: true });
    expect(parseTsoCommand("time")).toEqual({ kind: "time" });
    expect(parseTsoCommand("foo")).toMatchObject({ kind: "invalid", error: "COMMAND FOO NOT FOUND" });
  });
});
