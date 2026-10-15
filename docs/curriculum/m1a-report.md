# M1a report: assessment integrity and isolation

**Status:** implemented and **accepted** (see [m1a-acceptance.md](m1a-acceptance.md)); M1b and later milestones are **not started**.
**Date:** 2026-10-15. **Baseline:** commit `e97a91b`. **Nothing is committed**: all changes are in the working tree.
**Authorised by:** the M0 acceptance review (conditionally accepted) and your instruction to proceed with M1a only,
test first, with D3 treated as provisional.
**Verification:** `pnpm check` (typecheck, lint, tests) and `pnpm build` both pass; 20 test files, 1,603 tests passing,
5 `it.todo` (baseline: 15 files, 231 tests).

Related documents: [m0-acceptance-review.md](m0-acceptance-review.md) (what M1a was meant to fix),
[implementation-roadmap.md](implementation-roadmap.md) §3, [ADR 0016](../adr/0016-challenge-completion-guard.md)
(the design), `docs/00-project-log.md` Phase 20.

---

## 1. What problem M1a fixed

The M0 review reproduced four ways a lesson could be marked done without the learner doing it, or be impossible to redo:

| # | Problem (M0 review finding) | How it showed |
|---|---|---|
| 1 | Challenge mode completed on trivial actions or none (F-01) | 7 lessons completed with no action; 11 more with 2 to 3 cheap actions (18 of 28); 4 more depended on leftover data |
| 2 | Replay and mode switch kept the learner's leftovers (F-02, F-16) | Lesson 6 could not be redone (`DATA SET ALREADY EXISTS`); Learn then Challenge could finish instantly; edit profiles and an open editor leaked between lessons |
| 3 | Starting a lesson could complete the previous one (F-03, hypothesis in Phase 0) | Reproduced in a provider test: starting lesson 6 while lesson 2 ran in Challenge saved lesson 2 as **completed** |
| 4 | Several hints failed from a lesson's start screen (F-17) | "Option 2" and "PF3 to the Primary Option Menu" do nothing when a lesson starts on DSLIST with an empty panel stack |

## 2. Summary of changes

### Code (`src/`: 13 tracked files changed, +177/-62, plus 2 new files)

| Change | Files |
|---|---|
| **Race fix.** The runner ignores the events produced by `startLesson`'s own setup dispatches (a ref guard) | `src/state/TutorialProvider.tsx` |
| **Completion guard.** `startRunner(lesson, baseline)` records whether the Challenge check is already true; `RunnerState.armed` becomes true once it has been seen false; a lesson completes only when armed and the check then becomes true. Challenge validators also receive `history`, the events since the Challenge started (capped at 400) | `src/tutorial/engine.ts`, `types.ts` |
| **History helpers** for outcome checks: `is`, `sawAll`, `sawInOrder`, `sawAllThen`, `sawTimes` | `src/tutorial/validators.ts` |
| **Outcome checks** for 19 lessons (L2, 3, 5, 6, 7, 9, 10, 13, 15 to 25), written from each lesson's objective, with the Challenge `task` text the coach shows. Attached to the lessons in the index; a lesson's own `challenge` wins (L14, L28 unchanged) | `src/tutorial/challenges.ts` (new, 202 lines), `lessons/index.ts` |
| **Scenario reset.** One pure `startActions(state, startingState)` used for start, restart and mode switch. New optional start fields: `removeDatasets`, `removeMembers`, `createDatasets`, `resetProfiles`, `resetSettings`, `clearRetrieve` (existing `resetMembers`, `resetJobs`, `screen` unchanged) | `src/tutorial/scenario.ts` (new, 89 lines), `types.ts`, `TutorialProvider.tsx` |
| **Session reset.** New engine action `RESET_SESSION` closes split screens and any open editor (the old `GOTO` left a stale editor) and can empty the retrieve stack | `src/engine/types.ts`, `reducer.ts` |
| **Mode switch and restart** now re-apply the lesson's starting state and create a fresh armed runner | `TutorialProvider.tsx` |
| **Starting states** using the new fields: L3 resets the scroll setting; L6 removes `{HLQ}.TEST.JCL`; L12 removes `SCRATCH` and `DRAFT`; L13 creates `{HLQ}.TEST.JCL` empty; L17 empties the retrieve stack; L18 and L21 reset the COBOL profile; L19 and L20 reset the JCL profile; L23 and L25 restore `HELLO` | `lessons/module1.ts`, `module2.ts`, `module4.ts`, `module7-8.ts`, `module9-10.ts` |
| **Four hints** that failed from a DSLIST start now use `=2` or the list line commands (text only) | `lessons/module3.ts` |

