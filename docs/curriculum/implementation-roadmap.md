# Implementation roadmap (Phase 0, Deliverable 6)

Part of the [Phase 0 audit](phase-0-audit.md). Baseline commit `e97a91b`; 2026-10-14.

This plan covers the work **after** Phase 0. **Revised on 2026-10-15 after the independent [M0 acceptance review](m0-acceptance-review.md)** (verdict: conditionally accepted; conditions C1-C6 closed). The user approved decisions D1 and D2, treated D3 as provisional, and authorised **M1a only**. M1b and later milestones need a further review before they start. Milestones are ordered by educational value, dependency and complexity. Gap IDs refer to the [simulator gap matrix](simulator-gap-matrix.md); lesson IDs to the [curriculum roadmap](curriculum-roadmap.md); SRC and EV references to [verified-sources.md](verified-sources.md).

Guiding constraints from the brief: lightweight, local-first, deterministic, no accounts, no cloud sync, no AI tutor, no full emulation, no expansion "just to imitate more IBM panels". Where a cheaper option exists (reword a lesson instead of changing the simulator), the cheaper option is recommended.

Complexity: S ≈ under a day, M ≈ a few days, L ≈ one to two weeks (single maintainer, indicative only).

## 1. Milestone overview

| Milestone | Theme | Status | Exit condition |
|---|---|---|---|
| M0 | Review gate | **Closed** (conditionally accepted 2026-10-15) | Conditions C1-C6 applied; D1 and D2 approved; D3 accepted 2026-10-15 (ADR 0016) |
| **M1a** | Assessment integrity and isolation | **Implemented 2026-10-15; awaiting review** | Challenge cannot complete without the learner doing the work; every lesson replays and survives a mode switch; the `startLesson` race is resolved either way; probes are asserting tests |
| M1b | Content and fidelity corrections | **Implemented, awaiting review** ([m1b-report.md](m1b-report.md)) | IBM-contradicted statements corrected with evidence; confirmed validator defects fixed; listed message IDs corrected |
| M2 (reduced) | Optional `requires` / `sources` lesson fields | Not authorised | Only if M3 is approved |
| M3 | First Track B batch | Not authorised | b-01 to b-06, b-10 and a-01 approved |
| M4 | Simulator extensions for approved lessons | Backlog | Only as an approved lesson needs them |
| M5 | Learning-experience improvements | Backlog | Individual items, not the whole list |
| M6 | Operations and automation curriculum | Backlog | |
| M7 | Specialised curriculum | Backlog | |

Smallest-sequence principle (from the M0 review): fix confirmed assessment and teaching defects before any new lesson or simulator capability.

## 2. M0 — Review gate (closed)

Outcome recorded in [m0-acceptance-review.md](m0-acceptance-review.md). Decisions:

| # | Decision | Status |
|---|---|---|
| D1 | Progress scope: keep one record per browser and document it | **Approved** ([ADR 0014](../adr/0014-progress-scope-single-learner.md)) |
| D2 | `SJ`/`SE`/`X`: disclose now, redesign in M4; Edit `SUBMIT` matches IBM and is not a deviation | **Approved** ([ADR 0015](../adr/0015-submit-and-sj-simulation-disclosure.md)) |
| D3 | Challenge completion: generic guard plus outcome-based validators, not "repeat every Learn step" | **Accepted 2026-10-15** after validation by the M1a tests and walkthroughs ([ADR 0016](../adr/0016-challenge-completion-guard.md)) |
| D4-D11 | Defaults in the M0 review section G | Apply in M1b where relevant |

Still unresolved and deliberately not "fixed": whether Edit `SUBMIT` includes unsaved edits, whether `SJ` leaves the PDS member untouched, O/H visibility of JCL-error jobs, the PF3 count after a typed `3.4`, IEBGENER SYSPRINT text.

## 3. M1a — Assessment integrity and isolation (implemented, awaiting review)

