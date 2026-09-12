"use client";
/**
 * React glue around SimulatorStore. Components read state through
 * useSyncExternalStore so the pure engine stays outside React.
 * Reference: docs/02-architecture.md §Application shell.
 */
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { render } from "@/engine/reducer";
import type { RenderedScreen, SimulatorState } from "@/engine/types";
import { createDefaultStorage, MemoryAdapter, type StorageAdapter } from "@/persistence/storage";
import { SimulatorStore } from "./store";

const StoreContext = createContext<SimulatorStore | null>(null);

export function SimulatorProvider({ children, storage }: { children: ReactNode; storage?: StorageAdapter }) {
  // The store is created once per mount. On the server a memory adapter keeps SSR deterministic.
  const store = useMemo(() => new SimulatorStore(storage ?? createDefaultStorage()), [storage]);
  useEffect(() => {
    store.boot();
    const flush = () => store.flush();
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      store.flush();
    };
  }, [store]);
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useSimulatorStore(): SimulatorStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useSimulator must be used inside <SimulatorProvider>");
  return store;
}

const serverSnapshot = new SimulatorStore(new MemoryAdapter(), "2026/01/01");

export interface SimulatorView {
  state: SimulatorState;
  screen: RenderedScreen;
  version: number;
  store: SimulatorStore;
}

export function useSimulator(): SimulatorView {
  const store = useSimulatorStore();
  const version = useSyncExternalStore(store.subscribe, store.getVersion, serverSnapshot.getVersion);
  const state = store.getState();
  const screen = useMemo(() => render(state), [state]);
  return { state, screen, version, store };
}
