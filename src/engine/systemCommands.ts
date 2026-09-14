/**
 * ISPF system commands: processed by ISPF itself before the active panel sees them.
 *   =path   jump function  — end the current dialog and select an option from the Primary Option Menu
 *   RETURN  end every panel of this logical screen back to the Primary Option Menu (PF4)
 *   SPLIT / START / SWAP  split-screen mode (see splitScreen.ts)
 * Reference: docs/03-ispf-behaviour-reference.md §Navigation; ISPF User's Guide Vol I
 * "Using the jump function", "Using the RETURN command". ADR 0009.
 */
import { fail, frameForPath, NOT_AVAILABLE, openPath, opened, withMessage } from "./navigation";
import { closeEditorForNavigation } from "./screens/editor";
import type { ScreenFrame, SimEvent, SimulatorState, StepResult } from "./types";

export type SystemCommand =
  | { kind: "split" }
  | { kind: "start" }
  | { kind: "swap"; target: "NEXT" | "PREV" | "LIST" | number }
  | { kind: "jump"; path: string[] }
  | { kind: "return" }
  | { kind: "retrieve" };

export const INVALID_JUMP = "INVALID JUMP DESTINATION";
export const RETRIEVE_MAX = 25;

/** Record a command for RETRIEVE (newest first, no consecutive duplicates, system commands excluded). */
export function pushRetrieve(state: SimulatorState, raw: string): SimulatorState {
  const cmd = raw.trim();
  if (!cmd || /^RETRIEVE$/i.test(cmd)) return { ...state, retrieveIndex: 0 };
  const stack = state.retrieveStack[0] === cmd ? state.retrieveStack : [cmd, ...state.retrieveStack].slice(0, RETRIEVE_MAX);
  return { ...state, retrieveStack: stack, retrieveIndex: 0 };
}

/** RETRIEVE / F12: put the previous command back on the command line; repeated calls walk further back. */
export function retrieveCommand(state: SimulatorState, fieldId: string): StepResult {
  if (state.retrieveStack.length === 0) return withMessage(state, { short: "NO COMMAND TO RETRIEVE", severity: "info" });
  const idx = state.retrieveIndex % state.retrieveStack.length;
  const command = state.retrieveStack[idx];
  return {
    state: { ...state, retrieveIndex: idx + 1, fieldValues: { ...state.fieldValues, [fieldId]: command }, focusField: fieldId, message: undefined },
    events: [{ type: "COMMAND_RETRIEVED", command }],
  };
}

export function parseSystemCommand(raw: string | undefined): SystemCommand | null {
  const trimmed = (raw ?? "").trim().toUpperCase();
  if (!trimmed) return null;
  if (trimmed.startsWith("=")) {
    const body = trimmed.slice(1);
    if (/^\d+(\.\d+)*$/.test(body)) return { kind: "jump", path: body.split(".") };
    if (body === "S" || body === "SD" || body === "SDSF" || body === "M.5") return { kind: "jump", path: ["S"] };
    return { kind: "jump", path: [] }; // invalid destination; reported by jumpTo
  }
  const [verb, arg] = trimmed.split(/\s+/);
  if (verb === "SPLIT") return { kind: "split" };
  if (verb === "START") return { kind: "start" };
  if (verb === "RETURN") return { kind: "return" };
  if (verb === "RETRIEVE") return { kind: "retrieve" };
  if (verb === "SWAP") {
    if (!arg || arg === "NEXT") return { kind: "swap", target: "NEXT" };
    if (arg === "PREV") return { kind: "swap", target: "PREV" };
    if (arg === "LIST") return { kind: "swap", target: "LIST" };
    if (/^\d+$/.test(arg)) return { kind: "swap", target: parseInt(arg, 10) };
    return { kind: "swap", target: "NEXT" };
  }
  return null;
}

/** Unwind this logical screen to its Primary Option Menu, ending an open editor session first. */
function unwindToPrimary(state: SimulatorState): { state: SimulatorState; events: SimEvent[]; blocked?: StepResult } {
  const closed = closeEditorForNavigation(state);
  if (closed.blocked) return { state, events: [], blocked: closed.blocked };
  const home: ScreenFrame = { id: "PRIMARY_OPTION_MENU" };
  const next: SimulatorState = { ...closed.state, screen: home, stack: [], message: undefined, fieldValues: {}, focusField: undefined };
  return { state: next, events: closed.events };
}

/** =path: like RETURN followed by selecting the option from the Primary Option Menu. */
export function jumpTo(state: SimulatorState, path: string[]): StepResult {
  const from = state.screen.id;
  const label = `=${path.join(".")}`;
  if (path.length === 0) return fail(state, INVALID_JUMP, "A jump is = followed by an option path, e.g. =3.4 or =2.");
  const resolved = frameForPath(path);
  if (resolved === null) return fail(state, INVALID_JUMP, `${label}: no such option. Try =3.4, =2 or =0.`);
  if (resolved === "not-available") return fail(state, NOT_AVAILABLE, `${label} points at an option this training module does not implement.`);
  const un = unwindToPrimary(state);
  if (un.blocked) return un.blocked;
  const r = openPath(un.state, path, from);
  const events: SimEvent[] = [{ type: "JUMP_EXECUTED", path: path.join("."), from }, ...un.events, ...r.events];
  return { state: r.state, events };
}

/** RETURN / PF4: end the whole chain of panels on this logical screen. */
export function returnToPrimary(state: SimulatorState): StepResult {
  const from = state.screen.id;
  if (from === "PRIMARY_OPTION_MENU") return withMessage(state, { short: "ALREADY AT PRIMARY MENU", severity: "info" });
  const un = unwindToPrimary(state);
  if (un.blocked) return un.blocked;
  const home: ScreenFrame = { id: "PRIMARY_OPTION_MENU" };
  return { state: un.state, events: [{ type: "RETURN_EXECUTED", from }, ...un.events, opened(home)] };
}
