# 0011 — Special lines (=COLS>, =BNDS>, =PROF>) are session-only rows with negative ids

Date: 2026-09-14 · Status: Accepted

## Context
ISPF displays several kinds of non-data lines in the edit area: `=COLS>`, `=BNDS>`, `=PROF>`, `=NOTE=`, `=MSG>`.
They participate in the display (and `D`/RESET remove them) but are never part of the data. The MVP had a single
`colsAfter` line id.

## Options
1. Store special lines as real `EditorLine`s with a `special` flag, filtering them out on save and in every op.
2. Keep them in `session.special: {id<0, kind, afterLineId|null, text?}[]` and merge them only at render time.

## Decision
Option 2 (`src/editor/special.ts`). Negative ids make prefix-area input on a special line distinguishable
(`prefix:-1`): `D` removes it, anything else is `INVALID LINE COMMAND`. `bufferRecords`, line commands, FIND and
history never see special lines; `addSpecial` keeps at most one BNDS and one PROF block. `=BNDS>` is the only editable
special line (`bnds:<id>` field → `parseBoundsLine`).

## Consequences
- Zero risk of a ruler being written to a member (tested: SAVE after COLS/PROFILE).
- A special line anchored after a deleted data line is dropped (`pruneSpecial` after line commands); otherwise it
  moves with its data line because the anchor is the stable line id.
- `=NOTE=`/`=MSG>` lines are not implemented; the model can host them later.
