# M1 Closure Report

**Date:** 2026-10-15. **Scope:** M1a (assessment integrity) and M1b (content and fidelity), cross-checked against the
[Phase 0 audit](phase-0-audit.md), the [M0 acceptance review](m0-acceptance-review.md), the [M1b backlog](m1b-backlog.md) and the
repository. **Branch:** `feat/m1-closure` (on top of `feat/m1b-content-fidelity`). Nothing is pushed. M2 and M3 are **not started**.

## 1. Verdict

**M1 is CLOSED - ACCEPTED, with three conditions** (section 8). No P0 is open. Two P1 items remain open, neither blocking: CI has
never run (nothing is pushed), and one navigation fidelity gap (GAP-73) is deferred with a reason. The curriculum and assessment system
can carry new source-backed lessons, provided each new lesson meets the authoring gates that the tests now enforce.

## 2. What this review changed

| # | Request | Result |
|---|---|---|
| 2 | L1 and L7 scoring | New `LessonStep.expectsError` (Learn mode only). L1 step 4 (`99`) and L7 step "try-typing" (`SAVE` in Browse) are no longer mistakes; Challenge still counts every error. Before: both lessons finished with a mistake. Browser: L1 and L7 now end at 0 mistakes, score 100 |
| 3 | L28 "uncataloged" wording | `PAYROLL.DATA` is described as a data set that does not exist, in `docs/03`, `docs/10` and the seed `PAYRPT` comment (which also said "fix the JCL", ruling out the valid create-the-data-set repair). Learner-facing lesson text was already clean after M1b-2. A test fails if the premise returns |
| 4 | Findings for L4, L10, L12, L13, L14, L24, L26 | Classified in section 5; small text or step fixes for L4, L10, L24, L26; the rest resolved earlier or deferred |
| 1 | P0/P1 ledger | Section 3. Two cheap P1 leftovers were fixed: the Progress-page reset skipped the JES (GAP-64), and editor `SUBMIT` silently ignored operands (GAP-76). One stale sentence from M1b-2 was found and fixed in `docs/04` ("deviation: ISPF submits the saved data set"); the retired-claims test now scans the reference docs |
| 7 | Gate for new lessons | `scoring.test.ts` fails for a new lesson without its own `challenge` (six legacy lessons are allow-listed) and for any lesson whose legitimate route does not score 100 |

## 3. P0/P1 ledger

Status: **RESOLVED**, **DEFERRED** (reason and milestone given), **OPEN** (not a blocker unless stated). Priorities are those after the M0 review.

| Finding | Pri | Status | Evidence / reason |
|---|---|---|---|
| Challenge completes without the task (GAP-60, 61; F-01, F-14) | P0 | **RESOLVED** (M1a) | Guard + outcome checks; shortcut battery, stale-state matrix, 28 x 28 isolation |
| Replay dead ends, mode switch keeps leftovers (GAP-62, 72; F-02, F-16) | P0 | **RESOLVED** (M1a) | Start-state fields, session close, confirmation before discarding work |
| `startLesson` race marks previous lesson complete (F-03) | P1 | **RESOLVED** (M1a) | Failing provider test first; browser re-check in the M1a acceptance |
| Tests encode the defects (F-10) | P1 | **RESOLVED** | Tests that locked the old premises were rewritten (M1a/M1b); a docs scan now blocks the old claims |
| Edit `SUBMIT` false claim (GAP-01) | P1 | **RESOLVED** (M1b-2, `docs/04` here) | ADR 0015; unsaved-edit behaviour is IBM-silent, so the text only says that |
| `SJ`/`SE`/`X` behaviour (GAP-50) | P1 | **DEFERRED** (M4) | Disclosed in lesson 27, glossary, help, docs/10; both fix routes work; redesign needs an approved lesson (ADR 0015 D2) |
| Message fidelity (GAP-42) | P1 | **RESOLVED** for what lessons show | `IEF374I`, `IEFC606I`, `ICE026A`, IEF212I wording. Other layouts (`IEF376I`, `IEF237I`, `ICE000I`, JESMSGLG time prefix) **DEFERRED** (P2/P3, M4) |
| Contradicted statements (GAP-02, 03, 05, 06, 08) | P1 | **RESOLVED** (text, M1b-1) | 18 retired statements guarded by test. Simulator behaviour that still differs (Utility Selection on the PF3 stack, option 0 scroll field, plain line numbers in Browse) is disclosed in the text |
| DSLIST `S`/`I`, SORT default, member statistics (GAP-74, 75) | P1 | **RESOLVED** (M1b-4) | Tests cite the evidence. Member-info labels and the `G` panel **DEFERRED** (P3) |
| "Uncataloged" Day-One premise (GAP-10, L28) | P1 | **RESOLVED** here (wording); catalog state model **DEFERRED** (M4, lesson c-06) | The simulator has no uncataloged state |
| Progress identity (GAP-63) | P1 to P2 | **RESOLVED** by decision | ADR 0014 (global per browser, documented) |
| Scoring penalises instructed errors (GAP-65) | P1 | **RESOLVED** here | Section 2 |
| Reset consistency (GAP-64) | P1 | **RESOLVED** here | Progress-page reset now clears the JES; test |
| `SUBMIT` operands ignored (GAP-76) | P1 | **RESOLVED** here | Refused with `SUBMIT OPERANDS NOT SUPPORTED`; tests |
| Test strategy (GAP-70) | P0 tests / P1 CI | tests **RESOLVED**; CI **OPEN** | 231 to 1,784 tests. The workflow exists but has not run (section 6) |
| Lesson start screens (GAP-73) | P1 | **DEFERRED** (M2) | PF3 on a lesson's first DSLIST panel does nothing (real ISPF returns to the menu). No lesson is blocked (hints were corrected in M1a). The fix needs a start-stack option on `LessonStart`; new lessons should start at the menu |
| Name qualification, TSO messages (GAP-20, 23, 24) | P1 | **DEFERRED** (M4, lesson c-01) | Lessons only use the `JCL(member)` form, which qualifies correctly |
| COND, IF, DISP, PROC, DD keywords, programs, abends, SORT collation (GAP-30 to 33, 36, 40, 41, 45) | P1 to P2 | **DEFERRED** (M4) | No current lesson exercises them; each is built only when an approved lesson needs it (roadmap rule) |
| Statement-number consistency (GAP-37) | P1 | **DEFERRED** (prerequisite of lesson b-03) | Affects converter-error listings only; no current lesson shows one |
| PREFIX/OWNER (GAP-51) | P1 | wording **RESOLVED**; behaviour **DEFERRED** (M4, c-03) | |
| Prerequisite metadata (GAP-66) | P1 | **DEFERRED** (M2, optional) | L13, L14, L25 start self-sufficiently since M1a, so no dead end today |
| Accessibility (GAP-68) | P1 to P2 | **DEFERRED** (M5) | Reclassified P2 by the M0 review |
| IBM-silent behaviour (unsaved Edit SUBMIT, SJ write-back, PF3 count after typed 3.4, JCL-error jobs on SDSF O/H, IEBGENER text, empty-member SAVE) | - | **OPEN, not a blocker** | Needs a z/OS expert or live system; the text says less instead of guessing |

