import { KEYS } from "./keys";
import type { StorageAdapter } from "./storage";

export interface Settings {
  pfKeysShown: boolean;
  insertMode: boolean;
  scrollDefault: "PAGE" | "HALF" | "CSR" | "DATA";
}

export const DEFAULT_SETTINGS: Settings = { pfKeysShown: true, insertMode: false, scrollDefault: "PAGE" };

export function loadSettings(storage: StorageAdapter): Settings {
  return { ...DEFAULT_SETTINGS, ...(storage.get<Partial<Settings>>(KEYS.settings) ?? {}) };
}

export function saveSettings(storage: StorageAdapter, settings: Settings): void {
  storage.set(KEYS.settings, settings);
}
