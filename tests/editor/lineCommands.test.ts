import { describe, expect, it } from "vitest";
import { openSession, applyTextEdits, bufferRecords } from "@/editor/session";
import { applyLineCommands, LINE_MSG } from "@/editor/lineCommands";
import type { EditorSession } from "@/editor/types";

const open = (records = ["L1", "L2", "L3", "L4", "L5"]): EditorSession =>
  openSession({ mode: "EDIT", dsn: "USER01.JCL", member: "HELLO", lrecl: 10, readOnly: false, records });

const texts = (s: EditorSession) => bufferRecords(s).map((t) => t.trimEnd());
const idAt = (s: EditorSession, i: number) => s.lines[i].id;

describe("insert / delete / repeat", () => {
  it("I inserts one blank line after the target", () => {
    const s = open();
    const r = applyLineCommands(s, { [idAt(s, 1)]: "I" });
    expect(texts(r.session)).toEqual(["L1", "L2", "", "L3", "L4", "L5"]);
    expect(r.events).toEqual([{ type: "EDITOR_LINE_INSERTED", count: 1 }]);
    expect(r.session.cursor.lineId).toBe(r.session.lines[2].id);
  });
  it("I5 inserts five blank lines", () => {
    const s = open();
    const r = applyLineCommands(s, { [idAt(s, 0)]: "i5" });
    expect(r.session.lines.length).toBe(10);
  });
  it("blank inserted lines vanish on the next Enter unless typed on", () => {
    const s = open();
    const r1 = applyLineCommands(s, { [idAt(s, 0)]: "I2" }).session;
    const kept = applyTextEdits(r1, { [r1.lines[1].id]: "NEW" }).session;
    const r2 = applyLineCommands(kept, {});
    expect(texts(r2.session)).toEqual(["L1", "NEW", "L2", "L3", "L4", "L5"]);
  });
  it("D deletes one line, D3 deletes three", () => {
    const s = open();
    expect(texts(applyLineCommands(s, { [idAt(s, 2)]: "D" }).session)).toEqual(["L1", "L2", "L4", "L5"]);
    const r = applyLineCommands(s, { [idAt(s, 1)]: "D3" });
    expect(texts(r.session)).toEqual(["L1", "L5"]);
    expect(r.session.dirty).toBe(true);
    expect(r.events).toEqual([{ type: "EDITOR_LINE_DELETED", count: 3 }]);
  });
  it("DD ... DD deletes the block", () => {
    const s = open();
    const r = applyLineCommands(s, { [idAt(s, 1)]: "DD", [idAt(s, 3)]: "DD" });
    expect(texts(r.session)).toEqual(["L1", "L5"]);
    expect(r.session.pending).toEqual([]);
  });
  it("a single DD stays pending with BLOCK COMMAND INCOMPLETE", () => {
    const s = open();
    const r = applyLineCommands(s, { [idAt(s, 1)]: "DD" });
    expect(texts(r.session)).toEqual(["L1", "L2", "L3", "L4", "L5"]);
    expect(r.session.pending).toEqual([{ lineId: idAt(s, 1), raw: "DD" }]);
    expect(r.message?.text).toBe(LINE_MSG.BLOCK_INCOMPLETE);
    const r2 = applyLineCommands(r.session, { [idAt(s, 2)]: "DD" });
    expect(texts(r2.session)).toEqual(["L1", "L4", "L5"]);
  });
  it("R repeats a line, R2 repeats twice, RR repeats a block", () => {
    const s = open();
    expect(texts(applyLineCommands(s, { [idAt(s, 0)]: "R" }).session)).toEqual(["L1", "L1", "L2", "L3", "L4", "L5"]);
    expect(texts(applyLineCommands(s, { [idAt(s, 4)]: "R2" }).session)).toEqual(["L1", "L2", "L3", "L4", "L5", "L5", "L5"]);
    expect(texts(applyLineCommands(s, { [idAt(s, 0)]: "RR", [idAt(s, 1)]: "RR" }).session)).toEqual(["L1", "L2", "L1", "L2", "L3", "L4", "L5"]);
  });
});

