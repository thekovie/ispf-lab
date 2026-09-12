/**
 * Root simulator reducer: (state, action) → { state, events }.
 * Pure and deterministic; the React provider only wraps it.
 * Reference: docs/02-architecture.md §State machine, ADR 0002.
 */
import { buildSeed } from "@/catalog/seed";
import { push } from "./navigation";
import { handlerFor } from "./registry";
import type { RenderedScreen, SimAction, SimEvent, SimulatorState, StepResult } from "./types";

export function reduce(state: SimulatorState, action: SimAction): StepResult {
  switch (action.type) {
    case "ENTER": {
      const handler = handlerFor(state.screen);
      return handler.onEnter(state, state.screen, action.fields);
    }
    case "PF": {
      const handler = handlerFor(state.screen);
      const pressed: SimEvent = { type: "PF_KEY_PRESSED", key: action.key, screen: state.screen.id };
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
        state: { ...state, loggedIn: false, screen: { id: "LOGIN" }, stack: [], editor: undefined, message: undefined, fieldValues: {} },
        events: [{ type: "LOGGED_OFF" }, { type: "SCREEN_OPENED", screen: "LOGIN", frame: { id: "LOGIN" } }],
      };
    case "CLEAR_MESSAGE":
      return { state: state.message ? { ...state, message: undefined } : state, events: [] };
    default:
      return { state, events: [] };
  }
}

export function render(state: SimulatorState): RenderedScreen {
  return handlerFor(state.screen).render(state, state.screen);
}
