# 0009 — Jump (=option), RETURN and split-screen commands are ISPF system commands handled before the panel

Date: 2026-09-14 · Status: Accepted

## Context
`=3.4` originally worked only on the Primary Option Menu and Utilities panels because each panel parsed its own
command line. IBM ISPF treats the jump function, RETURN, SPLIT, SWAP and RETRIEVE as *system commands* that ISPF
processes before the dialog sees the command (ISPF User's Guide Vol I, "Using the jump function").

## Options
1. Add `=`/RETURN handling to every screen handler (17 places, easy to miss on new panels).
2. One system-command layer in the reducer (`engine/systemCommands.ts`) that runs before `handler.onEnter`, plus
   PF2/PF4/PF9 handled the same way.

## Decision
Option 2. `parseSystemCommand` recognises `=path`, `RETURN`, `RETRIEVE`, `SPLIT`, `START`, `SWAP …`. Jump and
RETURN first transmit the screen to the panel (so typed-over records on an editor panel are applied), then run END
processing on an open editor via `closeEditorForNavigation` (save when dirty; a failed save blocks the navigation),
then unwind the active logical screen's stack and — for jump — `openPath` from the Primary Option Menu.

## Consequences
- New panels get jump/RETURN for free.
- `=3.4` produces the identical state to `3` then `4` (tested).
- AUTOSAVE (Priority 2) plugs into `closeEditorForNavigation` in one place.
