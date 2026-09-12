/**
 * Storage adapter: the only place that touches browser storage.
 * Swap `LocalStorageAdapter` for a backend-backed adapter later (ADR 0003).
 */
export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  keys(): string[];
}

export class MemoryAdapter implements StorageAdapter {
  private store = new Map<string, string>();
  get<T>(key: string): T | null {
    const raw = this.store.get(key);
    return raw === undefined ? null : (JSON.parse(raw) as T);
  }
  set<T>(key: string, value: T): void {
    this.store.set(key, JSON.stringify(value));
  }
  remove(key: string): void {
    this.store.delete(key);
  }
  keys(): string[] {
    return [...this.store.keys()];
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly ls: Storage) {}
  get<T>(key: string): T | null {
    try {
      const raw = this.ls.getItem(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  }
  set<T>(key: string, value: T): void {
    try {
      this.ls.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error("[ispf-lab] storage write failed", key, err);
    }
  }
  remove(key: string): void {
    try {
      this.ls.removeItem(key);
    } catch {
      /* storage unavailable: nothing to remove */
    }
  }
  keys(): string[] {
    const out: string[] = [];
    for (let i = 0; i < this.ls.length; i++) {
      const k = this.ls.key(i);
      if (k) out.push(k);
    }
    return out;
  }
}

/** Returns a LocalStorage adapter in the browser, a memory adapter elsewhere (SSR / tests). */
export function createDefaultStorage(): StorageAdapter {
  if (typeof window !== "undefined" && window.localStorage) {
    return new LocalStorageAdapter(window.localStorage);
  }
  return new MemoryAdapter();
}