**Explicit blockers: none.**

## 4. Test and build results

| Check | Result |
|---|---|
| `pnpm check` (typecheck, lint, tests) | exit 0, no warnings: **28 test files, 1,784 tests passed, 0 todo** |
| `pnpm build` | exit 0, compiled successfully |
| History | Phase 0 start: 15 files, 231 tests. M1a end: 22 files, 1,658 + 5 todo. M1b end: 26 files, 1,729 |
| RED evidence this review | Scoring: 7 failing before the change. Uncataloged wording: 3 failing against the old docs and seed. SUBMIT operands and Progress reset: 5 failing. An attempted tightening of the L4 level validator proved unnecessary (the old validator already rejects bad levels) and was reverted rather than kept |
| Compatibility | `compat.test.tsx` passes: 28 lesson ids, 137 step ids, progress key and shape unchanged |
| Determinism, local-first | No network, no new dependency, no new storage key. The only data change is the PAYRPT comment text in the seed (existing catalogs get it when the lesson restores the member) |

**Browser (Chrome, dev server, native dialogs, console clean):**
- L1 Learn: invalid option `99` as instructed, lesson completes with 0 mistakes, score 100.
- L7 Learn: `SAVE` in Browse shows `SAVE NOT ALLOWED IN BROWSE`, completes with 0 mistakes, score 100. L7 Challenge: not complete after Browse alone, complete after Edit.
- L17 Learn: after leaving the list and returning to the menu the re-run step is still pending (it used to complete); retrieving `3.4` and running it completes the lesson ([screenshot](evidence/m1-closure-browser/c1-l17-learn-rerun-complete.webp)).
- L26 Learn: submitting `HELLO` leaves the step pending; submitting `SORTJOB` advances it.
- L27 Challenge: IEF212I reads `job step DD - DATA SET NOT FOUND`; not complete while the SJ edit is open, complete after PF3 (score 100). The confirmation for restoring the edited PAYRPT appeared when I switched mode.
- L28 Challenge by the create-the-data-set route was verified in the M1b session (score 100).
- Not browser-tested: L4, L10, L24 wording; the Progress page JES reset (unit test only).

## 5. Findings for L4, L10, L12, L13, L14, L24, L26

