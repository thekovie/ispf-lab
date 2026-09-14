# Editor commands (what the simulator implements)

Modelled on *z/OS ISPF Edit and Edit Macros* (see `docs/08-resources.md`). Deviations are noted.

## Frame

```
EDIT       USER01.JCL(HELLO)                                  Columns 00001 00072
Command ===> ______________________________________________  Scroll ===> PAGE
****** ****************************** Top of Data ******************************
000001 //USER01H  JOB (ACCT),'HELLO WORLD',CLASS=A,MSGCLASS=X,
...
****** **************************** Bottom of Data ****************************
```

- Short messages replace `Columns …` on the title row.
- 18 data rows per page; `Scroll ===>` accepts PAGE, HALF, CSR, DATA or a number.
- Prefix area shows six-digit numbers; a pending command (e.g. `C`) is shown in yellow in place of the number.
- Excluded lines collapse to `- - - … n Line(s) not Displayed`; the prefix field of that marker accepts S / F / L.
- Special lines (`=COLS>`, `=BNDS>`, `=PROF>`) are displayed with a negative internal id, are never written to the
  data set, and disappear on `RESET` / `RESET SPECIAL` or `D` in their prefix area. `=BNDS>` is editable: `<` and
  `>` typed on it set the bounds.
- Browse: prefix area and records are protected text. View: editable, SAVE refused.

## Processing order on Enter (or any PF key)

1. Typed-over record text (only the visible 72-column window is merged into the 80-byte record).
2. Prefix-area line commands (typed over the number; the untouched tail of the number is stripped: `I50001` → `I5`).
3. The `Scroll` field.
4. The primary command, or the PF key's command (`END`, `RFIND`, `RCHANGE`, `UP`, `DOWN`, `LEFT`, `RIGHT`, `CANCEL`).

## Line commands

| Command | Effect |
|---|---|
| `I`, `In` | insert n blank lines after; blank inserted lines vanish on the next Enter |
| `D`, `Dn`, `DD…DD` | delete n lines / the block |
| `R`, `Rn`, `RR…RR` | repeat the line n times / the block once |
| `C`, `Cn`, `CC…CC` + `A`/`An`/`B`/`Bn` | copy after/before the destination n times |
| `M`, `Mn`, `MM…MM` + `A`/`B` | move (source removed) |
| `X`, `Xn`, `XX…XX` | exclude; `S`, `F`n, `L`n show all / first n / last n of a block |
| `COLS` | `=COLS>` ruler after this line (movable special line) |
| `TS` | text split at the cursor column (or a blank line after, if the cursor is elsewhere) |
| `LC`/`UC`, `LCC…LCC`/`UCC…UCC` | lower/upper case |
| `(` `)` `<` `>` and block forms | shift 2 columns (or n) |

Messages (short, top right): `INVALID LINE COMMAND` (typed text is kept), `DESTINATION REQUIRED` (info: C/M
waits, shown pending), `MOVE/COPY IS PENDING` (A/B without a source), `BLOCK COMMAND INCOMPLETE` (single DD/CC/MM…
stays pending), `CONFLICTING LINE COMMANDS` (two sources or two destinations), `DESTINATION NOT ALLOWED` (move onto
itself), `LINE COMMANDS NOT ALLOWED IN BROWSE`. Blanking a pending command cancels it; `RESET` cancels all.

*Deviation:* real ISPF pairs mixed blocks more liberally and supports many more commands (TE, TF, MASK, BNDS…).

## Primary commands

