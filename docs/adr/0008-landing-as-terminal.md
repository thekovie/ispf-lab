# 0008 — Landing page in ISPF grammar with a live engine-driven hero

Date: 2026-09-12 · Status: Accepted

## Context
The user asked for an educational landing page that looks like being "in the mainframe", and design rules forbid
generic template layouts.

## Options
1. Sections styled as ISPF panels (titles, `Row n of 6` markers, dashed rules, `Option ===>` rows) with a hero that
   is the real reducer typing a scripted demo; keyboard `1`–`4` navigation.
2. A conventional marketing page with screenshots.

## Decision
Option 1 (`src/components/landing`). The hero reuses `createInitialState` + `reduce` + `render`, so it is never out
of sync with the simulator. Motion is limited to the typewriter and cursor and stops under reduced motion.

## Consequences
- The landing page bundles the engine (small; pure TypeScript).
- Copy is educational (What is ISPF, panel anatomy, glossary teaser, reference guides) rather than promotional.