| Lesson | Finding (audit) | Severity now | Disposition |
|---|---|---|---|
| L4 | Dsname Level taught as a character prefix; columns shown up front; level validator loose | P2 | **Text fixed** (qualifier model, view disclosure). Validator is fine: a level that matches nothing never shows the list. `/` option marker **deferred** (P3) |
| L10 | Trivial Challenge; "to the end" instruction; message text differs | P2 | Challenge **resolved** (M1a). Wording **fixed**. Record-order validator **deferred** (P3: the Challenge already needs the three edits, then CANCEL) |
| L12 | Untouched new member is saved on PF3; rename/delete rows use the enhanced member list | P2 | **Deferred** (M4): needs IBM confirmation (empty-member SAVE is on the unresolved list). Replay is resolved (M1a) |
| L13 | Trivial Challenge; replay dead end; objective unassessed | P1 | **Resolved** (M1a: outcome check, empty `TEST.JCL` created at start, removed at the end). Residual P3: "two ways" is assessed as "two copies"; no "replace like-named members" toggle |
| L14 | `finalCheck` accepts `//STEP2` anywhere | P2 to P3 | **Accepted as designed** (disclosed leniency, M0 F-18) |
| L24 | SUBMIT claim; trivial Challenge; operands ignored; `//dd DD` taught but HELLO has none | P1 | Claim **resolved** (M1b-2); Challenge **resolved** (M1a); operands **fixed** here; `teaches` corrected here |
| L26 | Sort not observable (EMPLOYEE already ordered); TSO qualification overclaim; IEF374I; loose submit step | P2 | `IEF374I` **resolved** (M1b-4); submit step now requires SORTJOB (**fixed** here). Seed reorder **deferred** (P2, GAP-77): it would make persisted catalogs inconsistent, and a future sort lesson brings its own data. Qualification **deferred** (M4) |

None of these blocks new courses.

## 6. CI

**The workflow has not been pushed or executed.** `feat/m1a-assessment-integrity`, `feat/m1b-content-fidelity` and this branch exist only
locally (the remote holds `main` and older feature branches); `gh run list` returns no runs. Checked locally: the lockfile is in sync
(`pnpm install --frozen-lockfile --lockfile-only` passes) and `pnpm check` and `pnpm build` pass. Not checked: how GitHub parses the YAML
(no linter available) and Node 22 (CI) versus Node 26 (local). **Action for you:** push a branch or open a PR and confirm the run is green.
Until then CI is an unverified file, not a gate.

## 7. ADR 0016 and the validation architecture

The decision stands, and it held when used on all 28 lessons:

- Guard (armed on a false check, baseline snapshot) plus outcome checks over the event history. The Learn-then-Challenge matrix, the 28 x 28
  isolation matrix and the shortcut battery all pass, and M1b added two lesson-specific checks (L27, L28) without touching the engine.
- The cost per lesson is real: each new lesson needs a hand-written outcome check, a walk and negative tests. That is the intended price,
  and the tests now enforce it (`scoring.test.ts`, `challenge.test.ts`).
- One design lesson from M1b: a Browse of job output is an editor session of the simulator, so outcome checks must say "no Edit session
  open", not "editor closed". Recorded in the authoring standards.
- Limits that remain: the shortcut battery is finite; text typed but not sent is tracked only for the editor; outcome checks judge state and
  events, not quality of work.
- Additions made here (`expectsError`, the "new lessons need a Challenge" test) are recorded in ADR 0016.

## 8. Remaining risks and conditions

**Conditions for the verdict:** (1) push and confirm CI is green; (2) treat the IBM-silent behaviours as unverified until a z/OS expert reviews
them (the text avoids asserting them); (3) keep the allow-list in `scoring.test.ts` shrinking, never growing.

| Risk | Impact | Mitigation |
|---|---|---|
| Lesson text is checked against IBM PDFs by the reviewer and the retired-claims list, not by a z/OS practitioner | Subtle fidelity errors in new content | Expert review of each new lesson spec before `approved` (authoring standards) |
| Browser coverage: Chrome only, a handful of lessons per milestone | Rendering or focus issues elsewhere | Firefox/Safari smoke pass when new lessons land |
| Existing catalogs keep old seed text until a lesson restores a member | Cosmetic inconsistency | Acceptable; lesson members are restored on lesson start |
| Hand-written outcome checks scale with lesson count | Authoring cost, possible false positives | Gates in tests; the shortcut battery grows with each find |
| Simulator features for Track B (COND, IF, DISP, PROC, abends, EBCDIC sort) are absent | New batch lessons cannot be built yet | Roadmap rule: build each extension only for an approved lesson |
| GAP-73 (PF3 on the first panel) | Minor navigation mismatch | New lessons start at the Primary Option Menu |

## 9. Recommendation

**M2 may begin** if you want it. It is small and optional: `requires` and `sources` fields on `Lesson`, plus a start-stack option for GAP-73.
**M3 may begin** in a gated order:

1. **Start now (no simulator prerequisite):** a-01-panel-fields-scroll, b-01-zos-big-picture, b-02-dataset-types. Read the source chapters first (marked "source pending").
2. **After a small simulator prerequisite each** (see the roadmap): b-03 (GAP-37, 38), b-04 (GAP-33), b-05 (GAP-36), b-06 (GAP-46 text), b-10 (GAP-42, 32, 10).
3. Every new lesson: spec first, outcome check, walk, negative tests, replay test, limitations text. The build fails without them.

M2 and M3 have **not** been started; they need your approval.
