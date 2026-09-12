/**
 * ISPF split-screen mode: up to MAX_SCREENS logical screens, each with its own panel stack,
 * editor session and messages. SPLIT (PF2) opens a new screen on the Primary Option Menu,
 * SWAP (PF9) cycles between screens, START opens a screen without splitting, and ending the
 * Primary Option Menu of a screen (PF3 / X) closes that screen.
 * Reference: docs/03-ispf-behaviour-reference.md §Split screen; ISPF User's Guide Vol I "Split-screen mode".
 */
import type { ScreenSession, SimEvent, SimulatorState, StepResult } from "./types";
import { withMessage } from "./navigation";

export const MAX_SCREENS = 8;

export type SystemCommand = { kind: "split" } | { kind: "start" } | { kind: "swap"; target: "NEXT" | "PREV" | "LIST" | number };

/** Commands ISPF processes itself, before the panel sees them. */
export function parseSystemCommand(raw: string | undefined): SystemCommand | null {
  const tokens = (raw ?? "").trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  const [verb, arg] = tokens;
  if (verb === "SPLIT") return { kind: "split" };
  if (verb === "START") return { kind: "start" };
  if (verb === "SWAP") {
    if (!arg || arg === "NEXT") return { kind: "swap", target: "NEXT" };
    if (arg === "PREV") return { kind: "swap", target: "PREV" };
    if (arg === "LIST") return { kind: "swap", target: "LIST" };
    if (/^\d+$/.test(arg)) return { kind: "swap", target: parseInt(arg, 10) };
    return { kind: "swap", target: "NEXT" };
  }
  return null;
}

const SESSION_KEYS = ["screen", "stack", "editor", "activeDataset", "activeMember", "message", "fieldValues", "focusField"] as const;

export function snapshot(state: SimulatorState): ScreenSession {
  return {
    screen: state.screen,
    stack: state.stack,
    editor: state.editor,
    activeDataset: state.activeDataset,
    activeMember: state.activeMember,
    message: state.message,
    fieldValues: state.fieldValues,
    focusField: state.focusField,
  };
}

function freshSession(): ScreenSession {
  return { screen: { id: "PRIMARY_OPTION_MENU" }, stack: [], fieldValues: {} };
}

/** Sessions with the active slot refreshed from the live state. */
export function allSessions(state: SimulatorState): ScreenSession[] {
  const list = state.screens.length ? [...state.screens] : [snapshot(state)];
  list[state.activeScreen] = snapshot(state);
  return list;
}

function activate(state: SimulatorState, sessions: ScreenSession[], index: number): SimulatorState {
  const s = sessions[index];
  const next: SimulatorState = { ...state, screens: sessions, activeScreen: index };
  // clear the live per-screen fields, then overlay the session being activated
  for (const k of SESSION_KEYS) delete (next as unknown as Record<string, unknown>)[k];
  return { ...next, ...s, fieldValues: s.fieldValues ?? {} };
}

/** A one-line description of a session for the swap bar and SWAP LIST. */
export function describeSession(s: ScreenSession): string {
  const f = s.screen;
  switch (f.id) {
    case "EDIT":
    case "BROWSE":
    case "VIEW":
      return `${f.id} ${s.editor ? `${s.editor.dsn}${s.editor.member ? `(${s.editor.member})` : ""}` : ""}`.trim();
    case "MEMBER_LIST":
      return `MEMBERS ${f.dsn}`;
    case "DSLIST_RESULTS":
      return `DSLIST ${f.level}`;
    case "PRIMARY_OPTION_MENU":
      return "PRIMARY";
    default:
      return f.id.replace(/_/g, " ");
  }
}

/** SPLIT / START: open a new logical screen and make it active. Typed drafts stay with the old screen. */
export function splitScreen(state: SimulatorState, drafts: Record<string, string>): StepResult {
  const sessions = allSessions(state);
  if (sessions.length >= MAX_SCREENS) return withMessage(state, { short: "MAXIMUM SCREENS ACTIVE", long: `ISPF allows ${MAX_SCREENS} logical screens; end one with PF3 first.`, severity: "error" });
  sessions[state.activeScreen] = { ...sessions[state.activeScreen], fieldValues: drafts };
  sessions.push(freshSession());
  const index = sessions.length - 1;
  const next = activate(state, sessions, index);
  const events: SimEvent[] = [
    { type: "SCREEN_SPLIT", screens: sessions.length, active: index },
    { type: "SCREEN_OPENED", screen: "PRIMARY_OPTION_MENU", frame: { id: "PRIMARY_OPTION_MENU" } },
  ];
  return { state: { ...next, message: { short: `SCREEN ${index + 1} OF ${sessions.length}`, long: "PF9 (SWAP) returns to the other screen; PF3 here ends this screen.", severity: "info" } }, events };
}

/** SWAP: activate another logical screen. */
export function swapScreen(state: SimulatorState, target: "NEXT" | "PREV" | "LIST" | number, drafts: Record<string, string>): StepResult {
  const sessions = allSessions(state);
  if (sessions.length < 2) return withMessage(state, { short: "SWAP NOT ACTIVE", long: "Only one logical screen is open. Press PF2 (SPLIT) or type START to open another.", severity: "error" });
  if (target === "LIST") {
    return {
      state: { ...state, message: { short: "SWAP LIST", long: sessions.map((s, i) => `${i + 1}${i === state.activeScreen ? "*" : " "} ${describeSession(s)}`).join("  |  "), severity: "info" } },
      events: [],
    };
  }
  let index: number;
  if (target === "NEXT") index = (state.activeScreen + 1) % sessions.length;
  else if (target === "PREV") index = (state.activeScreen - 1 + sessions.length) % sessions.length;
  else index = target - 1;
  if (index < 0 || index >= sessions.length) return withMessage(state, { short: "SCREEN NOT ACTIVE", long: `Screens 1-${sessions.length} are active.`, severity: "error" });
  if (index === state.activeScreen) return { state, events: [] };
  sessions[state.activeScreen] = { ...sessions[state.activeScreen], fieldValues: drafts, message: undefined };
  const next = activate(state, sessions, index);
  return { state: next, events: [{ type: "SCREEN_SWAPPED", from: state.activeScreen, to: index, screens: sessions.length }, { type: "SCREEN_OPENED", screen: next.screen.id, frame: next.screen }] };
}

/** End the active logical screen (PF3 / X on its Primary Option Menu). Returns null when it is the only one. */
export function closeScreen(state: SimulatorState): StepResult | null {
  const sessions = allSessions(state);
  if (sessions.length < 2) return null;
  sessions.splice(state.activeScreen, 1);
  const index = Math.max(0, state.activeScreen - 1);
  const next = activate(state, sessions, index);
  return {
    state: { ...next, message: { short: `SCREEN ENDED`, long: `${sessions.length} screen${sessions.length === 1 ? "" : "s"} remaining.`, severity: "info" } },
    events: [{ type: "SCREEN_CLOSED", screens: sessions.length, active: index }, { type: "SCREEN_OPENED", screen: next.screen.id, frame: next.screen }],
  };
}
