/**
 * Multi-command processing for list panels (DSLIST, member list).
 * ISPF processes every line command typed on a list in one Enter, top to bottom. A command that opens another
 * panel (E, B, V, I, D, R, CO ...) suspends the rest; when that panel ends (PF3) the list resumes with the next
 * command. An error stops processing and leaves the failing and following commands displayed.
 * Reference: docs/03-ispf-behaviour-reference.md §Multiple line commands. IBM ISPF User's Guide Vol II 3.4.
 */
import type { Fields, PendingListCommand, ScreenFrame, ScreenId, SimEvent, SimulatorState, StepResult } from "./types";

/** Every non-blank `cmd:<key>` field in the display order of `orderedKeys`. */
export function collectListCommands(fields: Fields, orderedKeys: string[]): PendingListCommand[] {
  const out: PendingListCommand[] = [];
  for (const key of orderedKeys) {
    const raw = fields[`cmd:${key}`];
    if (raw && raw.trim()) out.push({ key, raw });
  }
  return out;
}

export type ListCommandExec = (state: SimulatorState, key: string, raw: string) => StepResult;

interface ListFrame {
  id: ScreenId;
  pending?: PendingListCommand[];
}

/**
 * Run `entries` in order with `exec`. Frames pushed by a command get the remaining entries parked on the list
 * frame (which is then in the stack) so `onResume` can continue them later.
 */
export function runListCommands(state: SimulatorState, entries: PendingListCommand[], exec: ListCommandExec, screen: ScreenId): StepResult {
  let cur = state;
  const events: SimEvent[] = [];
  let processed = 0;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const r = exec(cur, e.key, e.raw);
    events.push(...r.events);
    if (r.state.message?.severity === "error") {
      // Stop here; redisplay this and the following commands so the operator can correct them.
      const redisplay = Object.fromEntries(entries.slice(i).map((x) => [`cmd:${x.key}`, x.raw]));
      return { state: { ...r.state, fieldValues: { ...r.state.fieldValues, ...redisplay } }, events };
    }
    if (r.state.stack.length > cur.stack.length) {
      const rest = entries.slice(i + 1);
      if (rest.length === 0) return { state: r.state, events };
      const idx = cur.stack.length; // the list frame was pushed at this position
      const stack = r.state.stack.map((fr, j) => (j === idx ? ({ ...(fr as ListFrame), pending: rest } as ScreenFrame) : fr));
      return { state: { ...r.state, stack }, events };
    }
    cur = r.state;
    processed++;
  }
  if (processed > 1 && !cur.message) {
    cur = { ...cur, message: { short: `${processed} COMMANDS PROCESSED`, severity: "info" } };
  }
  if (processed > 1) events.push({ type: "LIST_COMMANDS_PROCESSED", screen, count: processed });
  return { state: cur, events };
}

/** Continue parked commands after a child panel ended. Clears `pending` on the frame first. */
export function resumeListCommands(state: SimulatorState, frame: ScreenFrame & ListFrame, exec: ListCommandExec): StepResult | null {
  const pending = frame.pending;
  if (!pending || pending.length === 0) return null;
  const cleared = { ...frame, pending: undefined } as ScreenFrame;
  return runListCommands({ ...state, screen: cleared }, pending, exec, frame.id);
}
