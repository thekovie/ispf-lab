import { describe, expect, it } from "vitest";
import { openSession, bufferRecords } from "@/editor/session";
import { applyPrimaryCommand } from "@/editor/primaryCommands";
import { parseEditorPrimaryCommand } from "@/parsers/editorPrimaryCommand";
import type { EditorSession } from "@/editor/types";

const run = (s: EditorSession, cmd: string) => applyPrimaryCommand(s, parseEditorPrimaryCommand(cmd));
const open = (records: string[], mode: "EDIT" | "BROWSE" | "VIEW" = "EDIT") =>
  openSession({ mode, dsn: "USER01.JCL", member: "HELLO", lrecl: 20, readOnly: false, records, pageSize: 3 });
const texts = (s: EditorSession) => bufferRecords(s).map((t) => t.trimEnd());

describe("SAVE / CANCEL / END effects", () => {
  it("returns effects for the engine", () => {
    const s = open(["A"]);
    expect(run(s, "SAVE").effect).toEqual({ kind: "save" });
    expect(run(s, "CANCEL").effect).toEqual({ kind: "cancel" });
    expect(run(s, "END").effect).toEqual({ kind: "end" });
  });
  it("refuses SAVE in browse and view", () => {
    expect(run(open(["A"], "BROWSE"), "SAVE").message?.text).toBe("SAVE NOT ALLOWED IN BROWSE");
    expect(run(open(["A"], "VIEW"), "SAVE").message?.text).toBe("SAVE NOT ALLOWED IN VIEW");
  });
  it("reports unknown commands", () => {
    expect(run(open(["A"]), "BOGUS").message).toEqual({ text: "COMMAND NOT RECOGNIZED", severity: "error" });
  });
});

describe("FIND", () => {
  const s = open(["//HELLO JOB", "//STEP1 EXEC", "// HELLO AGAIN", "//END"]);
  it("finds the first hit and positions the cursor", () => {
    const r = run(s, "FIND HELLO");
    expect(r.message?.text).toBe("CHARS 'HELLO' FOUND");
    expect(r.session.cursor).toEqual({ lineId: 1, col: 2 });
  });
  it("RFIND continues to the next hit and reports bottom of data", () => {
    const r1 = run(s, "F hello");
    const r2 = run(r1.session, "RFIND");
    expect(r2.session.cursor.lineId).toBe(3);
    const r3 = run(r2.session, "RFIND");
    expect(r3.message?.text).toBe("*BOTTOM OF DATA REACHED*");
  });
  it("reports missing strings", () => {
    expect(run(s, "FIND NOPE").message).toEqual({ text: "NO CHARS 'NOPE' FOUND", severity: "error" });
  });
  it("scrolls so the hit is visible", () => {
    const r = run(s, "FIND END");
    expect(r.session.top).toBe(3);
  });
});

describe("CHANGE", () => {
  const s = open(["HELLO WORLD", "HELLO AGAIN"]);
  it("changes the first occurrence", () => {
    const r = run(s, 'CHANGE "HELLO" "BYE"');
    expect(texts(r.session)).toEqual(["BYE WORLD", "HELLO AGAIN"]);
    expect(r.session.dirty).toBe(true);
    expect(r.message?.text).toBe("CHARS 'HELLO' CHANGED TO 'BYE'");
  });
  it("changes all occurrences with ALL", () => {
    const r = run(s, "C HELLO BYE ALL");
    expect(texts(r.session)).toEqual(["BYE WORLD", "BYE AGAIN"]);
    expect(r.message?.text).toBe("2 CHARS 'HELLO' CHANGED TO 'BYE'");
  });
  it("RCHANGE repeats the last change", () => {
    const r1 = run(s, "C HELLO BYE");
    const r2 = run(r1.session, "RCHANGE");
    expect(texts(r2.session)).toEqual(["BYE WORLD", "BYE AGAIN"]);
  });
});

describe("scrolling and exclude", () => {
  const s = open(["1", "2", "3", "4", "5", "6", "7"]);
  it("DOWN pages, UP returns, TOP/BOTTOM jump, LOCATE positions", () => {
    const d = run(s, "DOWN");
    expect(d.session.top).toBe(3);
    expect(run(d.session, "UP").session.top).toBe(0);
    expect(run(s, "BOTTOM").session.top).toBe(4);
    expect(run(s, "L 5").session.top).toBe(4);
    expect(run(s, "UP").message?.text).toBe("*** TOP OF DATA ***");
  });
  it("EXCLUDE hides matching lines, RESET shows them", () => {
    const x = run(s, "X 3");
    expect(x.session.lines[2].excluded).toBe(true);
    expect(run(x.session, "RESET").session.lines[2].excluded).toBe(false);
  });
  it("LEFT/RIGHT shift columns", () => {
    const wide = openSession({ mode: "EDIT", dsn: "X", lrecl: 200, readOnly: false, records: ["A"] });
    const r = run(wide, "RIGHT");
    expect(r.session.leftCol).toBe(72);
    expect(run(wide, "LEFT").message?.text).toBe("*** LEFT EDGE ***");
  });
});
