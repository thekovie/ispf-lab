# ISPF behaviour reference (what the simulator does)

Source of truth for lessons and tests. When real ISPF differs, file an *ISPF behaviour mismatch* issue with the
manual reference; corrections go here first, then into code and tests.

## Navigation

- Panels stack. Opening a panel pushes the current one; **PF3 / END** pops one.
- Option paths: `3` then `4`, `3.4`, and `=3.4` all end in the same state (intermediate menus are pushed so PF3
  unwinds identically). `DSLIST` is an alias for `3.4`.
- **Jump function** `=path` on any command line (system command, processed before the panel): typed fields are
  transmitted first, an open editor is ended (saved when AUTOSAVE is ON; a failed save blocks the jump), the active
  logical screen unwinds to the Primary Option Menu and the option is selected. `INVALID JUMP DESTINATION` for
  unknown paths; unimplemented options give the not-available message. Event `JUMP_EXECUTED{path,from}`.
- **RETURN / PF4** unwinds the active logical screen to the Primary Option Menu (same END processing);
  `ALREADY AT PRIMARY MENU` when there. Event `RETURN_EXECUTED{from}`.
- **Keylist**: every logged-on panel offers F1 Help, F2 Split, F4 Return, F9 Swap; the rest is panel-specific
  (F12 = Cancel in the editor). The legend on the panel is authoritative.
- `TSO <command>` on the Option line runs the command and opens the Command Shell with its output.
- `EXPLAIN <term>` on any command line opens the glossary (simulator-only command).
- Unimplemented options: `OPTION NOT AVAILABLE IN THIS TRAINING MODULE`. Unknown input: `INVALID OPTION`.
- **PF1** opens Help for the current panel; unassigned PF keys answer `PFn NOT ACTIVE` (info).

## Panels