| Command | Abbrev. | Effect / message |
|---|---|---|
| `SAVE` | | write buffer, stay; `MEMBER SAVED`; refused in Browse/View; `DATA SET IS READ ONLY` |
| `CANCEL` | `CAN` | discard since last save, exit; `EDIT CANCELLED` |
| `END` (PF3) | | Edit: save if changed then exit; Browse/View: exit |
| `FIND str [NEXT PREV FIRST LAST ALL]` | `F` | `CHARS 'x' FOUND`, `*BOTTOM OF DATA REACHED*`, `NO CHARS 'x' FOUND`; case-insensitive; quote strings with blanks |
| `RFIND` (PF5) | | repeat last FIND; `NO PREVIOUS FIND` |
| `CHANGE old new [ALL]` | `C`, `CHG` | `CHARS 'a' CHANGED TO 'b'`, `n CHARS 'a' CHANGED TO 'b'` |
| `RCHANGE` (PF6) | | repeat last CHANGE |
| `EXCLUDE str [ALL]` | `X`, `EXC` | `n LINE(S) EXCLUDED` |
| `RESET [ALL|EXCLUDED|X|SPECIAL|COMMAND|LABEL]` | `RES` | ALL (default): show excluded lines, clear pending line commands and special lines; `EXCLUDED`/`X`: redisplay only; `SPECIAL`: remove =COLS>/=BNDS>/=PROF>; `COMMAND`: clear pending line commands; `LABEL`: accepted (labels are not simulated) |
| `FLIP` | | reverse the excluded status of every line |
| `UNDO` | | take back the last interaction; `UNDO COMPLETE`, `NO MORE TO UNDO`, `UNDO NOT AVAILABLE, SETUNDO OFF`; SAVE is a boundary |
| `LOCATE n` | `L`, `LOC` | scroll so line n is at the top |
| `TOP`, `BOTTOM` | `BOT` | |
| `UP/DOWN/LEFT/RIGHT [n PAGE HALF MAX CSR DATA]` | | PF7/8/10/11; `*** TOP OF DATA ***`, `*** BOTTOM OF DATA ***`, `*** LEFT EDGE ***`, `*** RIGHT EDGE ***` |
| `CAPS ON|OFF` | | upper-case typed text; stored in the profile |
| `NUMBER ON|OFF` | `NUM` | ON writes 8-digit sequence numbers in columns 73-80 (80-byte records only; other LRECLs answer `NUMBER SUPPORTED FOR LRECL 80 ONLY`); OFF blanks them |
| `UNNUM` | | remove sequence numbers and set NUMBER OFF |
| `STATS ON|OFF` | | OFF leaves the member statistics unchanged on save |
| `RECOVERY ON|OFF` | `RECOVRY` | enables UNDO (no recovery data set is simulated) |
| `SETUNDO ON|OFF|STORAGE` | | enables/disables UNDO |
| `AUTOSAVE ON|OFF [PROMPT|NOPROMPT]` | | END with unsaved changes: ON saves, OFF PROMPT shows *Edit - Save or Cancel Changes*, OFF NOPROMPT discards |
| `BOUNDS [left right]` | `BNDS`, `BND` | no operands: show `=BNDS>` line; with operands: set the search window used by FIND/CHANGE/EXCLUDE; `INVALID BOUNDS` |
| `COLS` | | `=COLS>` ruler above the first line |
| `HEX ON|OFF` | | accepted, display unchanged |
| `SUBMIT` | `SUB` | submit the buffer to the virtual JES; `JOB name(JOBnnnnn) SUBMITTED` (deviation: ISPF submits the saved data set) |
| `CREATE member` / `REPLACE member` | `CRE`, `REP` | write the buffer to another member of the same library |
| `COPY member` | | insert another member's records after `A` / before `B` (or into an empty member) |
| `PROFILE` | `PROF` | show two `=PROF>` lines: name, LRECL, CAPS, NUMBER, STATS, RECOVERY, SETUNDO, AUTOSAVE, HEX, BOUNDS |
| `EXPLAIN term` | | simulator-only: open the glossary |
| anything else | | `COMMAND NOT RECOGNIZED` |

*Deviation:* `HEX` does not change the display; `NUMBER` covers STD numbers in 73-80 only (no COBOL 1-6); `CREATE`/`REPLACE`/`COPY`
work within the current library only; labels and edit macros are not simulated.

## Edit profile

One profile per data set *type* (last qualifier: `JCL`, `COBOL`, `DATA` …), persisted per userid under
`ispf-lab:editprofile:v1:<USERID>` (see ADR 0010). Defaults: CAPS OFF, NUMBER OFF, STATS ON, RECOVERY OFF,
SETUNDO ON, AUTOSAVE ON, HEX OFF, BOUNDS 1 LRECL. Real defaults vary by installation (ISPF ships RECOVERY/SETUNDO
OFF; many sites turn them on) — the lessons say so.

## UNDO model

`processEnter` takes a snapshot `{lines, pending, special}` after every interaction that changed the lines (max
200). `UNDO` restores the newest snapshot; `SAVE`, `CANCEL` and reopening clear the history. Several line commands
in one Enter are one interaction, as in ISPF.

## Command retrieval

Every non-blank command entered on a panel command line (not the editor) goes on `state.retrieveStack` (25 entries,
newest first, no consecutive duplicates). `RETRIEVE` or F12 on non-editor panels refills the field and walks older
entries on repeated use; `NO COMMAND TO RETRIEVE` when empty.

## Events emitted

`EDITOR_TEXT_CHANGED{count}`, `EDITOR_LINE_INSERTED{count}`, `EDITOR_LINE_DELETED{count}`,
`EDITOR_LINE_REPEATED{count}`, `EDITOR_LINES_COPIED{count,dest}`, `EDITOR_LINES_MOVED{count,dest}`,
`EDITOR_LINES_EXCLUDED{count}`, `EDITOR_FIND{text}`, `EDITOR_CHANGE{detail}`, `EDITOR_SCROLLED`,
`MEMBER_SAVED{dsn,member}`, `MEMBER_CREATED{dsn,member}`, `EDIT_CANCELLED{dsn,member}`, `COMMAND_ENTERED`,
`UNDO_EXECUTED`, `PROFILE_CHANGED{profile}`, `COLS_DISPLAYED`, `BOUNDS_CHANGED`, `LINES_REDISPLAYED{count}`,
`AUTOSAVE_PROMPTED{dsn,member}`, `COMMAND_RETRIEVED{command}`.
