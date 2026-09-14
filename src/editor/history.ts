/**
 * Edit interaction history for UNDO. One snapshot per Enter/PF interaction that changed data;
 * SAVE is a boundary (ISPF: UNDO reverses changes made since the last SAVE). ADR 0010.
 * Reference: ISPF Edit and Edit Macros, "UNDO — Reverse Last Edit Interaction", "SETUNDO", "Edit recovery".
 */
import type { EditorSession, HistorySnapshot } from "./types";

export const MAX_HISTORY = 200;

export function takeSnapshot(s: EditorSession): HistorySnapshot {
  return { lines: s.lines, pending: s.pending, special: s.special, nextId: s.nextId };
}

/** Push `before` onto the history if the interaction changed the data. */
export function recordInteraction(before: EditorSession, after: EditorSession): EditorSession {
  if (before.lines === after.lines) return after;
  const changed = before.lines.length !== after.lines.length || before.lines.some((l, i) => l !== after.lines[i]);
  if (!changed) return after;
  const history = [...after.history, takeSnapshot(before)].slice(-MAX_HISTORY);
  return { ...after, history };
}

export function undoAvailable(s: EditorSession): boolean {
  return s.profile.setundo || s.profile.recovery;
}

export function undo(s: EditorSession): { session: EditorSession; undone: boolean } {
  if (s.history.length === 0) return { session: s, undone: false };
  const snap = s.history[s.history.length - 1];
  const lines = snap.lines;
  const dirty = lines.length !== s.original.length || lines.some((l, i) => l.text !== s.original[i]);
  const session: EditorSession = { ...s, lines, pending: snap.pending, special: snap.special, nextId: snap.nextId, history: s.history.slice(0, -1), dirty };
  return { session, undone: true };
}

export function clearHistory(s: EditorSession): EditorSession {
  return s.history.length ? { ...s, history: [] } : s;
}
