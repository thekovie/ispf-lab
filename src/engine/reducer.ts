/**
 * Root simulator reducer: (state, action) → { state, events }.
 * Pure and deterministic; the React provider only wraps it.
 * Reference: docs/02-architecture.md §State machine, ADR 0002.
 */
import { buildSeed } from "@/catalog/seed";
import { push } from "./navigation";
import { handlerFor } from "./registry";
import { splitScreen, swapScreen } from "./splitScreen";
import { jumpTo, parseSystemCommand, returnToPrimary } from "./systemCommands";
import type { RenderedScreen, SimAction, SimEvent, SimulatorState, StepResult } from "./types";

export function reduce(state: SimulatorState, action: SimAction): StepResult {
  switch (action.type) {
    case "ENTER": {
      if (state.loggedIn) {
        // ISPF system commands (=jump, RETURN, SPLIT, SWAP, START) are processed before the panel sees them.
        const raw = action.fields.option ?? action.fields.command;
        const sys = parseSystemCommand(raw);
        if (sys) {
          const drafts = { ...action.fields, option: "", command: "" };
          const r = runSystemCommand(state, sys, drafts);
          if (r) return { state: r.state, events: [{ type: "COMMAND_ENTERED", screen: state.screen.id, command: (raw ?? "").trim().toUpperCase() }, ...r.events] };
        }
      }
      const handler = handlerFor(state.screen);
      return handler.onEnter(state, state.screen, action.fields);
    }
    case "PF": {
      const handler = handlerFor(state.screen);
      const pressed: SimEvent = { type: "PF_KEY_PRESSED", key: action.key, screen: state.screen.id };
      if (state.loggedIn && (action.key === 2 || action.key === 4 || action.key === 9)) {
        const r = action.key === 2 ? splitScreen(state, action.fields) : action.key === 4 ? runSystemCommand(state, { kind: "return" }, { ...action.fields, command: "", option: "" })! : swapScreen(state, "NEXT", action.fields);
        return { state: r.state, events: [pressed, ...r.events] };
      }
      if (action.key === 1) {
        if (state.screen.id === "HELP") return { state, events: [pressed] };
        const r = push(state, { id: "HELP", topic: state.screen.id });
        return { state: r.state, events: [pressed, ...r.events] };
      }
      const r = handler.onPf?.(state, state.screen, action.key, action.fields) ?? null;
      if (!r) {
        return {
          state: { ...state, message: { short: `PF${action.key} NOT ACTIVE`, long: "That function key does nothing on this panel. The active keys are listed at the bottom.", severity: "info" } },
          events: [pressed, { type: "MESSAGE_SHOWN", text: `PF${action.key} NOT ACTIVE`, severity: "info" }],
        };
      }
      return { state: r.state, events: [pressed, ...r.events] };
    }
    case "SET_CLOCK":
      return { state: { ...state, today: action.today }, events: [] };
    case "LOAD_CATALOG":
      return { state: { ...state, catalog: action.catalog }, events: [] };
    case "LOAD_SETTINGS":
      return { state: { ...state, settings: action.settings }, events: [] };
    case "RESET_ENVIRONMENT": {
      const home: SimulatorState = {
        ...state,
        catalog: buildSeed(state.userid),
        screens: [],
        activeScreen: 0,
        screen: state.loggedIn ? { id: "PRIMARY_OPTION_MENU" } : { id: "LOGIN" },
        stack: [],
        editor: undefined,
        activeDataset: undefined,
        activeMember: undefined,
        fieldValues: {},
        message: { short: "ENVIRONMENT RESET", long: "The training catalog was restored to its original contents.", severity: "info" },
      };
      return { state: home, events: [{ type: "ENVIRONMENT_RESET" }, { type: "SCREEN_OPENED", screen: home.screen.id, frame: home.screen }] };
    }
    case "GOTO": {
      const next: SimulatorState = {
        ...state,
        screen: action.screen,
        stack: action.clearStack ? [] : [...state.stack, state.screen],
        message: undefined,
        fieldValues: {},
        focusField: undefined,
      };
      return { state: next, events: [{ type: "SCREEN_OPENED", screen: action.screen.id, frame: action.screen }] };
    }
    case "LOGOFF":
      return {
        state: { ...state, loggedIn: false, screens: [], activeScreen: 0, screen: { id: "LOGIN" }, stack: [], editor: undefined, message: undefined, fieldValues: {} },
        events: [{ type: "LOGGED_OFF" }, { type: "SCREEN_OPENED", screen: "LOGIN", frame: { id: "LOGIN" } }],
      };
    case "CLEAR_MESSAGE":
      return { state: state.message ? { ...state, message: undefined } : state, events: [] };
    default:
      return { state, events: [] };
  }
}

/** Returns null for system commands handled elsewhere (RETRIEVE arrives in Priority 2). */
function runSystemCommand(state: SimulatorState, sys: NonNullable<ReturnType<typeof parseSystemCommand>>, drafts: Record<string, string>): StepResult | null {
  switch (sys.kind) {
    case "jump":
    case "return": {
      // The screen is transmitted first: typed-over records and prefix commands on an editor panel are applied
      // before the dialog is ended, exactly as they would be by an Enter with the same command.
      const applied = state.editor ? handlerFor(state.screen).onEnter(state, state.screen, drafts) : { state, events: [] };
      const r = sys.kind === "jump" ? jumpTo(applied.state, sys.path) : returnToPrimary(applied.state);
      return { state: r.state, events: [...applied.events, ...r.events] };
    }
    case "swap":
      return swapScreen(state, sys.target, drafts);
    case "split":
    case "start":
      return splitScreen(state, drafts);
    default:
      return null;
  }
}

export function render(state: SimulatorState): RenderedScreen {
  const screen = handlerFor(state.screen).render(state, state.screen);
  if (!state.loggedIn) return screen;
  // Split-screen keys are available on every panel once logged on (ISPF default key table).
  // ISPF default keylist: F2 Split, F4 Return, F9 Swap are available on every panel; the rest is panel-specific.
  const pfKeys = [...screen.pfKeys, { key: 2, label: "Split" }, { key: 4, label: "Return" }, { key: 9, label: "Swap" }].sort((a, b) => a.key - b.key);
  return { ...screen, pfKeys };
}
