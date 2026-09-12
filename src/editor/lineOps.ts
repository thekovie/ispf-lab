/**
 * Primitive, immutable operations on editor lines. Used by lineCommands.ts.
 */
import type { EditorLine, EditorSession } from "./types";

const blank = (s: EditorSession): string => "".padEnd(s.lrecl);

export function makeLines(s: EditorSession, texts: string[], inserted = false): { lines: EditorLine[]; nextId: number } {
  let nextId = s.nextId;
  const lines = texts.map((text) => ({ id: nextId++, text, excluded: false, inserted }));
  return { lines, nextId };
}

export function insertBlank(s: EditorSession, afterId: number | null, count: number): EditorSession {
  const { lines: fresh, nextId } = makeLines(s, Array.from({ length: count }, () => blank(s)), true);
  const idx = afterId === null ? -1 : s.lines.findIndex((l) => l.id === afterId);
  const lines = [...s.lines.slice(0, idx + 1), ...fresh, ...s.lines.slice(idx + 1)];
  return { ...s, lines, nextId, cursor: { lineId: fresh[0].id, col: 0 } };
}

export function deleteIds(s: EditorSession, ids: Set<number>): EditorSession {
  return { ...s, lines: s.lines.filter((l) => !ids.has(l.id)), dirty: true };
}

export function repeatLine(s: EditorSession, id: number, count: number): EditorSession {
  const idx = s.lines.findIndex((l) => l.id === id);
  if (idx < 0) return s;
  const { lines: copies, nextId } = makeLines(s, Array.from({ length: count }, () => s.lines[idx].text));
  return { ...s, lines: [...s.lines.slice(0, idx + 1), ...copies, ...s.lines.slice(idx + 1)], nextId, dirty: true };
}

export function repeatBlock(s: EditorSession, fromId: number, toId: number): EditorSession {
  const a = s.lines.findIndex((l) => l.id === fromId);
  const b = s.lines.findIndex((l) => l.id === toId);
  if (a < 0 || b < 0) return s;
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  const { lines: copies, nextId } = makeLines(s, s.lines.slice(lo, hi + 1).map((l) => l.text));
  return { ...s, lines: [...s.lines.slice(0, hi + 1), ...copies, ...s.lines.slice(hi + 1)], nextId, dirty: true };
}

/** Copy (or move) the lines with `sourceIds` to after/before `destId`, `times` copies. */
export function copyOrMove(
  s: EditorSession,
  sourceIds: number[],
  destId: number,
  before: boolean,
  times: number,
  move: boolean,
): EditorSession {
  const sourceSet = new Set(sourceIds);
  const sourceTexts = s.lines.filter((l) => sourceSet.has(l.id)).map((l) => l.text);
  const allCopies: string[] = [];
  for (let i = 0; i < times; i++) allCopies.push(...sourceTexts);
  const { lines: fresh, nextId } = makeLines(s, allCopies);
  const base = move ? s.lines.filter((l) => !sourceSet.has(l.id)) : s.lines;
  const destIdx = base.findIndex((l) => l.id === destId);
  if (destIdx < 0) return s;
  const at = before ? destIdx : destIdx + 1;
  return { ...s, lines: [...base.slice(0, at), ...fresh, ...base.slice(at)], nextId, dirty: true };
}

export function setExcluded(s: EditorSession, ids: Set<number>, excluded: boolean): EditorSession {
  return { ...s, lines: s.lines.map((l) => (ids.has(l.id) ? { ...l, excluded } : l)) };
}

/** Show the first/last `count` lines of the excluded block containing `id`. */
export function showEdgeOfExcludedBlock(s: EditorSession, id: number, count: number, fromStart: boolean): EditorSession {
  const idx = s.lines.findIndex((l) => l.id === id);
  if (idx < 0 || !s.lines[idx].excluded) return s;
  let lo = idx;
  while (lo > 0 && s.lines[lo - 1].excluded) lo--;
  let hi = idx;
  while (hi < s.lines.length - 1 && s.lines[hi + 1].excluded) hi++;
  const ids = new Set<number>();
  if (fromStart) for (let i = lo; i < Math.min(lo + count, hi + 1); i++) ids.add(s.lines[i].id);
  else for (let i = hi; i > Math.max(hi - count, lo - 1); i--) ids.add(s.lines[i].id);
  return setExcluded(s, ids, false);
}

export function transformIds(s: EditorSession, ids: Set<number>, fn: (t: string) => string): EditorSession {
  return {
    ...s,
    lines: s.lines.map((l) => (ids.has(l.id) ? { ...l, text: fn(l.text).padEnd(s.lrecl).slice(0, s.lrecl) } : l)),
    dirty: true,
  };
}

export const shiftLeft = (n: number) => (t: string) => t.slice(n);
export const shiftRight = (n: number) => (t: string) => " ".repeat(n) + t;

/** Text split: break the line at `col`, moving the remainder to a new following line. */
export function textSplit(s: EditorSession, id: number, col: number): EditorSession {
  const idx = s.lines.findIndex((l) => l.id === id);
  if (idx < 0) return s;
  const line = s.lines[idx];
  const head = line.text.slice(0, col).padEnd(s.lrecl);
  const tail = line.text.slice(col).padEnd(s.lrecl).slice(0, s.lrecl);
  const { lines: fresh, nextId } = makeLines(s, [tail]);
  return {
    ...s,
    lines: [...s.lines.slice(0, idx), { ...line, text: head }, ...fresh, ...s.lines.slice(idx + 1)],
    nextId,
    dirty: true,
  };
}

/** Lines inserted by I that are still blank vanish on the next Enter, as in ISPF. */
export function pruneUnusedInserts(s: EditorSession, keepIds: Set<number>): EditorSession {
  const lines = s.lines.filter((l) => !(l.inserted && l.text.trim() === "" && !keepIds.has(l.id)));
  return lines.length === s.lines.length ? s : { ...s, lines };
}

export function idsBetween(s: EditorSession, fromId: number, toId: number): number[] {
  const a = s.lines.findIndex((l) => l.id === fromId);
  const b = s.lines.findIndex((l) => l.id === toId);
  if (a < 0 || b < 0) return [];
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return s.lines.slice(lo, hi + 1).map((l) => l.id);
}

export function idsFrom(s: EditorSession, fromId: number, count: number): number[] {
  const a = s.lines.findIndex((l) => l.id === fromId);
  if (a < 0) return [];
  return s.lines.slice(a, a + count).map((l) => l.id);
}
