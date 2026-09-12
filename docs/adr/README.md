# Architecture Decision Records

MADR-style, one decision each, numbered in the order they were made. Status is *Accepted* unless noted.
Write a new ADR the moment a non-obvious choice is made; never rewrite history — supersede.

| # | Decision |
|---|---|
| [0001](0001-nextjs-app-router.md) | Next.js App Router + React 19 + TypeScript + Tailwind v4, pnpm |
| [0002](0002-pure-reducer-engine.md) | Pure reducer engine with an event list; React reads it through an external store |
| [0003](0003-localstorage-adapter.md) | localStorage behind a StorageAdapter (not IndexedDB) |
| [0004](0004-userid-templated-seed.md) | Seed catalog templated on the logon userid; no personal names |
| [0005](0005-enter-applies-edits.md) | Enter/PF processes text edits → line commands → primary command (3270 semantics) |
| [0006](0006-vitest.md) | Vitest with jsdom; engine-level tests over DOM tests |
| [0007](0007-desktop-gate.md) | Simulator gated to ≥1024 px + fine pointer; landing usable everywhere |
| [0008](0008-landing-as-terminal.md) | Landing page in ISPF grammar with a live engine-driven hero |
