# M1a acceptance validation

**Date:** 2026-10-15. **Scope:** final validation of M1a before M1b (see [m1a-report.md](m1a-report.md) for what M1a is).
**Result:** **ACCEPTED** with the remaining issues in section 6. M1b has **not** been started.
**Commit:** recorded in `git log` on branch `feat/m1a-assessment-integrity` (the hash is in the hand-off message and in
`docs/00-project-log.md`).

## 1. Final verification runs (independent re-run)

| Command | Result |
|---|---|
| `pnpm check` (typecheck, lint, tests) | exit 0: **22 test files, 1,658 tests passed, 5 todo** (baseline `e97a91b`: 15 files, 231 tests) |
| `pnpm build` | exit 0, compiled successfully |

## 2. What acceptance added to M1a

Validation found one real gap, which is now fixed:

| Finding | Evidence | Fix |
|---|---|---|
| M1a closed the editor and restored seed members on lesson start, restart and mode switch **without asking**, so unsaved editor work or the learner's saved changes to a lesson member could be lost silently | Reproduced with the unit tests (RED: 11 failing before the change) and in the browser (text typed in the editor vanished on a mode switch) | `workAtRisk()` in `src/tutorial/scenario.ts` lists what would be lost; the provider asks once through `confirmDiscard` (default `window.confirm`) before a start, restart or mode switch, and does nothing if cancelled |
| Text typed in the editor but not yet sent with Enter lives in the terminal component (3270 drafts), invisible to the engine | Browser walkthrough W6 | The terminal registers a read-only probe on the store (`setUnsentProbe`); editor record and prefix fields only, so an unsent command never prompts. Draft semantics are unchanged |

**What triggers a prompt (and what does not).** A prompt appears only when something would be lost: an editor with
unsaved changes (in this or another split screen), editor text typed but not sent, a seed member the learner changed
and the lesson would restore, or a leftover data set or member with content that the lesson removes. It lists at most
five items. Empty leftovers, unchanged members, a fresh session, switching to Sandbox, and a first lesson start never
prompt. Cancelling leaves the mode, lesson, editor and data exactly as they were.

New tests for this: `tests/tutorial/scenario.test.ts` (8, `workAtRisk`), `tests/tutorial/provider.test.tsx` (8 confirmation
cases), `tests/components/terminal-unsent.test.tsx` (5, the real `Terminal`).

## 3. Browser walkthroughs

**Setup.** Chrome driven through the DevTools protocol, viewport 1440 x 900, `pnpm dev`, `localStorage` cleared first,
userid `USER01`, the **native** `window.confirm` in place. State was read from the page and from `localStorage`
(`ispf-lab:catalog:v1:USER01`, `ispf-lab:progress:v1`). Console: no errors or warnings.

| # | Walkthrough | Steps and observed result |
|---|---|---|
| W1 | **Lesson replay** (L6, Learn) | Allocated `USER01.TEST.JCL` through 3.2 ("DATA SET ALLOCATED"). Clicked RESTART LESSON: catalog entry went from present to **removed**, **0 prompts** (the library was empty), progress back to 0 / 5, screen back at the Primary Option Menu. Then 3.2 with `A` reached the **Allocate New Data Set** panel again, which was the pre-M1a dead end (`DATA SET ALREADY EXISTS`) |
| W2 | **Learn to Challenge** (L6) | With the library allocated in Learn, clicked 3 CHALLENGE: library **removed**, mode Challenge, the new outcome-based task text shown ("Create USER01.TEST.JCL as a PDS ... and find it in the data set list"), lesson **not** completed, 0 prompts |
| W3 | **Challenge completion by an alternative route** (L6) | Allocated with **12** directory blocks (not the lesson's 10): not complete. Then `=3.4` (jump) and level `USER01` (wider than the lesson's): the coach showed **"Lesson complete. Score 90 / 100 - 1 mistake, 0 hints"** (the mistake was my own mistyped option). `progress` saved `completed`, `attempts 2`, `bestScore 90`. Screenshot: [w1-l6-challenge-complete.webp](evidence/m1a-browser/w1-l6-challenge-complete.webp) |
| W4 | **Cross-lesson navigation** (the old race) | In Challenge mode started L2, typed `3.4` (now on DSLIST), then started L6 from the picker. Saved progress for L2: **`in-progress`, attempts 1** (before M1a this case saved L2 as completed). L6 keeps its earlier completion |
| W5 | **Unsaved edit and lesson switch** (L24 to L18) | Opened `USER01.JCL(HELLO)`, entered a changed record (`IEBGENER`) without saving, picked lesson 18. The native dialog read: *"Starting lesson 18 will discard: - unsaved changes in USER01.JCL(HELLO). Continue?"*. **Cancel:** stayed on lesson 24, the picker reverted to "24", the edited record was intact. **OK:** moved to lesson 18 on the Primary Option Menu; the saved `HELLO` member was unchanged (the edit was never saved). Picking lesson 24 from lesson 18 with nothing at risk asked nothing |
| W6 | **Mode switch with unsent text** (L24) | Typed a record change in the editor **without** pressing Enter, clicked 3 CHALLENGE. Dialog: *"Switching mode restarts this lesson and will discard: - text typed in USER01.JCL(HELLO) but not yet sent with Enter. Continue?"*. Cancel: mode stayed Learn, typed text still in the field. Screenshot: [w2-unsent-text-kept-after-cancel.webp](evidence/m1a-browser/w2-unsent-text-kept-after-cancel.webp) |

