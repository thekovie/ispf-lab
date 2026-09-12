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
- `COLS` shows a `=COLS>` ruler.
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
| `COLS` | ruler after this line |
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
| `RESET` | `RES` | show excluded, clear pending commands and COLS |
| `LOCATE n` | `L`, `LOC` | scroll so line n is at the top |
| `TOP`, `BOTTOM` | `BOT` | |
| `UP/DOWN/LEFT/RIGHT [n PAGE HALF MAX CSR DATA]` | | PF7/8/10/11; `*** TOP OF DATA ***`, `*** BOTTOM OF DATA ***`, `*** LEFT EDGE ***`, `*** RIGHT EDGE ***` |
| `CAPS ON|OFF`, `NUM ON|OFF`, `HEX ON|OFF` | | CAPS upper-cases typed text; NUM/HEX are accepted, display unchanged |
| `COLS` | | toggle ruler at the top line |
| `CREATE member` / `REPLACE member` | `CRE`, `REP` | write the buffer to another member of the same library |
| `COPY member` | | insert another member's records after `A` / before `B` (or into an empty member) |
| `PROFILE` | `PROF` | show CAPS/NUM/LRECL |
| `EXPLAIN term` | | simulator-only: open the glossary |
| anything else | | `COMMAND NOT RECOGNIZED` |

*Deviation:* `NUM`/`HEX` do not change the display; `CREATE`/`REPLACE`/`COPY` work within the current library only.

## Events emitted

`EDITOR_TEXT_CHANGED{count}`, `EDITOR_LINE_INSERTED{count}`, `EDITOR_LINE_DELETED{count}`,
`EDITOR_LINE_REPEATED{count}`, `EDITOR_LINES_COPIED{count,dest}`, `EDITOR_LINES_MOVED{count,dest}`,
`EDITOR_LINES_EXCLUDED{count}`, `EDITOR_FIND{text}`, `EDITOR_CHANGE{detail}`, `EDITOR_SCROLLED`,
`MEMBER_SAVED{dsn,member}`, `MEMBER_CREATED{dsn,member}`, `EDIT_CANCELLED{dsn,member}`, `COMMAND_ENTERED`.