**As built (2026-10-15).** M1a-1 the `startLesson` race test was RED on the baseline and is fixed with a ref guard in
`TutorialProvider`; M1a-2 the completion guard (`RunnerState.armed`, `startRunner(lesson, baseline)`); M1a-3 outcome
checks for 19 lessons in `src/tutorial/challenges.ts` (the generic "all steps seen" rule was **not** adopted, per D3);
M1a-4 mode switch and restart re-apply the starting state; M1a-5 the scenario reset (`removeDatasets`, `removeMembers`,
`createDatasets`, `resetProfiles`, `resetSettings`, `clearRetrieve`, plus `RESET_SESSION` for split screens and the open
editor); M1a-6/7 the probes are asserting tests and all 28 lessons have a route script; M1a-8 four hints fixed. Evidence
and limits: [m1a-report.md](m1a-report.md), ADR 0016, `docs/00-project-log.md` Phase 20.

The plan as authorised:

Principle: fix confirmed defects with the smallest changes; no new lessons; no unrelated simulator features; lesson ids, step ids, saved progress and determinism unchanged.

| ID | Work | Affected modules | Acceptance criteria | Tests |
|---|---|---|---|---|
| M1a-1 | **Test-first: `startLesson` race.** Write a provider-level test (React Testing Library, jsdom) that starts a lesson while a previous lesson is running in Challenge mode and whose start state satisfies the previous lesson's validator. Record whether it fails. Fix only if it fails: ignore runner events produced by `startLesson`'s own dispatches | `src/state/TutorialProvider.tsx` | Starting or switching a lesson never completes a lesson the learner did not do; progress records change only on genuine completion | `tests/tutorial/provider.test.tsx` |
| M1a-2 | **Challenge completion guard** (ADR 0016). `RunnerState.armed`: the outcome check must be observed false after the Challenge starts and then true. Start-state-true and leftover-state-true can no longer complete a lesson | `src/tutorial/engine.ts`, `types.ts` | The seven zero-action lessons do not complete from the start state; no lesson completes on leftover state | Guard unit tests; start-state test over all 28 lessons |
| M1a-3 | **Outcome-based Challenge validators** for the lessons whose shortcut was reproduced (L2, 3, 5, 7, 9, 10, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25), written from each lesson's objective. Each is accepted only with a shortcut test (fails), an alternative-route test (passes) and the coached route in Challenge mode (passes) | lesson files, `validators.ts` | The reproduced shortcut battery completes none of them; legitimate alternatives and the Learn route complete them; L14 and L28 unchanged | `tests/tutorial/challenge.test.ts` |
| M1a-4 | **Mode switch and restart.** `setMode` and `restartLesson` re-apply the lesson's starting state and create a fresh runner | `TutorialProvider.tsx` | Learn → Challenge no longer finishes on the first action; restart works from any state | Provider tests |
| M1a-5 | **Scenario reset schema** (additive, optional): `resetDatasets`, `resetProfiles`, `clearRetrieve`, `clearScreens`. Applied to L6, L8, L9, L12, L13, L18, L19, L20, L23, L25 | `types.ts`, `TutorialProvider.tsx`, lesson files | Every lesson runs twice and after any other lesson without a dead end | Replay test over all 28 lessons |
| M1a-6 | **Probes become asserting tests** with finding ids in comments; originals stay under `evidence/probes/` | `tests/tutorial/*` | Each test fails against the baseline behaviour it documents | n/a |
| M1a-7 | **Walkthroughs for the nine lessons without one** (L1, 3, 4, 5, 7, 10, 11, 12, 13), needed to validate M1a-3 | `tests/tutorial/lessons.test.ts` | Each completes in Learn and in Challenge | n/a |
| M1a-8 | **Empty-stack hint fixes** (text only) for L8-L10 | lesson files | Hints work from the start state | Walk tests |

M1a exit criteria: `pnpm check` green; all acceptance criteria above evidenced in the M1a report; ADR 0016 updated from *Provisional* to the validated result; project log and changelog updated. **Stop for review before M1b.**

Explicitly out of M1a: every M1b item (wording, message IDs, validator fixes unrelated to Challenge completion), new lessons, progress key changes, COND/IF/DISP/PROC work, SDSF changes, accessibility, mobile, CI, resource links.