| Panel | Fields | Enter | PF keys |
|---|---|---|---|
| LOGIN (TSO/E LOGON) | Userid (1–7, letters/digits/#$@), Password (unchecked) | logs on; first logon seeds `<USERID>.…`; `INVALID USERID` otherwise | 1 |
| PRIMARY_OPTION_MENU | Option | `0 1 2 3 6`, `3.x`, `=…`, `X`/`EXIT`/`LOGOFF` (logoff), `TSO …`, `HELP`, `EXPLAIN …` | 1, 3 (logoff) |
| SETTINGS (0) | PF keys Y/N, Insert Y/N, Scroll (PAGE/HALF/CSR/DATA/n) | validates `ENTER Y OR N`, `INVALID SCROLL AMOUNT` | 1, 3 (applies + returns) |
| EDIT_ENTRY (2) / VIEW (1) | Project/Group/Type/Member or Other Data Set Name | opens DSN or DSN(MEMBER); PDS without member → member list; new member in Edit | 1, 3 |
| UTILITY_SELECTION (3) | Option | `1`→3.1, `2`→3.2, `3`→3.3, `4`→3.4; `=x.y` jumps | 1, 3 |
| LIBRARY_UTILITY (3.1) | Option (blank/E/B/V/D/R), library fields, Member, New name | blank → member list; D/R → confirm/rename panels | 1, 3 |
| DATASET_UTILITY (3.2) | Option (A/R/D/blank/S), data set name | A → Allocate panel (`DATA SET ALREADY EXISTS` if present); D → confirm; R → rename; blank → information; C/U/V not available | 1, 3 |
| ALLOCATE_DATASET | Volume, Space units (TRKS/CYLS/BLKS), Primary, Secondary, Directory blocks, RECFM (FB VB F V U), LRECL, BLKSIZE, Data set name type | `dirBlocks > 0` or type PDS/LIBRARY → PDS; else PS. Errors: `INVALID SPACE UNITS`, `NUMERIC VALUE REQUIRED`, `INVALID RECORD FORMAT`, `INVALID RECORD LENGTH`, `INVALID SPACE QUANTITY`. Success: `DATA SET ALLOCATED`, returns to 3.2 | 1, 3 |
| MOVE_COPY (3.3) | Option (C/M/CP/MP), From DSN(MEMBER), To DSN[(MEMBER)] | copies/moves; `MEMBER ALREADY EXISTS`, `DATA SET NOT CATALOGED`, `DATA SET IS READ ONLY`, `MEMBER NAME REQUIRED` | 1, 3 |
| DSLIST_SEARCH (3.4) | Option, Dsname Level, Volume | lists matches; `ENTER DSNAME LEVEL`; `NO DATA SETS MATCH LEVEL` | 1, 3 |
| DSLIST_RESULTS | Command, one command column per row | line commands below; primary `LOCATE name`, `REFRESH`, `END`, `HELP`, `EXPLAIN` | 1, 3, 7, 8 |
| MEMBER_LIST | Command, one command column per row | line commands below; primary `S/E/B/V name` (S/E create in edit lists), `LOCATE`, `END` | 1, 3, 7, 8 |
| DATASET_INFO | — | Enter/PF3 return | 1, 3 |
| CONFIRM_DELETE | Confirm (Y/N, default Y) | Y deletes (`MEMBER DELETED` / `DATA SET DELETED`), N cancels | 1, 3/12 cancel |
| RENAME | New name | `MEMBER RENAMED` / `DATA SET RENAMED`; `INVALID MEMBER NAME`, `MEMBER ALREADY EXISTS`, `DATA SET ALREADY EXISTS` | 1, 3/12 cancel |
| COPY_MOVE (member-list pop-up) | To data set | as 3.3 | 1, 3/12 cancel |
| TSO_COMMAND (6) | `===>` | see below | 1, 3 |
| HELP | — | PF3 returns | 3 |
| EDIT / BROWSE / VIEW | see `docs/04-editor-commands.md` | | 1 3 5 6 7 8 10 11 12 |

## Dsname Level matching

`USER01` → every data set whose first qualifier is USER01. `USER01.*` → same. `USER01.JCL` → that data set and any
`USER01.JCL.*`. `*` matches any qualifier text, `%` one character. Case-insensitive.

## DSLIST line commands

| Cmd | PDS | PS | Read-only library |
|---|---|---|---|
| E / B / V | member list in that mode | editor in that mode | B/V allowed; E opens but SAVE fails |
| M | member list | `DATA SET IS NOT PARTITIONED` | allowed |
| S | as E | as E | as E |
| I | Data Set Information | same | same |
| D | Confirm Delete | same | `DATA SET IS READ ONLY` |
| R | Rename panel | same | `DATA SET IS READ ONLY` |
| other | `INVALID LINE COMMAND` (text kept for correction) | | |

## Member-list line commands

E Edit · B Browse · V View · S select with the list's mode (M lists select E) · D Confirm Member Delete ·
R Rename Member · C Copy pop-up · M Move pop-up. Read-only libraries refuse D, R, M.

## Option 6 TSO subset

`LISTCAT LEVEL(x)` (catalog entries, emits `DATASET_SEARCHED`), `LISTDS 'dsn' [MEMBERS]`, `DELETE 'dsn'`,
`RENAME 'old' 'new'`, `TIME`, `HELP`, `ISPF`. Unquoted names get the userid prefixed. Unknown → `COMMAND xxx NOT FOUND`.

## Catalog rules

- Data-set names ≤ 44 chars; qualifiers 1–8 chars, first char alphabetic/#/$/@. Member names 1–8.
- `SYS1.*` libraries are read-only: no save, delete, rename, move.
- Records are padded/truncated to LRECL on save. Member statistics: created, changed, ID (userid), version.mod.
- Everything is stored per userid in `localStorage`; **Reset environment** restores `buildSeed(userid)`.

## Seed catalog (per HLQ)

`<HLQ>.JCL(HELLO COPYJOB SORTJOB)` · `<HLQ>.COBOL(HELLO CUSTOMER)` · `<HLQ>.REXX(TEST01 HELLO)` ·
`<HLQ>.DATA(CUSTOMER EMPLOYEE)` · `<HLQ>.NOTES.TXT` (PS) · `<HLQ>.LOADLIB` (empty PDS, RECFM U) ·
`SYS1.PARMLIB(IEASYS00 COMMND00 PROG00)` and `SYS1.PROCLIB(COBUCL SORTD)` read-only on SYSRES.

## Semantic events

`LOGGED_ON LOGGED_OFF SCREEN_OPENED OPTION_SELECTED COMMAND_ENTERED PF_KEY_PRESSED DATASET_SEARCHED DATASET_OPENED
DATASET_INFO_VIEWED DATASET_ALLOCATED DATASET_DELETED DATASET_RENAMED MEMBER_OPENED MEMBER_CREATED MEMBER_RENAMED
MEMBER_DELETED MEMBER_COPIED MEMBER_MOVED MEMBER_SAVED EDIT_CANCELLED EDITOR_LINE_INSERTED EDITOR_LINE_DELETED
EDITOR_LINE_REPEATED EDITOR_LINES_COPIED EDITOR_LINES_MOVED EDITOR_LINES_EXCLUDED EDITOR_TEXT_CHANGED EDITOR_FIND
EDITOR_CHANGE EDITOR_SCROLLED TSO_COMMAND_ENTERED SETTING_CHANGED ENVIRONMENT_RESET EXPLAIN_REQUESTED MESSAGE_SHOWN`
— see `src/engine/types.ts` for payloads.

## Split screen (logical screens)

- **PF2 / `SPLIT`** opens a new logical screen on the Primary Option Menu and makes it active; **`START`** does the
  same from any command line. Maximum 8 (`MAXIMUM SCREENS ACTIVE`).
- **PF9 / `SWAP`** activates the next screen; `SWAP PREV`, `SWAP n`, `SWAP LIST` (lists screens in the long message).
  With one screen: `SWAP NOT ACTIVE`; out of range: `SCREEN NOT ACTIVE`.
- Each screen keeps its own panel stack, editor session (including unsaved changes), messages and typed drafts.
- **PF3 / X on a screen's Primary Option Menu** ends that screen (`SCREEN ENDED`) when others are open; with one
  screen it logs off. Reset environment and logoff collapse to one screen.
- The SWAPBAR row above the PF legend lists `n description` per screen with `*` on the active one; the Primary Option
  Menu shows `Screen. . : n of m`; the status line shows `Sn/m`.
- Events: `SCREEN_SPLIT{screens,active}`, `SCREEN_SWAPPED{from,to,screens}`, `SCREEN_CLOSED{screens,active}`.
