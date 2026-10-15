# 0016 — Challenge completion needs a guard and an outcome check, not a repeat of the Learn steps

Date: 2026-10-15 · Status: **Accepted 2026-10-15** (decision D3 of the M0 acceptance review; validated by the M1a tests and the M1a
acceptance walkthroughs, then approved by the project owner)

## Context
Challenge mode ignores the steps and evaluates `lesson.challenge.validator`, or the **last step's** validator when a
lesson has none, after every dispatch (`src/tutorial/engine.ts`). Only L14 and L28 defined their own challenge. The M0
review reproduced 18 lessons completing with three or fewer unrelated actions from a fresh start (7 with none) and 4
more depending on leftover state. A first proposal, "complete when every Learn step has been seen", was set aside: it
makes Challenge a Learn run without prompts, does not assess the objective, and rejects legitimate routes that skip an
intermediate step.

## Decision
Two layers, both pure and deterministic:

1. **Completion guard (generic, `src/tutorial/engine.ts`).** `startRunner(lesson, baseline)` records whether the
   outcome check is already true on the start state. `RunnerState.armed` becomes true once the check has been seen
   false after the Challenge started; a lesson completes only when armed and the check then becomes true. A check that
   is true at the start, or only because of leftover data, cannot complete a lesson. Without a baseline the first feed
   can never complete.
2. **Outcome checks (per lesson, `src/tutorial/challenges.ts`).** Written from the lesson's `objective`, not from its
   steps. They read `ctx.history` (events since the Challenge started, capped at 400) and, where the objective is about
   a result, the catalog. Helpers: `is`, `sawAll`, `sawInOrder`, `sawAllThen`, `sawTimes`. They accept alternative
   routes (menu path, typed `3.4` or `=3.4`; Edit entry panel or member list; `PF4` or `RETURN`; `X` line command or
   `EXCLUDE`) and set the Challenge `task` text the coach shows.

Coverage after M1a: 19 lessons have an outcome check (L2, 3, 5, 6, 7, 9, 10, 13, 15-25); L14 and L28 keep their own;
L1, 4, 8, 11, 12, 26 and 27 keep the last-step fallback behind the guard (no shortcut completed them in the M0 probes
or in the M1a suite).

Starting, restarting or switching mode applies the lesson's starting state through one shared function
(`startActions`, `src/tutorial/scenario.ts`) and the runner ignores the events of those setup dispatches.

## Validation (tests/tutorial)
- `challenge.test.ts`: for all 28 lessons the legitimate route completes in Learn and in Challenge; nothing completes
  from the start state; 15 shortcuts (the Phase 0 / M0 probes) never complete any lesson; every lesson replays and runs
  after every other lesson.
- `challenge-routes.test.ts`: 13 alternative routes are accepted and 12 plausible wrong answers are rejected.
- `guard.test.ts`, `scenario.test.ts`, `provider.test.tsx`: the guard, the scenario reset, and the provider wiring.
  Before the change 64 of the suite's cases failed and 5 of the 7 provider tests failed on the baseline commit.

## Review at M1 closure (2026-10-15)
The decision stands. Two additions follow from using it on all 28 lessons: instructed errors are exempt from scoring in Learn mode
(`LessonStep.expectsError`), and the tests now require new lessons to define their own outcome check instead of falling back to
the last step. See `docs/curriculum/m1-closure-report.md`.

## Consequences
- No storage change; lesson ids, step ids and saved progress are unchanged.
- Outcome checks trust the event stream: they prove the learner performed the recorded actions, not that they
  understood them.
- Known limits: L13's "two ways" is checked as "two copies" (events do not distinguish the routes); L14, L28 and the
  fallback lessons keep their existing, state-based checks, whose remaining defects belong to M1b (the audit's L27/L28
  items are `it.todo` in `challenge-routes.test.ts`).
- Switching mode now restarts the lesson's environment, as a restart does. This is documented in docs/05. To keep this
  from destroying work, the provider asks first, and only when unsaved or learner-made work would be lost
  (`workAtRisk`, `confirmDiscard`; see `docs/curriculum/m1a-acceptance.md`).