## 4. M1b — Content and fidelity corrections (implemented 2026-10-15, awaiting review: [m1b-report.md](m1b-report.md))

Scope as in the M0 review section F (M1b-1 to M1b-5): contradicted lesson statements; SUBMIT and SJ wording per ADR 0015; `IEF374I` and the two non-existent message IDs; L22 `S`/`I` and SORT default; L23 STATS/modification level; L27/L28 validators and the IEF212I wording; stale counts; resource links; optional CI. Tracked item by item in [m1b-backlog.md](m1b-backlog.md) (the five deferred tests, the L27/L28 defects, and the M0 list). Needs your approval to start.

## 5. M2 — reduced (not yet authorised)

Only `requires` and `sources` (both optional) on the `Lesson` type, if and when M3 is approved. Dropped from the earlier plan: `difficulty`, `estimatedMinutes`, `reviewStatus`, a code-side source registry, a fidelity-fixture helper, per-userid progress (ADR 0014). CI and link fixes moved to M1b.

## 6. M3 — Foundational batch (Track B first set) — Phase 1 curriculum

Order and dependencies (each lesson at `approved`, spec first): a-01 → b-01 → b-02 → b-03 → b-04 → b-05 → b-06 → b-10.

| Lesson | Simulator prerequisites (gap rows) | Notes |
|---|---|---|
| a-01-panel-fields-scroll | none | Replaces the false L3 claim |
| b-01-zos-big-picture | none | Static lesson; read SRC-001 ch.1-3 and the chapter text first (source pending) |
| b-02-dataset-types | optional DSNTYPE flag (GAP-11) | Can ship without PDSE if disclosed |
| b-03-jcl-anatomy | GAP-37, GAP-38 | Small parser fixes |
| b-04-build-a-job | GAP-33 | Accept valid DD keywords |
| b-05-disp | GAP-36 | MOD, PASS/UNCATLG, rollback on allocation failure |
| b-06-multistep-rc | GAP-46 (verify IEBGENER text) | Needs the EV-B open item resolved or the text flagged SIMULATED |
| b-10-job-troubleshooting | GAP-42, GAP-32 (proc timing), GAP-10 | Rotating fault seeds; real message IDs only |

Each lesson ships with: spec, sources, guided steps, challenge with baseline, replay test, negative tests, limitations text, `docs/05` row.

## 7. M4 — Simulator extensions (only as approved lessons require) — Phase 2

| Order | Extension | Gap | Needed by | Complexity |
|---|---|---|---|---|
| 1 | COND evaluation and EVEN/ONLY | GAP-30 | b-07 | M |
| 2 | IF/THEN/ELSE/ENDIF | GAP-31 | b-07 | M |
| 3 | Scripted abends S0C7 and SB37 from fixed seed programs | GAP-41 | b-08 | M |
| 4 | EBCDIC collation and ZD/PD/BI keys in SORT | GAP-45 | b-09 | M |
| 5 | TSO name qualification and message fidelity | GAP-20, GAP-23, GAP-24 | c-01 | S-M |
| 6 | SDSF PREFIX/OWNER exact-match rule, column titles | GAP-51, GAP-53 | c-03 | S |
| 7 | `IEBCOPY`, then PROC/PEND/JCLLIB | GAP-40, GAP-32 | b-11 | L |
| 8 | Job states and C/A/H actions | GAP-44, GAP-54 | c-04 | L |
| 9 | Cataloged flag, catalog/uncatalog options in 3.2 | GAP-10 | c-06 | M |

Rule: no extension is built until a lesson at `source-reviewed` needs it. Every extension updates `docs/03`/`docs/04`/`docs/10` and adds fixture tests citing the EV rows.

## 8. M5 — Learning-experience improvements (Phase 3)

See section 10 for the full recommendation table. In this milestone: prerequisites display and gentle gating; a per-track progress view; "References" panel per lesson from the registry; accessibility fixes (GAP-68); read-only lesson and glossary access without the terminal for small screens (GAP-69); scenario replay button.

