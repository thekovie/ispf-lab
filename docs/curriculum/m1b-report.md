# M1b report - content and fidelity corrections

**Date:** 2026-10-15. **Branch:** `feat/m1b-content-fidelity` (from `feat/m1a-assessment-integrity`). **Status:** implemented,
**awaiting your review**. M2 and later milestones are **not started**.
**Approvals used:** ADR 0016 accepted (the Challenge guard and outcome checks); M1b authorised.

## 1. What changed, by sub-item (one commit each)

| Sub-item | Commit subject | What |
|---|---|---|
| ADR 0016 | `docs: accept ADR 0016 (Challenge completion guard and outcome checks)` | Status Provisional to Accepted in the ADR, index, roadmap and log |
| M1b-3 | `fix: assess what the lessons say they assess (M1b-3)` | The five deferred tests (T1-T5) and A1, A2, A6, A7; Learn steps of L5, L6, L9, L11; 31 tests in `m1b-validators.test.ts` |
| M1b-2 | `docs: correct the Edit SUBMIT and SDSF SJ wording per ADR 0015 (M1b-2)` | Glossary, L27, SDSF help, docs/10, ADR 0012; IEF212I wording in L27/L28 |
| M1b-4 | `fix: correct the message ids and ISPF statistics the lessons display (M1b-4)` | `IEF374I`, `IEFC606I`, `ICE026A`; DSLIST `S` vs `I`; `SORT LRECL` default; modification level; `STATS OFF` |
| M1b-1 | `docs: stop teaching statements IBM contradicts or does not support (M1b-1)` | Lessons 1-3, 7-8, 15-16, 18-20, 25 and the glossary; 18 retired statements guarded by a test |
| M1b-5 | `chore: refresh counts and IBM links, add CI, report M1b (M1b-5)` | Stale counts, resource links, resource sync test, optional CI, this report |

The commit hashes are in `git log feat/m1b-content-fidelity`.

## 2. Decisions taken (change any of them and say so)

1. **L28 Challenge assesses the SYSUT2 report** (backlog A6). The objective names it, so the Challenge now requires opening SYSUT2 of
   the run that ended CC 0000. The alternative, rewording to "outcome only", would have dropped part of the objective.
2. **Any repair that makes PAYRPT run is accepted** in the L27/L28 Challenges (edit the JCL, or create `{HLQ}.PAYROLL.DATA`). The Learn path
   still teaches the JCL edit. L27 also requires the JESYSMSG diagnosis; L28 does not ("by whatever route you choose").
3. **A Browse of job output counts as an open editor session in the simulator**, so the L27/L28 checks require "no Edit session open", not
   `editorClosed` (the browser walkthrough would otherwise never complete).
4. **Where IBM is silent the text says less** (unsaved edits in Edit SUBMIT; SJ write-back; PF3 count; defaults of CAPS, RECOVERY, AUTOSAVE).
5. **Behaviour left as is and disclosed in the text**: L2 keeps Utility Selection on the PF3 stack; L7 Browse prints line numbers; L15 each
   logical screen fills the display; L18 accepts BNDS on the command line; L19 PROFILE shows two lines; `G` resets without a panel.
6. **A8 accepted as designed**: L28's Learn steps 1-2 also accept a run that already succeeded, because the lesson says "by whatever route".
7. **CI added** (`.github/workflows/ci.yml`: `pnpm check` and `pnpm build`). It cannot be run locally; the first real run is on your next push.
   Remove the file if you do not want it.

## 3. Behaviour changes a learner or maintainer will notice

- L28 and L27 Challenge: different completion conditions (above); a stale or lucky run no longer completes them.
- L17 step 5 now needs the `3.4` re-run, and its text no longer says "PF3 twice".
- L6 step 3 no longer advances for a wrongly allocated data set (the hint says how to delete and retry); step 4 needs the data set listed.
- Job logs: `IEF374I` has the IBM layout (CPU/SRB/VIRT) and no `RC=`; misplaced statements are `IEFC019I`; a missing SORT DD is `ICE056A`.
- DSLIST `S` shows the same panel as `I` minus the PDS directory blocks and member count; `SORT LRECL` alone sorts descending.
- The member modification level goes up once per edit session (max 99); saving with STATS OFF removes a member's statistics, and the
  Member Information panel says so. The "Modified lines" row (it printed the modification level) is removed.
- New event `JOB_JCL_OPENED` (SJ/SE), and `EDITOR_LINES_EXCLUDED` carries `flip`. Both are additive; no stored data changed.
- Lesson ids, step ids and the progress record are unchanged (`compat.test.tsx` still passes).

## 4. Verification

| Check | Result |
|---|---|
| `pnpm check` | exit 0: **26 test files, 1,729 tests passed, 0 todo** (M1a end: 22 files, 1,658 + 5 todo) |
| `pnpm build` | exit 0, compiled successfully |
| Each defect fix has a test that failed before | Yes for M1b-3 (11 cases, then the L5/L6/L11 ones), M1b-2 (7), M1b-4 (4 jes, 3 listDepth, 4 memberStats), M1b-1 (11). The L9 negative test was re-checked red by reverting the line |
| Browser (Chrome, dev server, native dialogs, console clean) | **L28 Challenge by the create-the-data-set route**: not complete until SYSUT2 was opened, then `completed`, score 100, 0 mistakes ([screenshot](evidence/m1b-browser/b1-l28-challenge-alternative-route.webp)). **DSLIST `S`/`I` on `USER01.JCL`**: `S` has the allocation figures but no directory blocks or member count; `I` has both |
| Links in `docs/curriculum/*.md` | 0 broken |

**Not browser-tested:** the rewritten lesson texts (read in the unit tests only), the L5/L6/L9/L11/L17/L21/L27 step changes in a browser
(covered by Attempt-based tests that drive the same reducer), the modification-level and STATS OFF behaviour in the UI, and the CI workflow.

## 5. Remaining issues and what is still unverified

| Item | Note |
|---|---|
| Invented `IEFC605I` variants ("JOB STATEMENT NAME FIELD MISSING", "EXEC STATEMENT WITHOUT PGM OR PROC") | Real missing-jobname message is `IEFC635I`; left out of M1b scope (not shown by a lesson) |
| Other inexact layouts (`IEF376I`, `IEF237I` DUMMY and device, `ICE000I` product number, JESMSGLG time prefix) | Documented in EV-B; not shown by lessons |
| `G` opens a Reset panel in real ISPF; member-info labels | Disclosed in the lesson step; no panel built |
| Scoring counts the scripted error of L1 step 4 and the Browse `SAVE` of L7 as mistakes | Needs a scoring rule change; not done |
| A9 "uncataloged" premise for `PAYROLL.DATA` | The simulator has no uncataloged state; wording not yet changed |
| IBM-silent behaviours (unsaved edits in Edit SUBMIT, SJ write-back, JCL-error jobs on SDSF O/H, PF3 count after typed 3.4, IEBGENER SYSPRINT) | Need a z/OS expert or a live system |
| Audit findings for lessons 4, 10, 12, 13, 14, 24, 26 | They were not in the M1b list (M0 review section F) and remain open in `existing-lessons-audit.md` |

## 6. Decisions for you

1. Review the seven decisions in section 2 (especially 1 and 2, which change what L27/L28 Challenge accept).
2. Keep or remove the CI workflow.
3. Authorise the next step: M2 (lesson metadata, optional) or the first new lessons (M3). Neither has been started.
