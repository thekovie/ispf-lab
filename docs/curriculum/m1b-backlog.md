# M1b backlog (M1b in progress)

Everything here is **outside M1a**. M1b was approved on 2026-10-15; status per item is in the **Status** notes below. Sources: the lesson audit
([existing-lessons-audit.md](existing-lessons-audit.md)), the M0 review ([m0-acceptance-review.md](m0-acceptance-review.md)
section F, M1b-1 to M1b-5), the probes ([evidence/probes/](evidence/probes/README.md)) and the M1a acceptance work.
Test ids below are the `it.todo` titles in `tests/tutorial/challenge-routes.test.ts`; when each item is fixed, replace its
todo with an asserting test that cites the same finding.

## 0. Status (updated as M1b proceeds)

| Item | Status |
|---|---|
| T1-T5, A1, A2, A6, A7 | **Fixed** (M1b-3), asserted in `tests/tutorial/m1b-validators.test.ts` |
| A3 | **No change needed**: SUBMIT from Edit submits the buffer (ADR 0015), so `resubmit` passes on an unsaved fix and `save` still requires the saved member; asserted |
| A8 | **Accepted as designed**: L28's objective says "by whatever route you choose", so Learn steps 1-2 also accept a run that already succeeded |
| B5 (L5 step 2, L6 steps 3-4, L9 and L11 step 6) | **Fixed** (M1b-3); L11 step 5 (exclude) also fixed: its alternative `editorLineCount > 0` was always true |
| A4, A5 | **Fixed** (M1b-2: SJ and IEF212I wording) |
| B2, B3, B4 | **Fixed** (M1b-2, M1b-4): SUBMIT/SJ wording, `IEF374I` (no `RC=`), `IEFC606I` to `IEFC019I`, `ICE026A` to `ICE056A` or plain text, `S` vs `I`, `SORT LRECL` default, modification level once per session capped at 99, `STATS OFF` discards statistics. Still open inside B3/B4: the invented `IEFC605I` variants, other inexact layouts (`IEF376I`, `IEF237I`, `ICE000I`), `G` panel, member-info labels |
| B1 | **Fixed (text)**: L1 pop-ups, L2 PF3 count, L3 option 0 scroll, L7 Browse look, L8 MODIFIED/AUTOSAVE, L15 screen limit, L16 jump/RETURN, L18 BNDS/default bounds, L19 CAPS/PROFILE, L20 RECOVERY/undo, L25 SDSF option and OWNER, glossary "no undo" and the duplicate `JCL` entry (and the `b` alias shadowing `B`). Guarded by `retired-claims.test.ts` |
| B1 residual | Behaviour left as is and now disclosed: L2 the simulator keeps Utility Selection on the stack; L7 Browse shows plain line numbers; L15 each screen fills the display; L18 BNDS is accepted on the command line; L19 PROFILE shows two lines; scoring still counts the scripted errors of L1 step 4 and L7 `SAVE` as mistakes |
| A9, B6 | Open (the "uncataloged" premise wording; housekeeping) |

## 1. The five deferred test cases

| # | Todo title (verbatim) | Defect | Where | Fix direction | Acceptance |
|---|---|---|---|---|---|
| T1 | L17 Learn step 5 completes after the first PF3, before the re-run (audit probe a) | `allOf(onScreen(DSLIST_SEARCH), retrieveStack.length > 0)` passes after one PF3, so the "re-run" is never required | `module7-8.ts` L17 step `rerun` | Require the re-run event (a later `COMMAND_ENTERED` equal to a retrieved command), as the Challenge check already does | Test: PF3 alone does not advance step 5; retrieve + re-enter does |
| T2 | L21 Learn: FLIP alone skips the EXCLUDE step (audit probe f Q1) | Typing `FLIP` with nothing excluded satisfies the exclude step by state; step 3 then passes on the same Enter | `module7-8.ts` L21 steps `exclude`, `flip` | Make `flip` require that lines were excluded earlier in the lesson | Test: FLIP first does not complete the lesson |
| T3 | L27 Learn: a comment line containing DATA(EMPLOYEE) passes the fix step (audit probe m) | `editorHasLine(/DATA\(EMPLOYEE\)/)` scans any line, case-sensitive | `module9-10.ts` L27 step `fix`, `payrptFixed` | Check the SYSUT1 DD statement only, case-insensitively, ignoring comment lines | Test: comment edit does not pass; lowercase `dsn=user01.data(employee)` does |
| T4 | L28 Challenge: creating PAYROLL.DATA is a valid repair that is rejected (audit probe o) | `payrptFixed` demands `DATA(EMPLOYEE)` text and the absence of `PAYROLL.DATA` | `module9-10.ts` L28 challenge | Outcome check: a job `{HLQ}P` ended CC 0000 whose SYSUT1 resolved to an existing data set, whatever the route (edit the JCL, create or rename the data set) | Tests: both repair routes complete; unrelated `{HLQ}P` job does not |
| T5 | L27 Challenge: completes with zero jobs submitted (audit probe n) | Fallback check `editorClosed + payrptFixed` is true after editing the member, with no resubmit | `module9-10.ts` L27 (no `challenge`) | Add an outcome check in `src/tutorial/challenges.ts`: fix saved **and** a later job ended CC 0000 | Tests: edit + PF3 alone does not complete; edit + submit does |