### What did **not** change
Lesson ids, step ids, step text and validators of the Learn steps; the progress record shape and its storage key
(`ispf-lab:progress:v1`); any panel or simulator behaviour other than the session reset above; scoring.

### Tests (`tests/tutorial/`: 7 files added or extended)

| File | Cases | Purpose |
|---|---|---|
| `challenge.test.ts` | 1,317 | For all 28 lessons: the legitimate route completes in Learn and in Challenge; nothing completes from the start state; each of 15 probe shortcuts never completes any lesson; the lesson replays; it works after every other lesson (28 by 28 matrix) |
| `challenge-routes.test.ts` | 25 (+5 todo) | D3 validation: 13 alternative legitimate routes accepted, 12 plausible wrong answers rejected; the todos list M1b items |
| `guard.test.ts` | 9 | The completion guard and the event history, with synthetic lessons |
| `scenario.test.ts` | 13 | Scenario reset functions and `startActions` |
| `provider.test.tsx` | 8 | React Testing Library: the race, mode switch, restart, closing the previous session, progress untouched, L14 stale-result case |
| `walks.ts` (helper) | n/a | `Attempt`, one `WALKS` route per lesson, `SHORTCUTS` |

The 231 pre-existing tests are unchanged and still pass.

## 3. Test-first evidence

| Step | RED (before the change) | GREEN (after) |
|---|---|---|
| `startLesson` race | `provider.test.tsx`: "expected 'completed' not to be 'completed'". Starting lesson 6 saved lesson 2 as completed | Passes after the ref guard |
| Guard and history | `guard.test.ts`: 4 of 9 failed on the unmodified engine | 9 of 9 |
| Challenge suite | 64 of 1,317 cases failed: shortcuts completing L2, 3, 5, 7, 9, 10, 15 to 25; L6 replay; L13 route (no `TEST.JCL`) | After the guard, outcome checks and resets: 1,315 passed, then 2 left (L3 replay: the scroll setting was already `HALF`), fixed with `resetSettings` |
| Mode switch, restart, session close | Run against a pristine checkout of `e97a91b` in a temporary worktree: 5 of 7 provider tests failed (the 2 that passed are the compatibility checks) | All pass |

**Honest limits of the test-first claim:** the race, guard and Challenge suites were written and run red first. The
scenario unit tests were written before the module but I did not capture a separate red run (the module did not exist,
so they could only fail on import). The alternative-route and wrong-answer tests passed on their first run, except one
slip in my own script (a bare `2` on a DSLIST start screen, which is the bug M1a-8 fixes).

## 4. Acceptance criteria

| Criterion (from the M1a plan and your instruction) | Result | Evidence |
|---|---|---|
| The `startLesson` race is tested first and resolved either way | **Met**: it was real, then fixed | `provider.test.tsx` red on baseline, green now |
| No Challenge completes from the start state | **Met** for all 28 | `challenge.test.ts` "not completed by doing nothing" |
| None of the reproduced shortcuts completes a Challenge | **Met** for the 15 recorded | `challenge.test.ts` shortcut cases (28 lessons x 15) |
| Challenge assesses the objective, not a repeat of the Learn steps | **Met for 19 lessons** by outcome checks; 9 keep an existing check behind the guard | `src/tutorial/challenges.ts`; ADR 0016 |
| Legitimate alternative workflows are accepted | **Met** for the 13 tested routes | `challenge-routes.test.ts` |
| Every lesson can be replayed, and run after any other lesson | **Met** | replay and the 28 by 28 isolation matrix |
| Mode switching and restart are reliable | **Met** | provider tests; Learn to Challenge cannot finish on leftovers (L6, L14) |
| Probes converted to asserting tests | **Met for Challenge, replay, leftover and race findings**; the validator and SJ fidelity probes are left as `it.todo` for M1b so the defects are not locked in | `evidence/probes/README.md` mapping table |
| Lesson ids, step ids and saved progress compatible; deterministic; local-first | **Met** | no storage change; no clock or random input; a mode switch leaves progress untouched (tested) |
| `pnpm check` and `pnpm build` green | **Met** | exit code 0 for both, final run |
| M1b, new lessons, unrelated simulator features not started | **Met** | see §7 |

## 5. Behaviour changes you should know about

