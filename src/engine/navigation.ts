/**
 * Navigation primitives + option-path resolution ("3.4", "=3.4").
 * Reference: docs/03-ispf-behaviour-reference.md §Navigation.
 */
import type { Message, ScreenFrame, ScreenId, SimEvent, SimulatorState, StepResult } from "./types";

export const NOT_AVAILABLE = "OPTION NOT AVAILABLE IN THIS TRAINING MODULE";
export const INVALID_OPTION = "INVALID OPTION";

export function info(short: string, long?: string): Message {
  return { short, long, severity: "info" };
}
export function error(short: string, long?: string): Message {
  return { short, long, severity: "error" };
}

export function withMessage(state: SimulatorState, message: Message | undefined): StepResult {
  const events: SimEvent[] = message ? [{ type: "MESSAGE_SHOWN", text: message.short, severity: message.severity }] : [];
  return { state: { ...state, message }, events };
}

export function fail(state: SimulatorState, short: string, long?: string): StepResult {
  return withMessage(state, error(short, long));
}

export function opened(frame: ScreenFrame): SimEvent {
  return { type: "SCREEN_OPENED", screen: frame.id, frame };
}

/** Push the current screen and open `frame`. */
export function push(state: SimulatorState, frame: ScreenFrame, extraEvents: SimEvent[] = []): StepResult {
  return {
    state: { ...state, stack: [...state.stack, state.screen], screen: frame, message: undefined, fieldValues: {}, focusField: undefined },
    events: [...extraEvents, opened(frame)],
  };
}

/** Replace the current screen without growing the stack (e.g. results → refreshed results). */
export function replace(state: SimulatorState, frame: ScreenFrame, message?: Message): StepResult {
  const r = withMessage({ ...state, screen: frame, fieldValues: {}, focusField: undefined }, message);
  return { state: r.state, events: [...r.events, opened(frame)] };
}

/** PF3 / END: return to the previous screen. */
export function pop(state: SimulatorState, message?: Message): StepResult {
  if (state.stack.length === 0) return withMessage(state, message);
  const stack = state.stack.slice(0, -1);
  const frame = state.stack[state.stack.length - 1];
  const r = withMessage({ ...state, stack, screen: frame, fieldValues: {}, focusField: undefined }, message);
  return { state: r.state, events: [...r.events, opened(frame)] };
}

export function jumpHome(state: SimulatorState): StepResult {
  const frame: ScreenFrame = { id: "PRIMARY_OPTION_MENU" };
  return { state: { ...state, stack: [], screen: frame, message: undefined, fieldValues: {}, focusField: undefined }, events: [opened(frame)] };
}

/** Map an option path to the screen it opens. Returns null for unknown / unimplemented paths. */
export function frameForPath(path: string[]): { frame: ScreenFrame; via: ScreenFrame[] } | "not-available" | null {
  const key = path.join(".");
  const util: ScreenFrame = { id: "UTILITY_SELECTION" };
  switch (key) {
    case "0":
      return { frame: { id: "SETTINGS" }, via: [] };
    case "1":
      return { frame: { id: "EDIT_ENTRY", mode: "VIEW" }, via: [] };
    case "2":
      return { frame: { id: "EDIT_ENTRY", mode: "EDIT" }, via: [] };
    case "3":
      return { frame: util, via: [] };
    case "3.1":
      return { frame: { id: "LIBRARY_UTILITY" }, via: [util] };
    case "3.2":
      return { frame: { id: "DATASET_UTILITY" }, via: [util] };
    case "3.3":
      return { frame: { id: "MOVE_COPY" }, via: [util] };
    case "3.4":
      return { frame: { id: "DSLIST_SEARCH" }, via: [util] };
    case "6":
      return { frame: { id: "TSO_COMMAND", output: [] }, via: [] };
    case "S":
    case "SD":
    case "SDSF":
    case "M.5":
      return { frame: { id: "SDSF_MENU" }, via: [] };
    case "4":
    case "5":
    case "7":
    case "8":
    case "9":
    case "10":
    case "11":
    case "3.5":
    case "3.6":
    case "3.7":
    case "3.8":
    case "3.9":
      return "not-available";
    default:
      return null;
  }
}

/** Open a path from the primary menu, pushing intermediate menus so PF3 unwinds naturally. */
export function openPath(state: SimulatorState, path: string[], from: ScreenId): StepResult {
  const resolved = frameForPath(path);
  const option = path.join(".");
  const selected: SimEvent = { type: "OPTION_SELECTED", option, from };
  if (resolved === "not-available") {
    const r = fail(state, NOT_AVAILABLE);
    return { state: r.state, events: [selected, ...r.events] };
  }
  if (!resolved) {
    const r = fail(state, INVALID_OPTION);
    return { state: r.state, events: [selected, ...r.events] };
  }
  let cur: StepResult = { state, events: [selected] };
  for (const via of resolved.via) {
    if (via.id === cur.state.screen.id) continue; // already on this menu (e.g. "4" typed on the Utilities panel)
    const next = push(cur.state, via);
    cur = { state: next.state, events: [...cur.events, ...next.events] };
  }
  const last = push(cur.state, resolved.frame);
  return { state: last.state, events: [...cur.events, ...last.events] };
}
