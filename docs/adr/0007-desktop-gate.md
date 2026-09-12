# 0007 — Simulator gated to ≥1024 px + fine pointer; landing usable everywhere

Date: 2026-09-12 · Status: Accepted

## Context
The user asked that mobile visitors be blocked from the emulator (it needs a keyboard and 80 columns) and told to use
a desktop or laptop, while the landing page stays accessible.

## Options
1. `useIsSimulatorCapable()`: `innerWidth ≥ 1024` and `matchMedia("(pointer: fine)")`, re-checked on resize;
   `/lab/*` renders a terminal-styled notice instead of mounting the simulator.
2. User-agent sniffing (fragile; tablets with keyboards mis-classified).
3. Let it render and rely on CSS (touch keyboards cannot send F-keys; the experience would be broken).

## Decision
Option 1, implemented with `useSyncExternalStore` returning `"unknown"` during SSR so the first client paint matches
the server. The landing CTA shows the same notice inline on small devices.

## Consequences
- Providers under the gate only mount on the client, which lets them read browser storage in state initializers
  without hydration mismatches.
- Touch tablets with a keyboard and a mouse pass the gate if they are wide enough.
