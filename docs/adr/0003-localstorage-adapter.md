# 0003 — localStorage behind a StorageAdapter (not IndexedDB)

Date: 2026-09-11 · Status: Accepted

## Context
The brief allows IndexedDB or localStorage. The catalog is small (tens of KB), synchronous access keeps the store
simple, and a backend must be possible later.

## Options
1. localStorage via a `StorageAdapter { get, set, remove, keys }` interface, JSON-serialised, versioned keys.
2. IndexedDB (async; more capacity; more code; harder to keep the reducer synchronous).

## Decision
Option 1. Keys are namespaced (`ispf-lab:catalog:v1:<USERID>`), saves are debounced and flushed on unload,
`MemoryAdapter` serves SSR and tests. Export/import to JSON gives learners a backup path.

## Consequences
- A backend-backed adapter can be dropped in without touching engine or UI.
- Capacity is ~5 MB per origin — far above what a training catalog needs; if it ever matters, IndexedDB can sit
  behind the same interface.
