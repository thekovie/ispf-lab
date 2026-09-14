# 0010 — UNDO uses whole-buffer snapshots per interaction; edit profiles are per data-set type and persisted separately

Date: 2026-09-14 · Status: Accepted

## Context
Priority 2 adds UNDO, SETUNDO/RECOVERY, and persistent edit profiles. IBM ISPF undoes *interactions* (everything one
Enter or PF key did), keeps undo data in storage (SETUNDO) or in a recovery data set (RECOVERY), and names the edit
profile after the data set type (last qualifier).

## Options
1. Command-level inverse operations (each line op records its inverse) — precise but every op must be paired and
   copy/move/text-split get complicated.
2. Snapshot `{lines, pending, special}` after every interaction that changed the lines; UNDO restores the last one.
   Lines are immutable objects with stable ids, so a snapshot shares structure and costs one array copy.
3. Keep profiles inside the catalog record so they export with it.

## Decision
Option 2 for UNDO (`src/editor/history.ts`, `MAX_HISTORY = 200`, cleared by SAVE/CANCEL/reopen, gated by
`setundo || recovery`). Profiles live in `state.editProfiles` keyed by type name and are persisted under their own
key `ispf-lab:editprofile:v1:<USERID>` (`src/persistence/profileStore.ts`), so *Reset Training Environment* and
catalog import/export do not couple to editor preferences (the Priority 4 bundle exports both explicitly). RECOVERY
only enables UNDO — no recovery data set is simulated; the glossary says so.

## Consequences
- UNDO granularity matches ISPF; several line commands in one Enter are one undo step (tested).
- Memory bound: 200 snapshots × line-array copies; fine for training-size members.
- `RESET_ENVIRONMENT` and `resetProfiles` clear profiles; a malformed stored profile is sanitised field by field.
