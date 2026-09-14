import type { Catalog } from "@/catalog/types";
import { buildSeed } from "@/catalog/seed";
import { KEYS } from "./keys";
import type { StorageAdapter } from "./storage";

export function loadCatalog(storage: StorageAdapter, userid: string): Catalog {
  const stored = storage.get<Catalog>(KEYS.catalog(userid));
  if (stored && stored.version === 1 && stored.datasets) return stored;
  const seeded = buildSeed(userid);
  storage.set(KEYS.catalog(userid), seeded);
  return seeded;
}

export function saveCatalog(storage: StorageAdapter, userid: string, catalog: Catalog): void {
  storage.set(KEYS.catalog(userid), catalog);
}

export function resetCatalog(storage: StorageAdapter, userid: string): Catalog {
  const seeded = buildSeed(userid);
  storage.set(KEYS.catalog(userid), seeded);
  return seeded;
}
