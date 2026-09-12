# 0005 — Enter/PF processes text edits → line commands → primary command (3270 semantics)

Date: 2026-09-11 · Status: Accepted

## Context
A 3270 terminal buffers typing locally; Enter and PF keys transmit the whole panel. ISPF Edit then applies typed-over
data, then prefix-area commands, then the command line. Reproducing this is the point of the simulator.

## Options
1. Keep drafts in the renderer; submit every field on Enter/PF; the editor screen applies the three phases in order.
2. Apply each keystroke immediately (web-like), and treat Enter as "submit command".

## Decision
Option 1. `Terminal.tsx` holds drafts; `editorScreen.processEnter` runs `applyTextEdits` → `applyLineCommands` →
`applyPrimaryCommand`. PF keys also submit drafts first (PF12 discards). Typed-over line numbers are stripped
(`I50001` → `I5`). Blank inserted lines vanish on the next Enter.

## Consequences
- Learners get the real rhythm ("nothing happens until Enter"), which is what transfers to a real system.
- Field values must survive a redisplay after an error, hence `state.fieldValues`.
