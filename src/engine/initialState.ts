import { buildSeed } from "@/catalog/seed";
import { DEFAULT_SETTINGS } from "@/persistence/settingsStore";
import type { SimulatorState } from "./types";

export const DEFAULT_USERID = "USER01";

export function todayString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export function createInitialState(userid = DEFAULT_USERID, today = "2026/01/01"): SimulatorState {
  return {
    userid,
    loggedIn: false,
    today,
    settings: DEFAULT_SETTINGS,
    screen: { id: "LOGIN" },
    stack: [],
    catalog: buildSeed(userid),
    commandHistory: [],
    fieldValues: {},
  };
}