**Tooling note.** In the first W5 attempts the automation tool's own default accepted the dialog, which looked like the
app ignoring Cancel. Repeated with dialogs set explicitly to dismiss or accept, the app behaved correctly (above). The
unit tests (a stubbed `confirmDiscard`) give the same result.

**Not exercised in a browser:** lessons other than 2, 6, 18 and 24 (the other 24 are covered by the 1,658 automated cases,
including the Learn-then-Challenge matrix for all 28); narrow viewports (the lab is desktop-gated); browsers other than Chrome.

## 4. Requirement-by-requirement

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Browser walkthroughs: replay, Learn to Challenge, Challenge completion, cross-lesson navigation | **Met** | W1 to W4 (+ W5, W6) |
| 2 | No unexpected loss of unsaved editor contents; minimal confirmation for work that would be lost, not for harmless resets | **Met after a fix** | section 2; W5, W6; 21 new automated cases; harmless resets prompt nothing (W1, W2, L18 to L24) |
| 3 | Guard and outcome checks accept legitimate alternatives and do not complete on stale state | **Met** | W3 (alternative route); `challenge-routes.test.ts` (13 accepted, 12 rejected); `challenge.test.ts` Learn-then-Challenge matrix for all 28 lessons and the 28 x 28 isolation matrix |
| 4 | Independent re-run of `pnpm check` and `pnpm build` | **Met** | section 1 |
| 5 | Five deferred tests and the L27/L28 assessment defects tracked for M1b | **Met** | [m1b-backlog.md](m1b-backlog.md): T1 to T5 (verbatim titles of the `it.todo` cases) and A1 to A10 |
| 6 | Lesson ids, stored progress, local-first behaviour compatible | **Met** | `tests/tutorial/compat.test.tsx` (6): all 28 lesson ids and 137 step ids equal the baseline commit's (fixture extracted from `e97a91b`), the progress key and version-1 shape are unchanged, a stored baseline-format record survives start, mode switch and restart, and everything runs on the injected storage adapter (only `ispf-lab:*` keys). No network call, no new dependency |
| - | ADR 0016 retained as provisional; Challenge engine not redesigned | **Met** | no engine change in acceptance; the only additions are the confirmation and the unsent-text probe |

## 5. Test counts added in acceptance
`scenario.test.ts` +8 (`workAtRisk`), `provider.test.tsx` +8 (confirmation), `terminal-unsent.test.tsx` +5,
`challenge.test.ts` +28 (Learn then Challenge on the same data), `compat.test.tsx` +6. From 1,603 to 1,658 passing (8 + 8 + 5 + 28 + 6 = 55).

## 6. Remaining issues

| # | Issue | Disposition |
|---|---|---|
| 1 | The prompt is a plain `window.confirm` (the same pattern as the existing progress and environment resets), so it is not styled or accessible beyond the browser dialog | Acceptable for M1a; a styled dialog is a UI task for later |
| 2 | Unsent text in **non-editor** fields (a half-typed command, a data set name on an entry panel) is discarded without a prompt, by design (harmless) | Documented; revisit only if learners report losing such input |
| 3 | Nine lessons keep their existing end check behind the guard (L1, 4, 8, 11, 12, 26, 27; L14, L28 own checks) | M1b backlog A1 to A9 |
| 4 | L13 "two ways" is assessed as "two copies" | Known limit (M1a report section 6) |
| 5 | Browser coverage is four lessons on Chrome at one viewport | Recommended: a second pass on another browser during M1b |
| 6 | All M1b items (IBM wording, message ids, validator fixes, stale counts, links, CI) | [m1b-backlog.md](m1b-backlog.md); needs your approval to start |
