# 0002 — Pure reducer engine with an event list; React reads it through an external store

Date: 2026-09-11 · Status: Accepted

## Context
The brief demands a centralized, deterministic state machine, semantic events for the tutorial engine, and a
simulator that works without any lesson running. Tests must drive the whole navigation without a DOM.

## Options
1. `reduce(state, action) → { state, events }` as a pure function; a tiny framework-free `SimulatorStore` wraps it
   and fans events out; React subscribes with `useSyncExternalStore`.
2. Zustand/Jotai store with actions as methods (events would have to be bolted on; harder to test in isolation).
3. XState statechart (heavier; panel handlers would be spread across machine config).

## Decision
Option 1. Screen handlers (`render`, `onEnter`, `onPf`) are registered by `ScreenId`; navigation primitives live in
`navigation.ts`. The store persists through the storage adapter and notifies listeners synchronously so the tutorial
runner sees events in order.

## Consequences
- Tests use a 40-line harness (`tests/engine/harness.ts`) and cover every route the UI can take.
- The landing-page hero reuses the same reducer to type a demo — no second implementation.
- The React-compiler lint rejects reading refs during render, so state lives in the store, not in refs.
