# M3 report - foundational batch (Track B first set)

> **Superseded in part (2026-10-16):** the hardening that followed the owner's review is in [m3-verification-report.md](m3-verification-report.md) (display order, draft gate, check questions, evidence matrix, simulator fixes, browser runs, CI). Facts below are as of the first M3 report; test counts, lesson modules and the RCJOB/FIXRC fault have since changed.

**Date:** 2026-10-15. **Branch:** `feat/m3-foundations` (from `feat/m2-lesson-metadata`). **Status:** the eight lessons of the first set are implemented
as **drafts**; **nothing is pushed or published**. They must not be merged or shown to learners before independent review (authoring standards, section 9).

## 1. What was built

| # | Lesson id | Title | Commit | Review status |
|---|---|---|---|---|
| 29 | `a-01-panel-fields-scroll` | Panel fields and the Scroll amount | `938a1c7` | draft |
| 30 | `b-01-zos-big-picture` | The big picture: TSO/E, ISPF, JES and SDSF | `7f232a1` | draft |
| 31 | `b-02-dataset-types` | Sequential data sets, PDS and PDSE | `68cc06b` | draft |
| 32 | `b-03-jcl-anatomy` | Reading a job: JOB, EXEC, DD and continuation | `93d2db9` | draft |
| 33 | `b-04-build-a-job` | Build a job from scratch | `c70f850` | draft |
| 34 | `b-05-disp` | Disposition: what happens to a data set after the step | `bf86dd6` | draft |
| 35 | `b-06-multistep-rc` | Multi-step jobs: return codes and abends | `c006d48` | draft |
| 36 | `b-10-job-troubleshooting` | Batch troubleshooting: classify the failure, then fix it | `dd5ecd5` (+ `2bb6b72` lint) | draft |

Each lesson has a spec in `docs/curriculum/lessons/`, a Learn path, an outcome-based Challenge, a legitimate-route walk and per-lesson tests (accepted
alternatives and rejected shortcuts in `tests/tutorial/m3-lessons.test.ts`). They are numbered 29-36 after lesson 28 so no existing number or id changed, in a new module "Foundations".
`requires` is declared for each (advice only, ADR 0017). The generic gates (walk completes, nothing completes from the start, no stale completion, all-pairs
isolation, new lessons need a Challenge, the legitimate route scores 100) apply to all of them and pass.

## 2. Simulator changes made for them

| Change | Why | Evidence |
|---|---|---|
| `LessonStart.createMembers` (with `{HLQ}` in records) | lessons that need their own practice text or jobs; covered by the restart confirmation | `scenario.test.ts` |
| `EDITOR_SCROLLED` carries the amount (PAGE, HALF, MAX, number) | a-01 | `editorFlow.test.ts` |
| A new, empty member opens with five empty input lines marked `''''''`; unused ones are never saved (`savedRecords`) | b-04 needs a learner to type the first record; IBM's text says "several empty lines" with quotes (fidelity fix) | `editorFlow.test.ts`; EV-A section 4 |
| JESYSMSG `STMT NO.` matches the JESJCL listing number (GAP-37); a single trailing `/*` is accepted (GAP-38) | b-03 | `jes.test.ts`; EV-B 1.4 |
| Valid DD keywords STORCLAS, DATACLAS, MGMTCLAS, LABEL, FREE, DSNTYPE are accepted and ignored (GAP-33) | a valid job was flagged IEFC630I | `jes.test.ts` |
| `DISP=MOD` creates a missing data set and appends to an existing sequential one (GAP-36, in part) | b-05; EV-B 1.1 | `jes.test.ts` |
| ICE007A prints IBM's text `SYNTAX ERROR` | b-06 | `jes.test.ts`; EV-B ICE007A |

## 3. Verification

| Check | Result |
|---|---|
| `pnpm check` | exit 0, no warnings: **31 test files, 2,599 tests passed** (M2 end: 30 files, 1,803) |
| `pnpm build` | exit 0, compiled successfully |
| Failing first | each lesson's tests and each simulator change's tests were written and run red before the implementation; one lint warning (an unused constant) was committed with b-10 and removed in the next commit |
| Compatibility | the original 28 lesson ids, 137 step ids and the progress record are unchanged (`compat.test.tsx`); the tests now check "original 28 first, new lessons after" |
| Browser (Chrome, console clean) | **a-01**: Learn and Challenge end to end. **b-01**, **b-02**: Learn end to end (my own mistyped inputs were counted as mistakes, as designed; the instructed refusal in b-02 was not). **b-03**: BROKEN is created for the userid and JESYSMSG shows `1 IEFC621I EXPECTED CONTINUATION NOT RECEIVED`. **b-04**: the new member shows five `''''''` input lines, three steps passed from one Enter, `I` added a line. **b-05**: DISPNEW creates `FIRST RECORD` and JESYSMSG shows `IEF285I USER01.DISP.OUT CATALOGED`. **b-06, b-10**: unit tests only, no browser run. No Challenge-mode browser run for b-01 to b-06 or b-10 |

## 4. Decisions taken (change any of them and say so)

1. **Drafts, not published.** The standards allow publication only at `approved`; I cannot supply independent source review, a second person's fidelity run or an expert review. The lessons exist on the branch, labelled draft, and the public copy still says 28 lessons.
2. **Numbering appended** (29-36) rather than renumbering the course, to keep existing numbers, progress and links. Pedagogically they belong earlier (a-01 after lesson 3, b-01 first); `requires` and the module name are the only ordering signals today.
3. **b-01 is a guided trace, not a quiz.** The roadmap described a conceptual lesson with a matching exercise; the engine has no quiz step type. The Challenge checks the trace (TSO command, submit from ISPF, that job's output), not recall of definitions.
4. **b-10 uses fixed faults and no b-08.** The roadmap asked for rotating fault seeds and listed b-08 (abends) as a prerequisite. Fixed faults keep results deterministic; only S806 exists as an abend, and the lesson says so.
5. **Unverified behaviour is not asserted.** DFSORT's RC 16 is described with the ERET installation option; message layouts for IEFC630I and IEF450I are labelled simulated; PASS and UNCATLG are not used; the allocation-failure leak (a NEW data set from an earlier DD stays cataloged; probed) is documented and no lesson depends on it.
6. **Simulator corrections were made where a lesson would otherwise teach something false or be impossible** (section 2): new-member input lines, statement numbers, MOD.

## 5. Not done, and risks

| Item | Note |
|---|---|
| Independent review of all eight lessons | required before `approved`: source review (a second person), fidelity run in three modes, expert review |
| Remaining Track B lessons b-07 (COND/IF), b-08 (abends), b-09 (sort and utilities) | need M4 simulator work first (GAP-30, 31, 41, 45); not part of this first set |
| Allocation-failure rollback, PASS, UNCATLG (GAP-36 rest) | open, documented |
| IEFC605I invented variants, IEC130I layout, other inexact message layouts | open (M1b list) |
| CI | still never pushed or run; the workflow is unverified |
| Public copy and the lesson count | update README, site text and the social image to 36 when the drafts are approved |
| Browser coverage | Chrome only; gaps listed in section 3 |
| Quiz step type | would let b-01 and later conceptual lessons assess recall |

## 6. Decisions for you

1. Commission the independent review (or tell me whom to hand the specs to), and say which lessons to review first.
2. Confirm or change decisions 2-4 above (numbering, b-01 as a trace, b-10 without b-08).
3. Choose the next step: M4 simulator work for b-07 to b-09, a quiz step type, or Track C lessons.
4. Push a branch so CI runs once.
