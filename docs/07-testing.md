# Testing

## Strategy

Nearly everything that matters is a pure function, so tests drive the engine directly and assert on state, events
and the catalog. React components are kept thin; UI verification is done by walking the app in a browser
(see project log) rather than with brittle DOM assertions.

```
pnpm test            # vitest run
pnpm test:watch
pnpm test:coverage   # v8 coverage of src/{engine,catalog,parsers,editor,tutorial,persistence}
pnpm check           # typecheck + lint + test
```

## Test files (127 tests)

| File | Covers |
|---|---|
| `tests/catalog/catalog.test.ts` | seed (templated HLQ, no personal names), Dsname Level search, DSN parsing, open PDS/PS, delete/rename member, read-only guards, new member on save, mod level, allocate PDS/PS, duplicates and bad names, delete/rename data set, copy/move across data sets |
| `tests/persistence/stores.test.ts` | seed-on-first-load, per-userid keys, reset, export/import, progress store |
| `tests/parsers/parsers.test.ts` | option paths and aliases, list line commands, editor line commands (counts, blocks, garbage), primary commands (quotes, directions, ALL, scroll amounts), TSO |
| `tests/editor/lineCommands.test.ts` | I/In, pruning of blank inserts, D/Dn, DD, single DD pending, R/Rn/RR, C+A, C+B, M+A, MM+B, CC+An, pending C then A, conflicts, cancelling pending, X/XX, invalid, browse |
| `tests/editor/primaryCommands.test.ts` | SAVE/CANCEL/END effects, refusals in browse/view, FIND/RFIND/bottom, CHANGE/ALL/RCHANGE, scrolling, EXCLUDE/RESET, LEFT/RIGHT |
| `tests/engine/navigation.test.ts` | logon, `3`→`4` vs `3.4` vs `=3.4` vs `DSLIST` identical state, PF3 stack, not-available, options 0/1/2/6/3.1–3.3, events, PF1 help, DSLIST search/line commands/info/delete/rename, member list delete/rename/copy/move/create, option 2, 3.2 allocate → 3.4, 3.3 copy, 3.1 delete, TSO, settings |
| `tests/engine/editorFlow.test.ts` | frame rendering, overtype → dirty → SAVE, CANCEL, PF3 saves, PF12, prefix typed over numbers, C then A over two Enters, invalid prefix reported, FIND/CHANGE, new member, browse/view refusals, read-only save, PF7/PF8 edges |
| `tests/tutorial/lessons.test.ts` | 14 lessons registered, no personal names, lesson 2 both routes + detour + scoring, lesson 8 catalog validation, lesson 9 line commands, lesson 14 challenge mode, lesson 6 allocation |

`tests/engine/harness.ts` (`Sim`) drives the reducer the way the UI does: `enter(fields)`, `pf(key, fields)`,
`cmd(text)`.

## Browser verification (manual, Chrome DevTools MCP)

Logon → Learn lesson 2 → `3.4` → `USER01` → `E` on USER01.JCL → `E` on HELLO → `I2` over `000001` → type on the
new line → MODIFIED → SAVE → PF3 ×4; refresh keeps catalog and progress; Reset environment restores the seed;
Sandbox hides the coach; landing at 1440/390 px; `/lab` at 390 px shows the gate.

## Coverage target

80 % of the pure layers. UI components are covered by the browser walkthrough; a Playwright suite is the natural
next step (`e2e/` is not yet created).

## Adding tests

Put new engine behaviour in the matching `tests/<layer>/` file; use the harness for anything that crosses screens.
A lesson change needs a `Coached` walk in `tests/tutorial/lessons.test.ts`.