1. **Switching mode, restarting or starting a lesson now resets that lesson's environment**: seed members it uses are
   restored, leftovers it names are removed, split screens and any open editor are closed. A mode switch used to keep
   leftovers (and could finish a lesson instantly). There is **no confirmation prompt** before this reset.
2. **An open editor is closed when a lesson starts.** Unsaved text in it is discarded.
3. **Lesson 3 resets the scroll default to its default (PAGE)** when it starts, so the lesson's `SETTING_CHANGED` event
   can fire again on replay. Other settings are untouched.
4. **Lesson 13 creates an empty `{HLQ}.TEST.JCL`** at start (its step 1 already allowed allocating it); lesson 6 removes it.
5. **Challenge shows the lesson's `task` text** for the 19 lessons that now have an outcome check (the coach already
   displayed `challenge.task` when present).

## 6. Remaining limitations

- **Outcome checks trust the event stream.** They prove the learner performed the recorded actions, not that they
  understood them.
- **L13 "two ways"** is checked as "two copies into `TEST.JCL`", because the events do not distinguish the 3.3 route
  from the member-list route.
- **Nine lessons keep their existing end check:** L1, 4, 8, 11, 12, 26, 27 (last step plus the guard) and L14, L28 (their
  own state-based checks). No shortcut completed any of them in the 15-shortcut battery, but that does not prove none
  exists. Their known defects are M1b items: L27 completes with zero jobs submitted, L28 rejects a valid
  `PAYROLL.DATA` repair and never checks SYSUT2, L17 and L21 Learn-step false positives. They are recorded as
  `it.todo` in `challenge-routes.test.ts`.
- **The shortcut battery is finite** (15 sequences from the M0 probes). It catches the known shortcuts and regressions;
  it cannot enumerate every cheap path.
- **No manual browser walkthrough.** Everything was verified with jsdom and React Testing Library, plus a production
  build. A short browser pass (switch mode, restart, redo lesson 6) is recommended at review.
- **Documentation counts in other files remain stale** (README test count and similar): M1b housekeeping.
- **The M1b wording, message-ID and SUBMIT/SJ corrections are untouched** (ADR 0015 records the decision only).

## 7. Explicitly not done (still outside M1a)

Corrections of statements IBM contradicts; SUBMIT and SJ wording; the invented message ids (`IEFC606I`, `ICE026A`) and
`IEF374I`; validator fixes unrelated to Challenge completion; stale counts, resource links, CI; any new lesson;
COND/IF/DISP/PROC work; SDSF changes; accessibility; progress key or storage changes.

## 8. Decisions for you

| # | Decision | Recommendation |
|---|---|---|
| 1 | Confirm or amend ADR 0016 (Challenge = guard + outcome checks; status is *Provisional, validated*) | Confirm: it is validated by 1,300+ cases and has no storage or id impact |
| 2 | Should a mode switch (or restart) ask for confirmation before resetting the environment? | Yes if you want to protect experimentation work; it is a small UI change and can go in M1b |
| 3 | Should lesson start keep discarding an open editor's unsaved text? | Keep (it matches how a lesson restart already behaves); mention it in the coach if you prefer |
| 4 | Commit M1a now as one commit (or split: engine and tests, lesson content, docs)? | One commit on a branch, so M1b can build on it and be reviewed separately |
| 5 | Authorise M1b? | After the browser pass and your answers to 1 to 3 |

## 9. How to reproduce

```
pnpm install --frozen-lockfile
pnpm check        # typecheck + lint + 1,603 tests (5 todo)
pnpm build
git diff --stat   # 13 files in src/, plus docs and tests
```

To see the baseline behaviour: check out `e97a91b` in a separate worktree and run
`pnpm vitest run tests/tutorial/provider.test.tsx` with this branch's test file copied in; 5 of 7 tests fail there.

## 10. Acceptance addendum (2026-10-15)

After this report was written, the acceptance validation ([m1a-acceptance.md](m1a-acceptance.md)) added: a confirmation
before a lesson start, restart or mode switch **that would throw away unsaved or learner-made work** (and nothing for
harmless resets), including editor text typed but not yet sent with Enter; compatibility tests for lesson ids, step ids
and stored progress; a Learn-then-Challenge matrix for all 28 lessons; and real browser walkthroughs. The final counts
are **22 test files, 1,658 tests passing, 5 todo**; `pnpm check` and `pnpm build` pass. Decision 2 in section 8 is
therefore answered: a mode switch **does** now ask when something would be lost, and only then. The tracked M1b items are
in [m1b-backlog.md](m1b-backlog.md).
