/**
 * Special (non-data) lines: =COLS>, =BNDS>, =PROF>. They are display metadata — never part of the member.
 * Ids are negative so prefix fields cannot collide with data lines. Reference: ISPF Edit "Special lines". ADR 0011.
 */
import type { EditProfile } from "./profile";
import { boundsWindow, profileDisplayLines } from "./profile";
import type { EditorSession, SpecialLine } from "./types";

export function colsRuler(leftCol: number, width: number): string {
  let s = "";
  for (let c = leftCol + 1; c <= leftCol + width; c++) {
    if (c % 10 === 0) s += String((c / 10) % 10);
    else if (c % 5 === 0) s += "+";
    else s += "-";
  }
  return s;
}

/** `<` at the left bound and `>` at the right bound, within the visible window. */
export function boundsRulerText(p: EditProfile, lrecl: number, leftCol: number, width: number): string {
  const { start, end } = boundsWindow(p, lrecl);
  const chars = Array.from({ length: width }, () => " ");
  const l = start - leftCol;
  const r = end - 1 - leftCol;
  if (l >= 0 && l < width) chars[l] = "<";
  if (r >= 0 && r < width) chars[r] = ">";
  return chars.join("");
}

/** Parse a typed-over =BNDS> line back into bounds (1-based). Returns null when nothing usable was typed. */
export function parseBoundsLine(text: string, leftCol: number, lrecl: number): { left: number; right: number } | null {
  const l = text.indexOf("<");
  const r = text.indexOf(">");
  if (l < 0 && r < 0) return null;
  const left = l >= 0 ? leftCol + l + 1 : 1;
  const right = r >= 0 ? leftCol + r + 1 : lrecl;
  if (right < left) return null;
  return { left, right: right >= lrecl ? 0 : right };
}

export function addSpecial(s: EditorSession, kind: SpecialLine["kind"], afterLineId: number | null): EditorSession {
  const id = -(s.special.reduce((m, x) => Math.max(m, -x.id), 0) + 1);
  // One PROF/BNDS block at a time; COLS may appear in several places.
  const filtered = kind === "COLS" ? s.special : s.special.filter((x) => x.kind !== kind);
  return { ...s, special: [...filtered, { id, kind, afterLineId }] };
}

export function removeSpecial(s: EditorSession, id: number): EditorSession {
  return { ...s, special: s.special.filter((x) => x.id !== id) };
}

/** Drop special lines whose anchor data line no longer exists (ISPF removes them with the line). */
export function pruneSpecial(s: EditorSession): EditorSession {
  if (s.special.length === 0) return s;
  const ids = new Set(s.lines.map((l) => l.id));
  const kept = s.special.filter((x) => x.afterLineId === null || ids.has(x.afterLineId));
  return kept.length === s.special.length ? s : { ...s, special: kept };
}

export function clearSpecial(s: EditorSession): EditorSession {
  return s.special.length ? { ...s, special: [] } : s;
}

/** Display rows for one special line; COLS/BNDS are one row, PROF is two. */
export function specialRows(sp: SpecialLine, s: EditorSession, recfm = "FB"): { tag: string; text: string }[] {
  switch (sp.kind) {
    case "COLS":
      return [{ tag: "=COLS>", text: colsRuler(s.leftCol, s.pageCols) }];
    case "BNDS":
      return [{ tag: "=BNDS>", text: boundsRulerText(s.profile, s.lrecl, s.leftCol, s.pageCols) }];
    case "PROF":
      return profileDisplayLines(s.profile, s.lrecl, recfm).map((text) => ({ tag: "=PROF>", text: text.slice(0, s.pageCols) }));
  }
}