## 9. M6-M7 — Later curriculum

- **M6 (Phase 4):** c-01, c-05, c-03, c-02, then c-04, c-06, c-07, c-08; d-01 to d-04 as reading exercises once SRC-006/029 chapters are read.
- **M7 (Phase 5):** e-04 first (verified topic), then e-01, e-02, e-03, e-05, e-06 and Track F only if demand justifies and sources are verified.

## 10. Platform recommendations (Workstream E)

> **Revised by the M0 review.** Priorities changed: progress identity P2 and resolved by ADR 0014 (no change); CI P1 but moved to M1b; accessibility labels P2; reset consistency P2; cross-tab handling P3. **Rejected:** a competency framework; a code-side source registry that fails CI on broken ids; a fidelity-fixture helper abstraction. **Deferred:** mobile read-only theory access, per-track UI, discoverability metadata, anything that needs M2 fields. The table below is retained as the audit's original analysis.

"Exists" and "Gap" are separated. Priority and complexity as defined above.

| Area | Exists today | Evidence of the gap | Proposed enhancement | Learner benefit | Priority / justification | Dependencies | Cx | Affected files | Acceptance criteria | Tests |
|---|---|---|---|---|---|---|---|---|---|---|
| Course tracks | Ten modules in a flat `<select>` (`TopBar`, `LearningPanel.tsx:49-58`) | No track concept; JES lessons sit in "Batch jobs" | Add `track` and module grouping from metadata; show tracks on the lesson picker | Clear path through A, B, C | P1: needed once Track B exists | 2.1 | M | `tutorial/types.ts`, lesson picker component | Lessons grouped by track; unknown track fails a test | Metadata test |
| Prerequisites | None; L13's step 1 says "make sure TEST.JCL exists (lesson 6 created it)" | No `requires` field (`types.ts:40-53`) | `requires`, enforced as a soft warning ("Complete X first") and used to build starting state | Avoids dead ends | P0 (assessment integrity) | 2.1, 1.5 | M | `types.ts`, `TutorialProvider.tsx` | L13 starts self-sufficiently or warns | Replay and prerequisite tests |
| Lesson metadata | `id number module title description objective teaches` | No difficulty, time, sources, review status | Add fields in 2.1 | Learners can choose; maintainers can audit | P0 | none | M | `types.ts`, lessons | All 28 lessons carry metadata | Schema test |
| Progress tracking | Per-lesson status, attempts, hints, mistakes, bestScore (`progressStore.ts`), global | Global key (`keys.ts:6`); one `bestScore` for all modes | Decide identity (ADR), per-mode scores | Correct history after a userid change | P1 | M0 decision | S-M | `persistence/*`, `ProgressView.tsx` | Switching userid shows that user's progress | Store tests |
| Competency assessment | Score only; no mapping of lessons to competencies | No competency data | Map objectives to a small competency list; show per-track completion (no new infrastructure) | Shows what the learner can actually do | P2 | 2.1 | M | `content/`, `ProgressView.tsx` | Competency view derived from completed challenges | Derivation test |
| Challenge scoring | `100 − 10·mistakes − 15·hints`, any error counts (`engine.ts:9,38`) | L1 step 4 asks for an error that is then penalised | Ignore instructed errors; separate Learn/Challenge scores | Fair scoring | P2 | 2.6 | S | `engine.ts` | L1 completes at 100 without hints | Score test |
| Context-sensitive explanations | `ExplainDrawer` with 59 glossary entries, `EXPLAIN` command, per-step "Why?" | Duplicate `JCL` key shadows `job` (`explain.ts:258,369`); entries unsourced | Fix duplicates; add `sources` to glossary entries | Trustworthy definitions | P1 | 2.2 | S-M | `explain.ts` | Every entry resolves to a source ID | Glossary test |
| Reference access | `/resources` page (8 links, `content/resources.ts`) | Links stale (verified-sources §5); no per-lesson references | Per-lesson "References" from the registry; fix links | One click to the exact IBM book | P1 | 2.2, 2.4 | S-M | `resources.ts`, coach panel | Each lesson lists SRC links with release and page | Registry test |
| Discoverability | Lesson select + "No lesson selected" list | No search, no difficulty/time, no "next recommended" | Show difficulty/time and next lesson from metadata | Easier to choose | P2 | 2.1 | S | lesson picker | Next lesson shown on completion | Component test |
| Scenario reset / replay | Top-bar Reset env; per-lesson `restartLesson`; Progress-page reset omits JES | L6 dead end; inconsistent resets (GAP-62, GAP-64) | `startingState.reset`, shared reset function, replay re-applies state | Can repeat any lesson | P0 | 1.5 | M | `TutorialProvider.tsx`, `store.ts` | Every lesson replays from any state | Replay test per lesson |
| Import / export | Lab bundle v2: catalog, profiles, progress, settings, jobs; 5 MB cap; v1 migration (`labBundle.ts`) | Import overwrites global progress; numeric Scroll lost | Fix numeric scroll; confirm scope | Safe backup/restore | P2 | 2.5 | S | `labBundle.ts` | Round-trip preserves Scroll=numeric | Bundle test |
| Accessibility | Keyboard-first, ARIA on terminal and toolbar, `prefers-reduced-motion`, dark theme | Field `aria-label` is the internal id; dialog non-modal; no skip link | Purposeful labels, focus trap and restore, skip link, severity not by colour alone | Usable with a screen reader | P1 | none | M | `FieldInput.tsx`, `ExplainDrawer`, layout | Keyboard-only run of L1 passes; axe check clean | Component and axe tests |
| Mobile theory access | Landing, resources and progress are not gated; terminal is desktop-only (`DesktopGate.tsx`) | Lesson text cannot be read on a phone | Read-only lesson/glossary view without the terminal | Study anywhere | P2 | 2.1 | M | `app/`, `components/` | Lesson text renders at 360 px | Responsive snapshot |
| Automated testing | 231 Vitest tests; coached walks for most lessons; no CI; no replay/negative tests; no fidelity fixtures | Gap matrix GAP-70 | CI, coverage threshold, fixture helper, replay and baseline tests | Regressions caught; claims traceable | P0 (tests) / P1 (CI) | 2.3, 2.7 | S-M | `tests/`, workflow | CI green on PR; each message assertion cites an EV row | n/a |
| Source maintainability | Sources only in `docs/08` and glossary `readMore` | Stale links; no registry in code | Registry in code (2.2) plus the evidence appendices in `docs/curriculum/evidence/` | Auditable curriculum | P0 | 2.2 | M | `content/` | Broken source ID fails CI | Registry test |
| Contributor experience | `CONTRIBUTING.md` (lesson, panel, glossary), issue templates, ADRs | No PR template; no authoring standards; ADR index order slip | Link the authoring standards; add PR template with the review checklist; fix ADR index | Faster, safer contributions | P1 | none | S | `CONTRIBUTING.md`, `.github/` | PR template present | n/a |

Explicitly **not recommended**: accounts, cloud sync, AI tutor, a full z/OS emulator, real TN3270, or more ISPF panels for their own sake. None has a demonstrated need in the audit.

## 11. Test and documentation plan (all milestones)

- Every behaviour change: update `docs/03-ispf-behaviour-reference.md` / `docs/04-editor-commands.md` / `docs/10-jes-sdsf.md`, add a test, append to `docs/00-project-log.md`, add a `CHANGELOG.md` line, add an ADR for any non-obvious decision (the project's own rule).
- Fidelity assertions cite an `EV-A/B/C` row.
- Per lesson: coached walk, negative cases, replay, Challenge baseline.
- Run `pnpm check` before every commit; keep Phase 0 evidence under `docs/curriculum/evidence/`.

## 12. Risks

- Several decisions rest on documentation that is silent (unsaved-changes wording, O vs H visibility). Treat them as open until reviewed.
- The z/OS 3.2 HTML topic URLs could not be harvested; keep PDF page citations current when IBM re-issues a book.
- Simulator extensions can balloon. The rule "no extension without an approved lesson that needs it" is the main guard.
