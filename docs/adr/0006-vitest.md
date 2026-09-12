# 0006 — Vitest with jsdom; engine-level tests over DOM tests

Date: 2026-09-11 · Status: Accepted

## Context
The brief lists the command semantics that must be tested and forbids validating lessons through the DOM.

## Options
1. Vitest (fast, ESM-native, first-class TypeScript, matches Vite/Next tooling) driving the pure engine.
2. Jest with ts-jest (slower, more config).
3. Playwright only (slow feedback; would test the UI rather than the semantics).

## Decision
Option 1. Tests live in `tests/<layer>/` and use `tests/engine/harness.ts` to drive the reducer exactly as the UI
does. Browser verification is done manually per phase (project log); Playwright is a later addition.

## Consequences
- 127 tests run in ~2 s.
- UI regressions are caught by walkthroughs, not by unit tests — an accepted gap for the MVP.
