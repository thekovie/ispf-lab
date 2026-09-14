/**
 * Framework-free simulator store: wraps the pure reducer, persists through the
 * storage adapter, and fans events out to listeners. React reads it with
 * useSyncExternalStore (see SimulatorProvider).
 */
import { createInitialState, DEFAULT_USERID, todayString } from "@/engine/initialState";
import { reduce } from "@/engine/reducer";
import type { SimAction, SimEvent, SimulatorState } from "@/engine/types";
import { loadCatalog, resetCatalog, saveCatalog } from "@/persistence/catalogStore";
import { loadProfiles, resetProfiles, saveProfiles } from "@/persistence/profileStore";
import { KEYS } from "@/persistence/keys";
import { loadSettings, saveSettings } from "@/persistence/settingsStore";
import type { StorageAdapter } from "@/persistence/storage";

export type EventListener = (events: SimEvent[], state: SimulatorState) => void;

const SAVE_DEBOUNCE_MS = 150;

export class SimulatorStore {
  private state: SimulatorState;
  private version = 0;
  private renderListeners = new Set<() => void>();
  private eventListeners = new Set<EventListener>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly storage: StorageAdapter, today = todayString()) {
    this.state = createInitialState(DEFAULT_USERID, today);
  }

  /** Load persisted settings and the last userid. Called after mount so SSR and first client render match. */
  boot = (): void => {
    const last = this.storage.get<string>(KEYS.lastUserid) ?? DEFAULT_USERID;
    let s: SimulatorState = { ...this.state, userid: last, fieldValues: { userid: last }, today: todayString() };
    s = reduce(s, { type: "LOAD_SETTINGS", settings: loadSettings(this.storage) }).state;
    this.state = s;
    this.version++;
    for (const l of this.renderListeners) l();
  };

  getState = (): SimulatorState => this.state;
  getVersion = (): number => this.version;

  subscribe = (listener: () => void): (() => void) => {
    this.renderListeners.add(listener);
    return () => this.renderListeners.delete(listener);
  };

  onEvents = (listener: EventListener): (() => void) => {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  };

  dispatch = (action: SimAction): SimEvent[] => {
    const prev = this.state;
    const r = reduce(prev, action);
    this.state = r.state;
    for (const e of r.events) {
      if (e.type === "LOGGED_ON") {
        const catalog = loadCatalog(this.storage, e.userid);
        this.state = reduce(this.state, { type: "LOAD_CATALOG", catalog }).state;
        this.state = reduce(this.state, { type: "LOAD_PROFILES", profiles: loadProfiles(this.storage, e.userid) }).state;
        this.storage.set(KEYS.lastUserid, e.userid);
      }
    }
    this.persist(prev);
    this.version++;
    for (const l of this.renderListeners) l();
    for (const l of this.eventListeners) l(r.events, this.state);
    return r.events;
  };

  enter = (fields: Record<string, string>): SimEvent[] => this.dispatch({ type: "ENTER", fields });
  pf = (key: number, fields: Record<string, string>): SimEvent[] => this.dispatch({ type: "PF", key, fields });

  resetEnvironment = (): void => {
    resetCatalog(this.storage, this.state.userid);
    resetProfiles(this.storage, this.state.userid);
    this.dispatch({ type: "RESET_ENVIRONMENT" });
  };

  /** Flush a pending catalog save immediately (used before page unload). */
  flush = (): void => {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (this.state.loggedIn) saveCatalog(this.storage, this.state.userid, this.state.catalog);
  };

  private persist(prev: SimulatorState): void {
    const s = this.state;
    if (s.settings !== prev.settings) saveSettings(this.storage, s.settings);
    if (s.loggedIn && s.editProfiles !== prev.editProfiles) saveProfiles(this.storage, s.userid, s.editProfiles);
    if (s.loggedIn && s.catalog !== prev.catalog) {
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => {
        this.saveTimer = null;
        saveCatalog(this.storage, s.userid, s.catalog);
      }, SAVE_DEBOUNCE_MS);
    }
  }
}