## 2. Remaining L27 / L28 assessment defects (beyond the five)

| ID | Lesson | Defect | Evidence | Priority |
|---|---|---|---|---|
| A1 | L27 | Step `sj` passes by opening PAYRPT in Edit by any route, so SJ is never required | audit L27 validation findings; `module9-10.ts` step `sj` | P2 |
| A2 | L27 | Step `submit` is satisfied by any JCL-error job, not PAYRPT | audit L27 | P2 |
| A3 | L27 | `resubmit` passes on an **unsaved** fix (`JOB_COMPLETED` for any job, editor buffer submitted) while the final step needs the saved member | audit L27; ADR 0015 | P2 |
| A4 | L27, L28 | Text teaches "SJ opens the submitted JCL" and "PF3 saves the fix back to the member"; IBM says SJ edits a copy that is not saved | EV-C c3, c4; ADR 0015 | P1 (wording, M1b-2) |
| A5 | L27, L28 | Hints/questions say "IEF212I names the data set"; IBM: it names job, step and DD | EV-B 2.2; `module9-10.ts:269,320` | P1 (wording) |
| A6 | L28 | Challenge never checks SYSUT2 although the objective says "look at its report in SYSUT2"; decide: assess it or reword to "outcome only" | M0 concern 1; `module9-10.ts:307,336-339` | P1 |
| A7 | L28 | `payrptSucceeded` accepts any job named `{HLQ}P` with CC 0000, regardless of which JCL produced it | audit L28 | P2 |
| A8 | L28 | Learn steps 1 and 2 also accept `payrptSucceeded`, so diagnosing IEF212I can be skipped | audit L28 probe I | P2 |
| A9 | L27, L28 | "Uncataloged" premise: `PAYROLL.DATA` simply does not exist (the simulator has no uncataloged state); the comment lines in PAYRPT give the answer away | `seed.ts:96-97`, `docs/10:46` | P2 (reword, ADR candidate) |
| A10 | L28 | Stale-state completion after Learn then Challenge | **Fixed in M1a** (guard, mode-switch reset, tested for all 28 lessons) | done |

## 3. Other M1b items (from the M0 review, unchanged)

| ID | Item | Reference |
|---|---|---|
| B1 | Correct statements IBM contradicts or does not support: L1 pop-ups, L2 `3.4` PF3 count, L3 option 0 scroll, L7 Browse look, L8 MODIFIED/AUTOSAVE, L15 screen limit, L16 wording, L18 to L20 BOUNDS/CAPS/RECOVERY/undo, L22 S vs I, L23 STATS/mod level, L25 SD/M.5/OWNER; glossary "no undo" and the duplicate `JCL` key | M0 review F-09, M1b-1 |
| B2 | Edit SUBMIT and SJ wording per ADR 0015; new note in `docs/10`; update tests that lock the old premise (`sdsf.test.ts`, `lessons.test.ts:64-68`) | F-04, F-05, F-10 |
| B3 | Message ids: `IEF374I` without `RC=`; replace `IEFC606I`, `ICE026A`; correct the other inexact layouts only where a lesson shows them | F-06, M1b-4 |
| B4 | L22 `S` omits directory and member counts for a PDS, `SORT LRECL` defaults descending; L23 modification level bumps on the first change and `STATS OFF` discards statistics | EV-A 6, 2; GAP-74, GAP-75 |
| B5 | Learn-step validators: L5 step 2 named data set, L6 steps 3 and 4 (PDS attributes, listing), L9 and L11 step 6 (state, not event-only) | M1b-3 |
| B6 | Housekeeping: stale counts (README test count, glossary entries), resource links, optional CI | M1b-5 |

## 4. Known limits carried over from M1a

- Text typed on a 3270 screen but not yet submitted with Enter lives in the terminal component, not in the engine, so it
  is not part of the confirmation described in the M1a report; an editor buffer that has been entered but not saved is.
- L13 "two ways" is assessed as "two copies".
- The shortcut battery is finite (15 sequences); add a sequence whenever a new cheap path is found.
