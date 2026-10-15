# Project log — ISPF Lab

The collaboration journal. One entry per build phase, appended in order. Each entry records the goal,
what was built, decisions (linked to ADRs), deviations from the brief, how it was verified, and what is next.
Newest entry at the bottom.

Conventions: dates are `YYYY-MM-DD`; paths are relative to the repository root; "brief" means
`docs/spec/original-brief.md` (the user's verbatim specification).

---

## Phase 0 — Planning  (2026-09-11)

**Goal** · Turn the brief into an executable plan and settle the decisions that are the user's to make.

**Decisions**
- Project/folder name `ispf-lab`; in-app product name "ISPF Lab". Alternatives recorded for a later rebrand:
  Option34, PanelDrill, GreenScreen Dojo, PF3 Academy, DSLIST Dojo, TSO Trainer, Sim3270.
- Package manager pnpm; stack Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + Vitest (ADR 0001, 0006).
- No personal names in the product: the logon userid becomes the HLQ and the seed catalog is templated on it (ADR 0004).
- Scope widened from the brief at the user's request: users can allocate/delete/rename data sets (3.2), copy/move
  members across data sets (3.3), use 3.1 and option 6; everything stays in browser storage.
- Course modelled on published guides (docs/08-resources.md); 14 lessons in 5 modules (docs/05-course-design.md).
- Landing page in a terminal aesthetic; simulator gated to desktop-class viewports (ADR 0007, 0008).
- Documentation is written per phase so other people can collaborate (this file, CONTRIBUTING.md, ADRs).

**Verified by** · Plan reviewed and approved by the user in plan mode.

**Next** · Phase 1 scaffold.

---

## Phase 1 — Scaffold + docs skeleton  (2026-09-11)

**Goal** · A running Next.js app with the test toolchain and the documentation frame.

**Built**
- `pnpm create next-app` (TypeScript, Tailwind v4, ESLint 9, App Router, `src/` dir); Vitest + jsdom + Testing Library
  (`vitest.config.mts`, `tests/setup.ts`); scripts `test`, `test:watch`, `test:coverage`, `typecheck`, `check`.
- `git init` (done by create-next-app). README, CONTRIBUTING, CLAUDE.md, CHANGELOG, `docs/`, ADRs, issue templates
  (written at the end of the build so they describe what exists; see Phase 9).

**Decisions** · ADR 0001 (Next.js App Router), ADR 0006 (Vitest).

**Deviations from brief** · None.

**Verified by** · `pnpm dev` serves `/`; `pnpm vitest run` executes.

---

## Phase 2 — Virtual catalog + persistence  (2026-09-11)

**Goal** · The data model every screen and lesson depends on, with local persistence.

**Built**
- `src/catalog/types.ts` — `Dataset`, `Member`, `Catalog`, `AllocateRequest`, `DsnRef` (brief's model plus
  `blksize`, space, `dirBlocks`, `createdAt`, `owner` so 3.2 / Data Set Information have real data).
- `src/catalog/seed.ts` — `buildSeed(hlq)`: `<HLQ>.JCL(HELLO, COPYJOB, SORTJOB)`, `.COBOL(HELLO, CUSTOMER)`,
  `.REXX(TEST01, HELLO)`, `.DATA(CUSTOMER, EMPLOYEE)`, `.NOTES.TXT` (PS), `.LOADLIB` (empty PDS),
  read-only `SYS1.PARMLIB` and `SYS1.PROCLIB`.
- `src/catalog/catalog.ts` — immutable operations returning `{ catalog, error? }` with ISPF-style messages:
  `searchLevel`, `allocate`, `deleteDataset`, `renameDataset`, `saveRecords`, `deleteMember`, `renameMember`,
  `copyMember` (copy or move, member or whole PS), `readRecords`, name validators, `parseDsnRef`.
- `src/persistence/` — `StorageAdapter` (`LocalStorageAdapter`, `MemoryAdapter`), keys namespaced by userid,
  `catalogStore` (load/seed/save/reset/export/import), `progressStore`, `settingsStore`.

**Decisions** · ADR 0003 (localStorage behind an adapter, not IndexedDB), ADR 0004 (userid-templated seed).

**Deviations from brief** · Seed uses a neutral HLQ instead of a personal one (user request).

**Verified by** · `tests/catalog/catalog.test.ts` (26 tests), `tests/persistence/stores.test.ts` (4).

---

## Phase 3 — Command parsers  (2026-09-11)

**Goal** · Every string the learner can type is parsed by one pure function with a typed result.

**Built** · `src/parsers/optionCommand.ts` (`3`, `3.4`, `=3.4`, `DSLIST`, `TSO …`, `EXPLAIN …`, `X`),
`listLineCommand.ts` (DSLIST / member-list letters), `editorLineCommand.ts` (I In D Dn DD R RR C CC M MM A B X XX
S F L COLS TS LC UC ( ) < >), `editorPrimaryCommand.ts` (tokenizer honouring quotes; SAVE CANCEL END FIND RFIND
CHANGE RCHANGE EXCLUDE RESET LOCATE TOP BOTTOM UP DOWN LEFT RIGHT CAPS NUM HEX COLS CREATE REPLACE COPY PROFILE
EXPLAIN, with the documented abbreviations), `tsoCommand.ts` (LISTCAT, LISTDS, DELETE, RENAME, TIME, HELP).

**Verified by** · `tests/parsers/parsers.test.ts` (12).

---

## Phase 4 — Screen / navigation engine  (2026-09-11)

**Goal** · A deterministic reducer that owns every panel; no navigation logic in React.

**Built**
- `src/engine/types.ts` — `SimulatorState`, `ScreenFrame` (typed per screen), `SimAction`, `SimEvent`
  (the semantic events lessons subscribe to), `RenderedScreen` (rows of text/field segments).
- `src/engine/navigation.ts` — push/pop/replace, `frameForPath` (which options exist), `openPath` (pushes the
  intermediate menu so `3.4` and `3`→`4` produce identical state), `NOT_AVAILABLE` message.
- `src/engine/screens/*` — one handler per panel: login, primaryMenu, settings, utilities, editEntry (options 1/2),
  datasetPanels (3.1, 3.2, Data Set Information), allocateDataset, moveCopy (3.3), dslistSearch, dslistResults,
  memberList, editor (EDIT/BROWSE/VIEW), dialogs (confirm delete, rename, copy/move pop-up, message), tsoCommand,
  help. `registry.ts` maps `ScreenId` → handler; `reducer.ts` dispatches ENTER / PF / GOTO / RESET_ENVIRONMENT etc.
- `src/engine/open.ts` — shared "open a DSN(MEMBER)" logic: PDS → member list, member/PS → editor, missing member in
  EDIT → new member.

**Decisions** · ADR 0002 (pure reducer + event list), ADR 0005 (Enter applies text edits → line commands → primary
command, as ISPF does).

**Verified by** · `tests/engine/navigation.test.ts` (28): both routes to DSLIST reach identical state, PF3 stack,
option-not-available message, DSLIST/member-list line commands, allocate → visible in 3.4, 3.3 copy, 3.1 delete,
TSO LISTCAT, settings persistence.

---

## Phase 5 — ISPF editor engine  (2026-09-11)

**Goal** · A record-oriented editor with ISPF line-command semantics, independent of the DOM.

**Built** · `src/editor/types.ts` (session with stable line ids, pending commands, dirty flag, scroll window),
`session.ts` (open, text edits, dirty tracking, CANCEL revert, SAVE commit), `lineOps.ts` (primitives),
`lineCommands.ts` (merge pending + typed → parse → pair blocks → validate copy/move → apply; messages
`INVALID LINE COMMAND`, `DESTINATION REQUIRED`, `BLOCK COMMAND INCOMPLETE`, `DESTINATION NOT ALLOWED`,
`CONFLICTING LINE COMMANDS`; blank inserted lines pruned on the next Enter), `primaryCommands.ts`
(FIND/RFIND/CHANGE/RCHANGE/EXCLUDE/RESET/LOCATE/TOP/BOTTOM/scroll/CAPS/NUM/COLS; SAVE/CANCEL/END/CREATE/COPY are
returned as effects for the screen layer). `engine/screens/editor.ts` renders the frame and strips typed-over line
numbers (`I50001` → `I5`).

**Verified by** · `tests/editor/lineCommands.test.ts` (19), `tests/editor/primaryCommands.test.ts` (13),
`tests/engine/editorFlow.test.ts` (15): I/In, D/Dn, DD, R/RR, C+A, C+B, M+A, MM+B, CC+An, pending C then A,
conflicts, X/XX, SAVE persists, CANCEL discards, PF3 saves, PF12 cancels, new member on SAVE, browse/view refusals,
read-only save failure, FIND/CHANGE.

---

## Phase 6 — Terminal renderer, keyboard, shell  (2026-09-11)

**Goal** · Render the engine's screens as a 3270-like terminal and drive it keyboard-first.

**Built**
- `src/state/store.ts` (framework-free store: dispatch, event fan-out, debounced persistence) and
  `SimulatorProvider.tsx` (`useSyncExternalStore`).
- `src/components/terminal/` — `Terminal.tsx` (24×80 rows, drafts held locally until Enter/PF, Tab/Shift+Tab field
  order, F1–F12, Insert toggle, arrow keys between records, PF legend wrapping), `FieldInput.tsx` (overtype by
  default, upper-casing except records), `PfKeyStrip.tsx` (clicks dispatch the identical PF action), `StatusLine.tsx`
  (4B operator area with row/col, INSERT, MODIFIED), `terminal.css`.
- `src/app/layout.tsx` (IBM Plex Mono/Sans), `globals.css` design tokens.

**Deviations from brief** · The React-compiler lint rules (no ref reads in render, no setState in effects) shaped the
store design; it is documented in ADR 0002.

**Verified by** · Chrome walkthrough: logon → 3.4 → E → E → `I2` over a line number, overtype text, MODIFIED flag;
fixed an 80-column overflow (content-box sizing) and a lost-keystroke bug in overtype (now mutates the input
synchronously).

---

## Phase 7 — Tutorial engine, lessons, coach, progress  (2026-09-11)

**Goal** · Lessons that validate simulator events and state — never the DOM — in Learn / Practice / Challenge modes.

**Built**
- `src/tutorial/types.ts` (Lesson, LessonStep, Validator, RunnerState), `validators.ts` (onScreen, eventIs,
  editorOpen, memberListOpen, dslistShowing, memberSatisfies, memberExists, datasetExists, editorHasLine, savedMember…),
  `engine.ts` (`feedEvents`: a batch may satisfy consecutive steps; mistakes = terminal error messages; detour note for
  valid-but-off-path actions; challenge mode checks only the final validator; score = 100 − 10·mistakes − 15·hints),
  `explain.ts` (32-entry glossary with flagged analogies and read-more links).
- `src/tutorial/lessons/module1-5.ts` — the 14 lessons (docs/05-course-design.md).
- `src/state/TutorialProvider.tsx`, `components/coach/LearningPanel.tsx`, `ExplainDrawer.tsx`, `shell/TopBar.tsx`,
  `LabShell.tsx`, `ProgressView.tsx` (+ `/lab/progress`), `/resources` page, `src/content/resources.ts`.

**Verified by** · `tests/tutorial/lessons.test.ts` (10): both navigation routes, detours, mistake/hint scoring,
lesson 8 catalog validation, lesson 9 line commands, lesson 14 challenge mode, lesson 6 allocation. Chrome
walkthrough of lesson 2 in Learn mode.

---

## Phase 8 — Landing page + desktop gate  (2026-09-12)

**Goal** · An educational, terminal-styled introduction usable on any device; the simulator only on keyboard-capable
viewports.

**Built** · `src/components/landing/Landing.tsx` (panel-style sections: What is ISPF, panel anatomy, modules,
glossary teaser, reference guides; Option ===> line and 1–4 keyboard navigation; `NAMES` easter egg),
`HeroTerminal.tsx` (self-typing demo driven by the real engine), `landing.css`;
`components/shell/DesktopGate.tsx` (`≥1024px` and `pointer: fine`; SSR-safe via `useSyncExternalStore`).

**Decisions** · ADR 0007 (desktop gate), ADR 0008 (landing as terminal).

**Verified by** · Screenshots at 1440 and 390 px: landing readable on both; `/lab` at 390 px shows the
TERMINAL TOO SMALL notice and mounts nothing from the simulator.

---

## Phase 9 — Documentation + polish  (2026-09-12)

**Goal** · Everything a collaborator needs to continue the work.

**Built** · This log, `docs/01`–`08`, ADRs 0001–0008, `docs/spec/original-brief.md`, README, CONTRIBUTING,
CLAUDE.md, CHANGELOG, GitHub issue templates.

**Verified by** · `pnpm test` (127 tests, 8 files), `pnpm lint`, `pnpm typecheck`, `pnpm build` all clean;
a grep for the author's name over src, tests and docs returns nothing (the two test files only assert its absence).

**Next (not started)** · JCL submission / SDSF, TSO emulation beyond option 6, accounts and cloud sync, achievements —
all explicitly out of MVP scope in the brief. Fidelity reports from mainframe-experienced contributors are the
expected next input (see `.github/ISSUE_TEMPLATE/ispf-behaviour-mismatch.md`).

---

## Phase 10 — SEO, metadata and icons  (2026-09-12)

**Goal** · Make the site discoverable and shareable; give it an identity mark.

**Built**
- `src/content/site.ts` — name, tagline, description, keywords, `siteUrl()` from `NEXT_PUBLIC_SITE_URL` (`.env.example`).
- `src/app/layout.tsx` — `metadataBase`, title template, description, keywords, canonical, Open Graph, Twitter card,
  robots directives, manifest link, viewport/theme colour. Per-page metadata for `/lab`, `/resources`;
  `/lab/progress` is `noindex`.
- `src/app/opengraph-image.tsx` — 1200×630 card generated at build with IBM Plex Mono (fetched from Google Fonts;
  falls back to the default font if offline): a Primary Option Menu panel beside "Learn ISPF by typing."
- `src/app/sitemap.ts`, `robots.ts` (disallows `/lab/progress`), `manifest.ts` (installable PWA metadata).
- JSON-LD on `/`: `WebApplication`, `Course` (14 syllabus sections, citations to the reference guides), `FAQPage`.
- `scripts/make-icons.mjs` (`pnpm icons`) — dependency-free PNG/ICO encoder that draws the mark: a dark CRT panel
  with cyan rows and a green block cursor. Outputs `src/app/favicon.ico` (16/32/48), `icon.png` (512),
  `apple-icon.png` (180), `public/icons/icon-192.png`, `icon-512.png`. Starter SVGs removed from `public/`.

**Decisions** · No third-party image library (ADR-worthy only if the mark grows more complex). Fonts for the OG image
are fetched at build time rather than committed, to keep the repo free of font binaries.

**Verified by** · `pnpm check` and `pnpm build` clean; `curl` of `/robots.txt`, `/sitemap.xml`,
`/manifest.webmanifest`, `/opengraph-image`, `/favicon.ico`, `/icon.png` all 200 with the right content types;
head tags inspected on `/`; OG card and 512 px icon inspected visually.

---

## Phase 11 — Split-screen mode (SPLIT / SWAP)  (2026-09-12, branch `feat/split-screen`)

**Goal** · Reproduce ISPF logical screens: PF2 SPLIT, PF9 SWAP, START, SWAP n/PREV/LIST, SWAPBAR, and ending a
screen with PF3 — the "two tabs" workflow every ISPF user relies on.

**Built**
- `src/engine/splitScreen.ts` — `ScreenSession` snapshots (panel stack, editor, messages, drafts) with
  `splitScreen`, `swapScreen`, `closeScreen`, `parseSystemCommand`, `allSessions`, `describeSession`; `MAX_SCREENS = 8`.
- `SimulatorState` gains `screens` + `activeScreen`; the live per-screen fields stay flat so no screen handler changed.
- `reducer.ts` intercepts PF2/PF9 and the system commands SPLIT / SWAP / START before the panel sees them (as ISPF
  does); `render()` appends F2=Split / F9=Swap to every panel's legend once logged on.
- Primary Option Menu: `Screen. . : n of m`; PF3 / X ends the screen when others are open, logs off otherwise.
- Terminal: SWAPBAR row (`*2 PRIMARY  1 EDIT USER01.JCL(HELLO)`), `S2/2` in the status line.
- Lesson 15 "Working in two screens" (module 6), glossary entries SPLIT and SWAP, events `SCREEN_SPLIT`,
  `SCREEN_SWAPPED`, `SCREEN_CLOSED`.

**Decisions** · Typed drafts travel with the screen they were typed on (SWAP keeps them), matching ISPF. Unsaved
editor changes survive swapping. SWAP LIST is rendered as a long message rather than a pop-up panel.

**Verified by** · `tests/engine/splitScreen.test.ts` (12) + lesson 15 walk in `tests/tutorial/lessons.test.ts`;
140 tests green; browser check of PF2 → SWAPBAR → PF9.

---

## Phase 12 — Navigation accuracy: jump function, RETURN, keylist wording  (2026-09-14, branch `feat/nav-accuracy`)

**Goal** · Priority 1 of the expansion spec (audit in the plan file / this log): make `=option` work from every
panel, add RETURN, and stop describing PF keys as fixed.

**Audit** · `=3.4` was PARTIAL (only Primary Option Menu and Utilities honoured it); RETURN MISSING; PF-key
mechanism VERIFIED (per-panel legends) but wording PARTIAL ("PF3 saves and ends").

**Built**
- `src/engine/systemCommands.ts` — `parseSystemCommand` (=path, RETURN, RETRIEVE, SPLIT, START, SWAP), `jumpTo`,
  `returnToPrimary`; the reducer runs it before the panel and transmits typed fields first on editor panels.
- `screens/editor.ts#closeEditorForNavigation` — END processing without popping (save when dirty; failed save blocks).
- F4 = Return in every logged-on legend; jump special cases removed from `utilities.ts`.
- Wording: lesson 8, glossary PF3/SAVE, new glossary terms `keylist`, `jump`, `RETURN`; help panel; README.
- lspf acknowledged in `content/resources.ts`; `.gitattributes` normalises line endings to LF.

**Decisions** · ADR 0009.

**Verified by** · `tests/engine/jump.test.ts` (15): =3.4 from menu/utilities/DSLIST/member list/EDIT (saves)/
BROWSE/split screen; invalid & unavailable targets; read-only save blocks the jump; RETURN, PF4 with typed text,
no-op on the menu; 155 tests total; lint/typecheck/build green.

## Phase 13 — Advanced editor: profiles, UNDO, special lines, AUTOSAVE, RETRIEVE  (2026-09-14, branch `feat/editor-advanced`)

**Goal** · Priority 2 of the expansion spec: the editor features an operator meets in the first weeks —
UNDO/SETUNDO/RECOVERY, edit profiles that persist, COLS/BOUNDS/PROFILE special lines, NUMBER/STATS/AUTOSAVE,
FLIP and the RESET variants, plus ISPF command retrieval.

**Audit** · CAPS/NUMBER/COLS/PROFILE/RESET PARTIAL (flags with no effect, single ruler, one-line PROFILE message);
UNDO/SETUNDO/RECOVERY/BOUNDS/AUTOSAVE/FLIP/RETRIEVE MISSING; X/EXCLUDE VERIFIED and untouched.

**Built**
- `src/editor/profile.ts` — `EditProfile` per data-set type (last qualifier), defaults, `boundsWindow`.
- `src/editor/special.ts` — `=COLS>` / `=BNDS>` / `=PROF>` model with negative ids, `pruneSpecial`; `screens/editor.ts`
  renders them and accepts `<`/`>` overtyped on `=BNDS>`.
- `src/editor/history.ts` — per-interaction snapshots; `UNDO`; SAVE/CANCEL boundary; gated by SETUNDO/RECOVERY.
- Parser + `primaryCommands.ts`: NUMBER/UNNUM (STD 73-80), STATS, RECOVERY, SETUNDO, AUTOSAVE, BOUNDS/BNDS, COLS,
  PROFILE, FLIP, UNDO, `RESET ALL|EXCLUDED|X|SPECIAL|COMMAND|LABEL`, SUBMIT placeholder. FIND/CHANGE/EXCLUDE honour
  bounds. `catalog.saveRecords({stats:false})` leaves statistics alone.
- `screens/autosavePrompt.ts` — *Edit - Save or Cancel Changes* panel for AUTOSAVE OFF PROMPT; `closeEditorForNavigation`
  and `endSession` honour the three AUTOSAVE modes (jump/RETURN included).
- `systemCommands.ts` — `retrieveStack` (25, newest first), `RETRIEVE` / F12 on non-editor panels; dialogs keep F12 Cancel.
- `persistence/profileStore.ts` — `ispf-lab:editprofile:v1:<USERID>`, sanitised on load; store loads on LOGGED_ON,
  saves on change, clears on reset. New `LOAD_PROFILES` action.
- Glossary: UNDO, SETUNDO, RECOVERY, BOUNDS, COLS, PROFILE, AUTOSAVE, NUMBER, STATS, FLIP, RETRIEVE. docs/04 rewritten
  command table + profile/UNDO/retrieval sections.

**Decisions** · ADR 0010 (history snapshots, profiles outside the catalog), ADR 0011 (special lines).

**Deviations (documented)** · RECOVERY only enables UNDO; NUMBER covers LRECL 80 STD numbers only; HEX accepted
without display change; labels/macros not simulated; AUTOSAVE default ON (installation dependent).

**Verified by** · `tests/editor/advanced.test.ts` (23) — UNDO granularity/boundary/gating, profile naming and
persistence across sessions, CAPS, PROFILE lines never saved, STATS OFF, NUMBER/UNNUM, three AUTOSAVE modes incl.
jump, COLS line/primary + orphan pruning, BOUNDS window + `=BNDS>` overtype, FLIP/RESET EXCLUDED, RETRIEVE cycling,
F12 policy; `tests/persistence/stores.test.ts` profile round-trip through `SimulatorStore`; 179 tests; check/build green.

## Phase 14 — DSLIST and member-list depth, multi-command processing  (2026-09-14, branch `feat/dslist-depth`)

**Goal** · Priority 3 of the expansion spec: make 3.4 and member lists behave like the real panels an operator
lives in — richer line commands, list-level SORT/FIND/EXCLUDE, and several line commands per Enter.

**Audit** · DSLIST line commands PARTIAL (E B V M D R I, `S` wrongly = E); DSLIST primary PARTIAL (LOCATE/REFRESH
only); multi-command VERIFIED in the editor but only the first command ran on lists; member list I/G/=/J MISSING.

**Built**
- `parsers/listLineCommand.ts` — DSLIST `S CO MO X NX Z =`, member `I G J =` (1–2 character commands).
- `engine/listCommands.ts` — `collectListCommands` (display order), `runListCommands` (sequential; a panel-opening
  command parks the remainder in `frame.pending`; an error redisplays the rest), `resumeListCommands`. Reducer
  `resumeParked` calls the list's `onResume` whenever END pops back onto it. New `ScreenHandler.onResume`.
- `screens/dslistResults.ts` — sort/exclude/find state on the frame; marker rows for excluded runs; PF5 RFIND; `S`
  → short `DATASET_INFO`; `CO`/`MO` → `MOVE_COPY` with `prefill`; `Z` simulated compress; `=` repeats `lastCmd`.
- `catalog.copyDataset` (PDS deep copy / PS copy, target created when absent; move deletes the source) and
  `catalog.resetMemberStats`; `performCopy` routes whole-data-set requests to it.
- `screens/memberInfo.ts` — Member Information panel; member list `G`, `J` placeholder, `=`.
- docs/03 (panels table, DSLIST/member line commands, new *Multiple line commands* section, events), CHANGELOG.

**Deviations (documented)** · `Z` changes no data (there is no free-space model); `J` waits for Phase 16; excluded
DSLIST rows are shown as a marker row; FIND matches data-set names only.

**Verified by** · `tests/engine/listDepth.test.ts` (16): S/I, CO whole-PDS copy, MO move + read-only refusal,
X/NX/EXCLUDE ALL/RESET, Z, =, SORT (field, direction, invalid), FIND/RFIND/PF5, three immediates in one Enter,
suspend/resume across two panels, error stop with redisplay, member-list E on two members, jump discards parked
commands, member I/G/J/=; 195 tests; check/build green.

## Phase 15 — Export / Import Lab  (2026-09-14, branch `feat/export-import`)

**Goal** · Priority 4: carry a whole lab (catalog, edit profiles, progress, settings) between browsers safely.

**Audit** · Export/Import PARTIAL — catalog only, minimal validation.

**Built** · `persistence/labBundle.ts` (`buildBundle`, `serializeBundle`, `parseBundle` with structural validation
and v0.1 migration, `applyBundle` with an import summary); Progress page buttons *Export Lab* (download + textarea
fallback) / *Import Lab* (file input, confirm, summary note); *Reset training environment* now also clears edit
profiles; old catalog-only helpers removed; README, docs/02, CHANGELOG.

**Decisions** · ADR 0013.

**Verified by** · `tests/persistence/labBundle.test.ts` (4): round trip into a fresh adapter, v0.1 migration,
rejection reasons (JSON, format, version, names, record types, userid, size), unknown-key stripping; 198 tests;
check/build green.

## Phase 16 — Virtual JES and SDSF  (2026-09-15, branch `feat/jes-sdsf`)

**Goal** · Priority 5: the submit / SDSF / debug loop.

**Audit** · JES, SUBMIT, SDSF all MISSING (editor SUBMIT and member-list J were placeholders).

**Built**
- `src/jes/{types,jcl,programs,submit}.ts` — see `docs/10-jes-sdsf.md`.
- `engine/jesActions.ts` (`submitRecords`, `browseJobOutput`, `purge`), `screens/sdsf.ts` (menu, ST/O with the shared
  multi-command runner, job data sets, purge confirm), primary option `S` (+ `SD`, `SDSF`, `M.5`, `=S`), editor
  `SUBMIT`, member-list `J`, `TSO SUBMIT`; `state.jes` + `LOAD_JES`; `persistence/jesStore.ts`
  (`ispf-lab:jes:v1:<USERID>`, sanitised); lab bundle `jobs` field; seed `PAYRPT`.
- Glossary: JES, SDSF, job, JCL, JCL ERROR, condition code, JESMSGLG, SUBMIT. docs/02/03/04/10, ADR 0012, CHANGELOG.

**Decisions** · ADR 0012. PAYRPT uses a genuine JCL error (uncataloged SYSUT1) instead of the spec's IEFBR15,
because a missing module is an S806 abend on z/OS; S806 is simulated too.

**Verified by** · `tests/jes/jes.test.ts` (11: parser, errors, column 72, IEFBR14 allocation/deletion, IEBGENER,
SORT, IDCAMS, JCL ERROR, IEF212I, S806) and `tests/engine/sdsf.test.ts` (8: SUBMIT/J/TSO SUBMIT, option S and
=S, ST, ?/S browse, Day-One SJ→fix→CC 0000→SYSUT2, S/P/OWNER/PREFIX, LOG, persistence + reset); 217 tests.

## Phase 17 — Lessons 16–28  (2026-09-15, branch `feat/lessons-2`)

**Goal** · Priority 6: teach everything Phases 12–16 built, ending in the Day-One challenge.

**Built** · `tutorial/lessons/module7-8.ts` (16 jump/RETURN, 17 RETRIEVE + multi-command, 18 COLS/BOUNDS, 19 profiles,
20 UNDO/recovery, 21 exclude/FLIP) and `module9-10.ts` (22 advanced DSLIST, 23 member statistics, 24 SUBMIT, 25 SDSF
ST, 26 job output DDs, 27 debug JCL ERROR, 28 Day-One challenge with a state-only Challenge validator); `LessonStart.resetJobs`
(TutorialProvider dispatches `LOAD_JES`); coach `MessageNote` — the long ISPF message was never displayed before;
now Learn/Sandbox show it, Practice the short text only, Challenge nothing; lesson and module counts on the landing
page derive from `LESSONS`/`MODULES`; README, site description, OG image text, docs/05.

**Verified by** · `tests/tutorial/lessons.test.ts`: a Coached walk per new lesson (13) plus a Challenge-mode walk of
lesson 28 from state alone; catalogue test checks 28 lessons numbered in order; 231 tests; check/build green.

## Phase 18 — Definition-of-Done walkthrough and polish  (2026-09-15, main)

**Browser walkthrough (Chrome DevTools, Sandbox, 1440×900)** · logon → 2 → `{HLQ}.JCL(PAYRPT)` → PROFILE (=PROF>
lines) → COLS (=COLS>) → SUBMIT (`JOB USER01P(JOB00001) SUBMITTED`) → `=S` → ST (`JCL ERROR`) → `?` → S on
JESYSMSG (`IEF212I … SYSUT1 - DATA SET NOT FOUND`) → PF3 PF3 → SJ → `C PAYROLL.DATA DATA(EMPLOYEE)` → SUBMIT →
PF3 (`MEMBER SAVED`, JOB00002 `CC 0000`) → `?` → S on SYSUT2 (the four employee records) → Progress page →
Export Lab (bundle v2 with both jobs and the fixed member). No console errors or warnings.

**Found and fixed** · after a typed primary command the editor focused the cursor line (line 1 by default), so the
next command overtyped the JOB statement — an MVP-era defect exposed by the special lines. `processEnter` now keeps
focus on the command line unless the command moved the cursor (FIND/CHANGE/LOCATE) or text was typed over.

**Copy audit** · landing intro mentions jump, profiles, UNDO, SUBMIT/SDSF; key legend adds F4 and F12 retrieve;
glossary teaser adds JCL and SDSF; docs/07 test map updated.


## Phase 19 — Curriculum audit, Phase 0  (2026-10-15, main)

**Documentation only; no product code changed.** Audit of the 28 lessons, the simulator and the learning platform
against z/OS 3.2 documentation, baseline `e97a91b`. Entry point: `docs/curriculum/phase-0-audit.md`; the package
holds the lessons audit, the verified-sources registry with claim-level evidence (`docs/curriculum/evidence/`),
the curriculum and implementation roadmaps, the simulator gap matrix and the lesson authoring standards.

**Headline** · all 28 lessons are CORRECTION REQUIRED: Challenge mode completes on a trivial or stale-state action
in at least 25 lessons; replay dead-ends (L6, L12, L13) and state leaks; the "Edit SUBMIT submits the disk copy" and
"SJ saves back the member" statements are not supported by IBM; several job-output message IDs do not exist
(`IEFC606I`, `ICE026A`). Several suspicions were refuted (top-level `RECFM`/`LRECL` on a DD is valid, DISP defaults
are right). `pnpm check` passes (231 tests); no fixes were made. Next: review gate (M0), then corrections (M1).


## Phase 20 — M1a: assessment integrity and isolation  (2026-10-15, main)

Authorised after the M0 acceptance review; M1b and later are **not** started. Code changes: `src/state/TutorialProvider.tsx`,
`src/tutorial/{engine,types,validators,scenario,challenges}.ts`, `src/tutorial/lessons/index.ts` and starting states in
the lesson modules, `src/engine/{types,reducer}.ts` (`RESET_SESSION`), four hints in `module3.ts`.

**Test first.** (1) The suspected `startLesson` race was written as a React Testing Library test and failed on the
baseline: starting lesson 6 marked lesson 2 completed in saved progress. It is fixed by ignoring the runner events of
`startLesson`'s own setup dispatches. (2) The completion guard and event history have unit tests (4 of 9 failed first).
(3) The Challenge suite over all 28 lessons failed 64 cases before the outcome checks and the scenario reset. (4) The
mode-switch/session tests fail on the baseline commit (5 of 7 provider tests).

**Result.** 22 test files, 1,658 tests (+5 `it.todo` for M1b), `pnpm check` and `pnpm build` green. Challenge: no lesson
completes from the start state or by any of 15 probe shortcuts; every lesson replays and runs after every other lesson;
13 alternative routes accepted, 12 wrong answers rejected. See ADR 0016 (Accepted 2026-10-15, after the M1a acceptance).

**Behaviour changes to know about.** Starting, restarting or switching mode now closes split screens and any open editor
and re-applies the lesson's starting state (a mode switch used to keep leftovers and could finish a lesson instantly).
Lesson 3 restores the scroll setting it teaches; lesson 6 removes `{HLQ}.TEST.JCL`; lesson 13 creates it empty.

**Acceptance (same day).** Added a confirmation before a start / restart / mode switch that would discard unsaved or
learner-made work (`workAtRisk`, `confirmDiscard`, a read-only unsent-text probe from the terminal); compatibility tests for
lesson/step ids and stored progress; real browser walkthroughs (`docs/curriculum/m1a-acceptance.md`). Final: 22 test files,
1,658 tests (+5 todo), `pnpm check` and `pnpm build` green. M1b backlog: `docs/curriculum/m1b-backlog.md`.

**Not done in M1a (done in M1b below).** Wording/IBM corrections, SUBMIT/SJ text (ADR 0015), message ids, L17/L21/L27/L28
validator fixes, stale counts, resource links, CI.

## Phase 21 - M1b content and fidelity corrections (2026-10-15)

Approved by the project owner after the M1a acceptance (ADR 0016 accepted). Branch `feat/m1b-content-fidelity`, one commit per
sub-item. Tracked in `docs/curriculum/m1b-backlog.md`.

- **M1b-3 validators.** The five deferred cases fixed, each with a negative test (`tests/tutorial/m1b-validators.test.ts`):
  L17 needs the re-run (and the "press PF3 twice" text, wrong from Utility Selection, now counts nothing); L21 and L11 exclude
  steps no longer pass on FLIP or an open editor; L27 reads the SYSUT1 statement (no comments, any case), requires SJ
  (new `JOB_JCL_OPENED` event) and a PAYRPT job, and gets a Challenge outcome check; L28 Challenge accepts any repair
  (edit the JCL or create the data set) and requires the SYSUT2 report of the run that worked (decision: the objective names it, so it is
  assessed); L5, L6, L9 save steps check the data set and the saved member. A Browse of job output is an editor session of
  the simulator, so Challenge checks use "no Edit session open", not `editorClosed`.
- **M1b-2 SUBMIT/SJ.** Wording per ADR 0015 in the glossary, lesson 27, SDSF help, docs/10 and ADR 0012.
- **M1b-4 simulator.** `IEF374I` without `RC=`; `IEFC606I` becomes `IEFC019I`; `ICE026A` becomes `ICE056A` or plain text; DSLIST `S` vs `I`
  corrected; `SORT LRECL` descending by default; modification level once per edit session and capped at 99; `STATS OFF`
  discards statistics.
- **M1b-1 text.** Statements IBM contradicts retired from lessons 1-3, 7-8, 15-16, 18-20, 25 and the glossary (merged duplicate `JCL`
  entry). `tests/tutorial/retired-claims.test.ts` keeps them out.
- **M1b-5 housekeeping.** README and docs/05, docs/07 stop quoting counts; resources.ts and docs/08 re-synced with a test; IBM links
  point at the z/OS 3.2 PDFs (User's Guide Vol I and II, Edit and Edit Macros); the unresolved SHARE link is removed; optional
  `.github/workflows/ci.yml` runs `pnpm check` and `pnpm build` (not runnable locally; first run happens on push).

Final at the end of M1b: 26 test files, 1,729 tests, no todo. Residual items are in the backlog (invented IEFC605I variants, other inexact message layouts,
`G` panel, the "uncataloged" premise, scored scripted errors in L1 and L7, browser re-check of the changed lessons).

## Phase 22 - M1 closure review (2026-10-15)

Branch `feat/m1-closure`. Full report: `docs/curriculum/m1-closure-report.md`. Verdict: **M1 closed, accepted with three conditions**
(push and confirm CI; treat IBM-silent behaviour as unverified; keep the legacy fallback allow-list shrinking).

- P0/P1 ledger built from the Phase 0 audit, the M0 review and the gap matrix: no open P0, no blocker; deferrals are justified and assigned.
- `LessonStep.expectsError` (Learn mode): the invalid option in L1 and `SAVE` in Browse in L7 are no longer scored as mistakes.
- L28 "uncataloged" wording corrected in docs and the seed `PAYRPT` comment (the data set does not exist; the create route is valid).
- Small fixes: L4, L10 wording; L24 `teaches`; L26 submit step requires SORTJOB; Progress-page reset clears the JES (GAP-64); editor
  `SUBMIT` refuses operands (GAP-76); stale `docs/04` SUBMIT sentence.
- New gates: every lesson's legitimate route scores 100; a new lesson must define its own Challenge (six legacy fallbacks allow-listed);
  the retired-claims test scans the reference docs.
- Findings for L4, L10, L12, L13, L14, L24, L26 classified, not all implemented. Browser walkthroughs: L1, L7 (Learn and Challenge), L17, L26, L27.
- CI: workflow exists, **never pushed or executed**. Final: 28 test files, 1,784 tests, `pnpm check` and `pnpm build` green.

## Phase 23 - M2 lesson metadata and start stack (2026-10-15)

Approved by the project owner after the M1 closure. Branch `feat/m2-lesson-metadata`. Report: `docs/curriculum/m2-report.md`; ADR 0017.

- `Lesson.requires` (advice, never a lock; coach note "Before you start") and `Lesson.sources` (SRC ids, format checked only). Only L13 declares
  `requires`; no sources backfilled (no evidence for a mapping).
- `LessonStart.underMenu`: L5, L7-L10, L12 start with the Primary Option Menu underneath, so PF3 returns to the menu (GAP-73). A test requires it.
- Not done: any hard lock, a "References" panel, `difficulty`/`estimatedMinutes`/`reviewStatus` (dropped by the M0 review). M3 not started.
- Final: 30 test files, 1,803 tests, `pnpm check` and `pnpm build` green. CI still never run.

## Phase 24 - M3 first tranche (2026-10-15, in progress)

Branch `feat/m3-foundations`. Lessons 29-31 (a-01, b-01, b-02) added as **drafts** (author-checked against the sources in their specs; independent
source, fidelity and expert review pending). Specs: `docs/curriculum/lessons/`. New: `LessonStart.createMembers`, `EDITOR_SCROLLED{amount}`.
Not done: b-03 to b-06 and b-10 (each needs a small simulator prerequisite), an M3 report, public copy still says 28 lessons. Do not merge or publish before review.