describe("copy and move", () => {
  it("C + A copies after the destination", () => {
    const s = open();
    const r = applyLineCommands(s, { [idAt(s, 0)]: "C", [idAt(s, 3)]: "A" });
    expect(texts(r.session)).toEqual(["L1", "L2", "L3", "L4", "L1", "L5"]);
    expect(r.events).toEqual([{ type: "EDITOR_LINES_COPIED", count: 1, detail: "A" }]);
  });
  it("C + B copies before the destination", () => {
    const s = open();
    const r = applyLineCommands(s, { [idAt(s, 4)]: "C", [idAt(s, 0)]: "B" });
    expect(texts(r.session)).toEqual(["L5", "L1", "L2", "L3", "L4", "L5"]);
  });
  it("M + A moves (source removed)", () => {
    const s = open();
    const r = applyLineCommands(s, { [idAt(s, 0)]: "M", [idAt(s, 4)]: "A" });
    expect(texts(r.session)).toEqual(["L2", "L3", "L4", "L5", "L1"]);
    expect(r.events[0].type).toBe("EDITOR_LINES_MOVED");
  });
  it("MM ... MM + B moves a block before", () => {
    const s = open();
    const r = applyLineCommands(s, { [idAt(s, 3)]: "MM", [idAt(s, 4)]: "MM", [idAt(s, 0)]: "B" });
    expect(texts(r.session)).toEqual(["L4", "L5", "L1", "L2", "L3"]);
  });
  it("CC ... CC + A3 copies the block three times", () => {
    const s = open(["A", "B", "C"]);
    const r = applyLineCommands(s, { [idAt(s, 0)]: "CC", [idAt(s, 1)]: "CC", [idAt(s, 2)]: "A2" });
    expect(texts(r.session)).toEqual(["A", "B", "C", "A", "B", "A", "B"]);
  });
  it("C without a destination stays pending and asks for one; A on a later Enter completes it", () => {
    const s = open();
    const r = applyLineCommands(s, { [idAt(s, 0)]: "C" });
    expect(r.message?.text).toBe(LINE_MSG.DEST_REQUIRED);
    expect(texts(r.session)).toEqual(["L1", "L2", "L3", "L4", "L5"]);
    const r2 = applyLineCommands(r.session, { [idAt(s, 2)]: "A" });
    expect(texts(r2.session)).toEqual(["L1", "L2", "L3", "L1", "L4", "L5"]);
    expect(r2.session.pending).toEqual([]);
  });
  it("two sources for one destination is a conflict", () => {
    const s = open();
    const r = applyLineCommands(s, { [idAt(s, 0)]: "C", [idAt(s, 1)]: "C", [idAt(s, 3)]: "A" });
    expect(r.message).toEqual({ text: LINE_MSG.CONFLICT, severity: "error" });
    expect(texts(r.session)).toEqual(["L1", "L2", "L3", "L4", "L5"]);
  });
  it("blanking a pending command cancels it", () => {
    const s = open();
    const r = applyLineCommands(s, { [idAt(s, 0)]: "C" });
    const r2 = applyLineCommands(r.session, { [idAt(s, 0)]: "" });
    expect(r2.session.pending).toEqual([]);
  });
});

describe("exclude, invalid, browse", () => {
  it("X excludes and XX ... XX excludes a block", () => {
    const s = open();
    const r = applyLineCommands(s, { [idAt(s, 1)]: "XX", [idAt(s, 2)]: "XX" });
    expect(r.session.lines.map((l) => l.excluded)).toEqual([false, true, true, false, false]);
  });
  it("rejects garbage with INVALID LINE COMMAND and keeps text", () => {
    const s = open();
    const r = applyLineCommands(s, { [idAt(s, 0)]: "ZZ" });
    expect(r.message).toEqual({ text: "INVALID LINE COMMAND", severity: "error" });
    expect(texts(r.session)).toEqual(["L1", "L2", "L3", "L4", "L5"]);
  });
  it("browse refuses line commands", () => {
    const s = openSession({ mode: "BROWSE", dsn: "X", lrecl: 10, readOnly: true, records: ["A"] });
    expect(applyLineCommands(s, { [s.lines[0].id]: "D" }).message?.text).toBe(LINE_MSG.BROWSE);
  });
});

describe("text edits", () => {
  it("overwriting record text marks the session dirty and pads to LRECL", () => {
    const s = open();
    const r = applyTextEdits(s, { [idAt(s, 0)]: "HELLO" });
    expect(r.session.dirty).toBe(true);
    expect(r.session.lines[0].text).toBe("HELLO     ");
    expect(r.events).toEqual([{ type: "EDITOR_TEXT_CHANGED", count: 1 }]);
    expect(applyTextEdits(s, { [idAt(s, 0)]: "L1" }).session.dirty).toBe(false);
  });
});
