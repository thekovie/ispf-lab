# M0 acceptance review of the Phase 0 audit

**Reviewed:** the seven Phase 0 documents in `docs/curriculum/`, the `evidence/EV-*` files, and the `evidence/probes/` scripts, against the repository at commit `e97a91b842cc1c525c9694adf3533695bf57f82c` and the original z/OS 3.2 IBM PDFs.
**Review date:** 2026-10-15. **Product code, tests and configuration were not modified.** M1 has not been started.

## 0. How this review was done (and what it did not do)

The audit package was treated as untrusted input. Independent checks were made at four levels:

| Level | What was re-done | Notes |
|---|---|---|
| IBM primary text | I re-extracted text from the **original PDFs** with my own script (not the audit's extracts) for Edit and Edit Macros, ISPF User's Guide Vol I and II, SDSF User's Guide, MVS JCL Reference, MVS System Messages Vol 8, JES2 Messages, DFSORT Messages, and grepped the quoted sentences | A few checks used the audit's own extracts for volumes I had not re-extracted (IEB351I in Vol 7; IEFC606I across Vols 1-9). The extraction tool is the same as the audit's (`pypdf`), so extraction errors are not independent; interpretation errors are |
| Repository code | Read `src/tutorial/engine.ts`, `src/state/TutorialProvider.tsx`, `src/state/store.ts`, `tests/engine/harness.ts`, `src/tutorial/lessons/module2.ts` and `module5.ts`, `src/engine/screens/sdsf.ts` (SJ/SE/X), `explain.ts` (SUBMIT sentence), `src/persistence/keys.ts`, and the cited test lines | |
| Runtime behaviour | Wrote and ran **my own** Vitest probes outside the repo (listed in section 9), and executed the audit's ten probe scripts | Probe scripts were run, not assumed to have run |
| Documents | Checked headline numbers and priorities in the audit package for consistency with the above | |

**Not done:** no live z/OS system was available; the React provider path (`startLesson` event race) cannot be exercised by the reducer harness, so it was assessed by code reading only; I did not re-derive every per-lesson detail (about 1,700 lines) and the per-lesson findings I did not touch are neither confirmed nor refuted here; IBM Docs HTML deep links were not re-fetched.

---

## A. Acceptance verdict

# CONDITIONALLY ACCEPTED

The audit is **reliable on its core conclusions** and **implementation-ready for a reduced M1**. Every high-impact claim I re-checked that concerns IBM behaviour was confirmed by the primary text. The central engine defects are real. But several headline numbers and priorities are overstated, the preserved probe scripts are print-only, one critical hypothesis is untested, and the roadmap contains work that is not justified by confirmed problems.

Implementation may proceed **only after** these conditions (each is small):

| # | Condition | Why |
|---|---|---|
| C1 | Correct the headline Challenge figure ("at least 25 of 28") in `phase-0-audit.md` (sections 3 and 4), `existing-lessons-audit.md` (sections 2 and 3) and `simulator-gap-matrix.md` (GAP-60) to the calibrated figures in section B (F-01) | Independently reproduced: **18** lessons complete in 3 or fewer cheap actions from a fresh start (7 with no action); 4 more depend on leftover state; 6 are not shortcut-completable by anything I tried. "At least 25" is not supported |
| C2 | Adopt the priority changes in section B and the M1 scope in section F, replacing M1 in `implementation-roadmap.md` | Several P0 labels are too high; the proposed M1 is both too wide (new-lesson infrastructure) and in one place the wrong fix (per-lesson challenges everywhere) |
| C3 | Treat the audit's probe scripts as exploratory evidence only. M1 must convert them into asserting tests (section F) | None of the ten files contains an `expect()`; they pass regardless of behaviour |
| C4 | Add the `startLesson` event race (F-03) to the audit as an **unverified hypothesis with a test-first requirement** | It is plausible from code, potentially affects progress records, and is not covered anywhere |
| C5 | Decide D1-D3 (section G) before M1a starts; the recommended defaults are acceptable | They determine the shape of the runner change |
| C6 | Withdraw or soften two over-stated findings: L14 `finalCheck` (disclosed design) and L16 "contradicts IBM" (nuance, P2) | See F-18 and F-12 |

**Status of the conditions (updated 2026-10-15, after user acceptance).** C1 (corrected figures) and C6 (L14, L16 softened) are applied in `phase-0-audit.md`, `existing-lessons-audit.md` and `simulator-gap-matrix.md`. C2 (priorities and M1 scope) is applied in `implementation-roadmap.md` and the gap matrix section 3. C3 is recorded in `evidence/probes/README.md`; the asserting tests are an M1a deliverable. C4 is recorded as an unverified hypothesis in `phase-0-audit.md` section 11 and is the first M1a task. C5 is closed: D1 approved (ADR 0014), D2 approved (ADR 0015), D3 provisional (ADR 0016) with the generic rule replaced by a guard plus outcome-based validators. M1a only is authorised.

I recommend the user formally accept M0 on these terms and authorise **M1a then M1b** as defined in section F. Phase 1 lesson authoring, M3 and later milestones stay closed.

---

## B. Findings validation matrix

Verdict key: **CONFIRMED** (I verified against primary text or ran code); **CONFIRMED (code-read)** (verified by reading code, not executed); **PARTIAL**; **OVERSTATED**; **UNVERIFIED**. Priorities are my revised P0-P3. "Orig" is the audit's.

| ID | Finding / GAP | Original claim | Evidence I reviewed | Verdict | Orig → Rev | Justification | Required action |
|---|---|---|---|---|---|---|---|
| F-01 | Challenge mode completes on trivial actions (GAP-60, GAP-61) | "At least 25 of 28 lessons" complete on a trivial first action or stale state | `engine.ts:41-45`; `store.ts:dispatch` (every dispatch notifies listeners, even with no events); my probes `m0-challenge`, `m0-single`, `m0-seq`; audit probes b, c, l, n | **CONFIRMED, figure OVERSTATED.** Independently reproduced: **7 complete with no learner action** (L2, 3, 13, 15, 18, 21, 24, validator already true on the start state); **L17** (`3.4`) and **L25** (`=S`) in one action; **L7, L23** (open a member list), **L16** (`=3.4`, RETURN or PF4), **L5, L22** (`3.4`, level, `RESET`), **L9** (open HELLO, `SAVE` unchanged), **L10, L20** (open HELLO, `CANCEL`), **L19** (`CAPS OFF`, PF3; audit probe c). Total **18**. **L6, L8, L14, L28** depend on leftover state (code-read; L28 and L8/L14 not re-run by me). **Not shortcut-completable in my tests:** L1, L4, L11, L12, L26, L27 (L27 needs the real fix but no resubmit) | P0 → **P0** | The defect is real and is the most important finding. The magnitude is 18 + 4, not 25+ | Fix in M1a (section F, M1a-1). Correct the figure (C1) |
| F-02 | Challenge persists across `setMode`; replay dead ends (GAP-62, GAP-72) | `setMode` does not reset data; L6 replay cannot proceed; profiles and members leak | `TutorialProvider.tsx:104-111,148-155`; my probe `m0-l6`: second allocation of `USER01.TEST.JCL` returns `DATA SET ALREADY EXISTS` and never reaches `ALLOCATE_DATASET`, which step 2 requires; audit probe d (BOUNDS persisted in profile) | **CONFIRMED** (L6 executed; `setMode` and profile leakage by code and audit probe). The learner can recover by deleting the data set, but nothing says so | P0 → **P0 for `setMode`/restart reset; P1 for L6/L12/L13 dataset replay** | `setMode` leaves Challenge completable from leftover state; dataset replay is a usability dead end with a workaround | M1a-2, M1a-3 |
| F-03 | `startLesson` event race (audit appendix A.2 item 2: "hypothesis only") | Starting a lesson can mis-complete the previous lesson | `store.ts` notifies every listener on every dispatch with the post-state, including `LOAD_CATALOG`, `LOAD_JES`, `GOTO`; `TutorialProvider.tsx:95-120` dispatches those **before** `setLessonId/setRunner`; the listener closure at that moment still holds the previous lesson, runner and mode (`:123-146`) | **UNVERIFIED (plausible from code).** If the previous lesson is running in Challenge mode and the new start state satisfies its validator, it is marked completed and progress is persisted | none → **P1** | Cannot be exercised by the reducer harness; needs a provider-level test. It would silently corrupt progress, so it must be tested before anything else is built on the runner | M1a-2: first write the failing provider-level test; fix only if it fails |
| F-04 | Edit `SUBMIT` explanation (GAP-01) | Glossary, `editor.ts`, `docs/10`, ADR 0012 say real ISPF submits the on-disk copy; this is a "documented deviation" | `explain.ts:~400`; EM text (my extract, PDF p.283-284): "The SUBMIT primary command submits the member or data set you are editing", operands labels/X/NX; command summary "Submits the data you are editing"; Edit ASCII/UTF-8 note converts "the data submitted to the internal reader"; UG2 Browse text "will submit the updated data set, not the copy being browsed" | **CONFIRMED.** The justification is unsupported for Edit and is IBM's wording for Browse. The simulator behaviour (submit the buffer) is consistent with IBM. IBM does not state whether unsaved edits are included | **P0 → P1** | A false sentence in a glossary and docs, not a broken lesson or assessment. The behaviour is not wrong | M1b: rewrite the sentence to what IBM says; do not assert the unsaved case; supersede ADR 0012 claim with a new ADR |
| F-05 | SDSF `SJ` write-back, `SE`, `X` (GAP-50) | L27/L28 teach "SJ, fix, PF3 saves the member"; IBM says SJ changes are not saved; `SE`/`X` differ | SDSF UG (my extract, PDF p.423 text): "To display just the JCL for the job, use the SJ action character. You can change and resubmit the JCL from the display; changes you make to the data are not saved"; SE/SB/SV = ISPF Edit/Browse/View of data sets; `X` = Print (same extract); `sdsf.ts:218-232`: `S`/`X` share a branch, `SJ`/`SE` share one and open `job.source`; `sdsf.test.ts:56-71` | **CONFIRMED, with a nuance.** The "not saved" sentence sits in the Output Data Set panel section; IBM does not say explicitly that the PDS member is untouched, though "not saved" plus "the JCL held by JES" makes that the natural reading. The simulator's SJ opens the saved member, not the held JCL | **P0 → P1** | The learner is not blocked: L27's `sj` step passes by opening the member another way and L28's hint offers "SJ or Edit the member". The harm is a false workflow belief | M1b: disclose the simplification in L27/L28/glossary and show both routes; do **not** redesign SJ in M1 (defer to M4) |
| F-06 | Non-existent / inexact message IDs (GAP-42) | `IEFC606I`, `ICE026A` do not exist; `IEF374I` has a fabricated `RC=`; others inexact | `ieam800` extract: IEFC601I, 602I, 603I, 605I, 607I, 609I... **no IEFC606I**; `icem100`: `ICE026I SMF RECORD NOT WRITTEN` and `ICE056A ddname NOT DEFINED`, no ICE026A; `IEF374I STEP/stepname/STOP yyyyddd.hhmm CPU ... SRB ... VIRT ... EXT` with no return code; `jcl.ts:204,214,229`; `programs.ts:132,137,155`; $HASP395 variants `ENDED`, `ENDED RC=`, `ENDED ABEND=`; IEF212I `jobname [procstep] stepname ddname[+ xxx] - DATA SET NOT FOUND`; IEB351I "permanent input/output error" | **CONFIRMED** (all four against primary text) | P0/P1 → **P1 for IEF374I and the IEF212I lesson wording** (visible in L26-L28); **P2 for IEFC606I and ICE026A** (reachable only on error paths no lesson walks) | The authenticity concern is valid (`lesson-authoring-standards` forbids coined IDs) but the exposure differs. All are cheap | M1b: fix IEF374I; replace the two non-existent IDs with plain simulator wording or a verified ID; correct "IEF212I names the data set" in L27/L28 |
| F-07 | `COND` parsed but not executed (GAP-30); `IF/THEN` rejected (GAP-31) | IBM evaluates COND; IF/THEN is valid JCL | `submit.ts` has no COND evaluation (only the `IEF142I ... COND CODE` message); JCL Ref text: "the system evaluates the COND parameter as true and bypasses the job step" | **CONFIRMED** | P1 → **P2** | No lesson exercises COND or IF; it only matters when Track B lessons exist | Defer to M4, driven by an approved lesson. Do not silently ignore: consider a visible note when COND/IF appears |
| F-08 | DISP=MOD etc. (GAP-36) | MOD on a missing data set errors; MOD replaces; PASS/UNCATLG unmodelled; failed DD leaks NEW data sets | `ieab600` text: "the system assumes that the data set is being created in this job step"; `programs.ts:53`; allocation-leak claim from `submit.ts:70,82,90` | **CONFIRMED for MOD/PASS/UNCATLG vs IBM; leak UNVERIFIED (code-read by the audit, not run by me)** | P1 → **P2** | Not exercised by any lesson (only `DISP=SHR`) | Defer to M4 with the DISP lesson. Add a probe for the leak when that work starts |
| F-09 | Statements taught as fact that IBM contradicts or does not support | Pop-ups (L1), `3.4` PF3 count (L2), option 0 scroll (L3), Browse line numbers (L7), MODIFIED (L8), 8-screen limit (L15), CAPS/BNDS/RECOVERY/undo (L18-20), S vs I, STATS, mod level (L22-23), SD/M.5, OWNER default (L25) | IBM text: Settings "Long message in pop-up" (UG2 extract); `bypass the second menu` (UG1); `default figure of 8 ... up to 32` (UG1); `If STATS mode is off when you save a member, any previous statistics are lost` and `increments the modification level the first time that data is changed` (EM); option 0 field descriptions I read list no "default scroll amount" (the Settings figure itself is an image, so not exhaustively confirmed); my Browse render: `BROWSE ... Top of Data`, numbered lines `000001 ...` (probe `m0-browse`) vs IBM Browse figures | **CONFIRMED** for pop-ups, bypass wording, 8/32, STATS, mod level, Browse rendering; **PARTIAL** for L2's PF3 count (IBM states the bypass, not the PF3 count); others rely on EV-A and are consistent with what I read | P1 → **P1** | Text and glossary corrections. Several are one-line fixes | M1b text corrections (section F, M1b-1). Where IBM is silent, say less rather than assert the opposite |
| F-10 | Tests encode defects | L2 test asserts two PF3s after typed `3.4`; SJ write-back and buffer-SUBMIT locked; L28 Challenge locked as state-only | `lessons.test.ts:60-69`, `:371-380`; `sdsf.test.ts:6-12,56-62` | **CONFIRMED** | P1 → **P1** | A corrected behaviour would break the test, which is the mechanism by which defects persist | Update these tests together with the behaviour they lock in (M1a/M1b) |
| F-11 | L28 objective vs Challenge validator; alternative valid route rejected | Objective says read SYSUT2; Challenge is state-only and rejects creating `PAYROLL.DATA` | `module9-10.ts:307` objective; `:336-339` challenge; audit probe o executed by me: "L28 create-PAYROLL.DATA route: job OUTPUT 0 challenge status running" | **CONFIRMED** | P1 → **P1** | Valid fix rejected; output inspection not assessed in Challenge | M1b-3: accept a created or renamed data set; either assess SYSUT2 or reword the objective to "outcome only" |
| F-12 | L16 "`=option` is RETURN followed by the option" | Contradicts IBM | UG1 extract: "Unlike the RETURN command, the jump function is not affected by nested dialogs"; jump simulates repeated END until a menu | **PARTIAL.** A simplification with a real difference in nested dialogs, not a false statement for the cases taught | P1 → **P2** | Over-stated as a contradiction | Reword in M1b if cheap; no behaviour change |
| F-13 | Progress is global (GAP-63) | Progress, mode and current lesson are global; catalog, profiles and JES are per userid | `keys.ts:5-9`: `progress` has no userid | **CONFIRMED** | P1 → **P2** | The app is local-first and effectively single-learner; a userid switch is an edge case. Changing the key needs a storage migration, which risks "progress compatibility" | Decide D1; default: document, do not change the key in M1 |
| F-14 | Zero-action Challenge set (subset of F-01) | L2, 3, 13, 15, 18, 21, 24 | my probe `m0-challenge` (`atStart=TRUE` for exactly these seven) | **CONFIRMED** | P0 | They complete on the first dispatch of any kind | M1a-1 |
| F-15 | Audit probe scripts as evidence | "Scripts preserved; findings marked probe were reproduced" | Executed all ten files: 32 tests pass; `grep -c "expect("` = 0 in every file; output only via `console.log` | **CONFIRMED, evidence-quality gap.** I reproduced the key console results (L17 `3.4` completes, L16 via `0` then PF4, L19 CAPS OFF + PF3, L20 open + CANCEL, L24 first action, L27 zero jobs, L28 alternate route, L21 FLIP alone) | none → **P1 (process)** | A probe that passes whatever happens cannot guard a regression and can mislead a reader | C3; M1a-4 converts them |
| F-16 | Replay of other lessons (L12, L13, L8/L9 HELLO) | Leftovers dead-end replays; L9 breaks HELLO; L25 does not reset it | audit text; `startingState` fields in my validator dump (`m0-validators`): L25 `resetMembers=0`, L12 `resetMembers=0`, L13 `resetMembers=0` | **CONFIRMED (code-read)** for the missing resets; the downstream effect on L25 (job ends CC 0012 if HELLO was overtyped) is from audit probe l/C and was **not re-run by me** | P1 → **P1** | Real but conditional on prior learner work | M1a-3 |
| F-17 | Lessons starting on `DSLIST_SEARCH` have an empty panel stack (PF3 does nothing; "Option 2" hints fail) | L5, L7-L10, L12 | `startLesson` dispatches `GOTO ... clearStack: true`; start screens in my dump: L5, 7, 8, 9, 10, 12 = `DSLIST_SEARCH` | **CONFIRMED (code-read)** for the mechanism; the specific hint failures were not executed by me | none → **P1** | A learner following a hint gets an error; cheap text fix | M1a-5 (text only) |
| F-18 | L14 `finalCheck` placement hole | Accepts `//STEP2` after the null `//`, on continuation lines, in lowercase | `module5.ts`: `REQUIRED = /^\/\/STEP2\s+EXEC\s+PGM=IEFBR14/i`; the lesson objective states "anywhere in the member is accepted" | **OVERSTATED.** Disclosed, deliberate leniency | P2 → **P3** | The lesson tells the learner the rule | Withdraw from the defect count (C6) |
| F-19 | "All 28 lessons CORRECTION REQUIRED" | Status distribution | status definition (any confirmed defect) | **CONFIRMED but low-discrimination** | n/a | True under the rule, but it hides the tiering. Roughly: 18 have an assessment-integrity issue; about 16 teach an IBM-contradicted statement; many have only polish items | Use the tiering in section D for scheduling; keep the status label |
| F-20 | Platform items: no CI, stale counts, aria-label=id, reset inconsistency, a11y gaps | as audit | `.github/workflows` absent (verified: `pnpm check` run manually); aria claims from audit code-read | **PARTIAL.** CI absence confirmed; the a11y and reset-inconsistency claims were not re-inspected by me | P1 → **P1 (CI), P2 (a11y labels), P2 (reset), P3 (cross-tab)** | | CI in M1b optional; others deferred |

---

## C. Disputed and unresolved findings

### C.1 Disputed (audit overstated or mis-prioritised)

1. **"At least 25 of 28" Challenge-trivial** (F-01). Corrected to 18 reproduced (+4 state-dependent). The audit's per-lesson probes cover about 14 lessons; the rest was extrapolated.
2. **P0 for the Edit `SUBMIT` sentence and the `SJ` workflow** (F-04, F-05). Demoted to P1: neither blocks a learner or falsely grants completion.
3. **P0 wording for non-existent message IDs** (F-06). Split by exposure.
4. **L14 `finalCheck`** (F-18). Disclosed by the lesson; withdraw.
5. **L16 "contradicts IBM"** (F-12). A simplification; P2.
6. **Roadmap item "retire the default Challenge for all lessons and give each its own `challenge`"** (see D). Too wide for M1; replace with a generic runner rule plus targeted explicit challenges.
7. **GAP-50 "redesign the fix workflow ... make SJ read the JCL JES held"**. A simulator redesign for a P1 text problem; defer.

### C.2 Unresolved or needing expert/live verification (must not be "fixed" as if known)

| Item | Why unresolved | Treatment in M1 |
|---|---|---|
| Does Edit `SUBMIT` include unsaved edits without a prior SAVE? | IBM text is silent; wording ("the data you are editing", conversion of "the data submitted to the internal reader") points to the session data, but it is an inference | State only IBM's wording. Keep current behaviour. Ask a z/OS user to confirm |
| Does `SJ` change the original PDS member? | IBM says "changes ... are not saved" in the Output Data Set panel section; the member case is not named | Disclose as "a copy; not saved" without claiming more |
| Do JCL-error jobs appear on SDSF `O`/`H`? | Docs silent; depends on MSGCLASS | Leave behaviour; mark in docs as unresolved |
| Typed `3.4` then PF3 count | IBM states the bypass, not the count | Remove the count from lesson text; leave behaviour; live check welcome |
| IEBGENER SYSPRINT text, default `CNTL` qualifier, SAVE of an empty member, `IEF450I` exact layout, ISPF message texts (SC19-3622 unread) | Not in the documents read | Do not copy any of these into lessons as fact |
| `startLesson` race (F-03) | Not executable with the reducer harness | Provider-level test first |
| Allocation leak on failed second DD (GAP-36) | Not run by me | Probe when DISP work begins |
| Option 0 panel figure | Image; only field descriptions were read | The "no default scroll amount" conclusion rests on the text field list |

---

## D. Revised recommendations

**Retain** (as proposed, scope trimmed where noted)
- Per-lesson fixes for IBM-contradicted statements (F-09), done as targeted text/glossary/docs edits.
- Scenario reset for replay (F-02), but as the smallest schema that covers L6, L12, L13, profiles.
- Replace non-existent/inexact message IDs (F-06).
- Tests that cite their evidence (as comments), converted from the probes.
- `docs/curriculum/` package, evidence appendices, authoring standards (retain as-is; they are good).
- CI running `pnpm check` (small, protects M1).

**Modify**
- *Challenge fix*: not "explicit `challenge` for all 26 lessons". Replace the last-step fallback with a generic runner rule: **Challenge completes only when every step's validator has been satisfied at least once since the Challenge started (order-free), and a validator that is already true on the start state counts only after it has been observed false and then true.** Keep explicit `challenge` for L14 and L28 and add one only where a lesson's steps cannot express the outcome. Rationale: the 18 shortcuts all skip earlier steps; the existing coached Learn walks already produce every step validator, so the happy path is preserved without 26 hand-written validators. Risk: a learner who reaches the outcome by a route that never fires an intermediate step validator would be blocked; mitigation is Practice mode and the explicit-challenge escape hatch. This must be validated by running every lesson's coached walk in Challenge mode (nine lessons have no walk today).
- *SJ*: disclosure plus accepting both routes, not a redesign.
- *Progress identity*: keep global, document, no key change.
- *Source registry in code and lesson metadata*: reduce to `requires` and `sources` as optional fields only if M3 starts; do not add `difficulty`, `estimatedMinutes`, `reviewStatus` now.

**Combine**
- Audit M1 items 1.4, 1.5, 1.6 and GAP-72/73 into one runner-and-reset workstream (M1a).
- Audit M2.3 (CI) and M2.4 (fix resource links) into M1b as small items.

**Defer** (until an approved lesson or confirmed need requires them)
- COND/IF evaluation, DISP=MOD/PASS/UNCATLG, procs, abends, EBCDIC sort, IEBCOPY (GAP-30..45).
- SDSF `H/I/DA/PR/INIT`, `C/A/H` actions, PREFIX exact-match, column titles (GAP-51..56), SJ redesign.
- Catalog "cataloged" flag, PDSE (GAP-10, GAP-11).
- TSO `qualify()` changes, command-set expansion (GAP-20..24) except fixing the L26 overclaim in text.
- Browse re-render without line numbers (GAP F-09): disclose in M1b, re-render in a later milestone.
- Progress keyed by userid; cross-tab `storage` handling; mobile read-only theory view; competency view; per-track UI.
- Track B/C/D/E/F lessons (all of M3-M7).

**Reject** (no demonstrated need, or conflicts with the constraints)
- A machine-readable competency framework.
- A code-side source registry that fails CI on broken IDs (nice but premature; the evidence files already serve).
- The "fidelity-fixture helper" as a new abstraction (comments citing `EV-*` in ordinary tests are enough).
- Any REXX interpreter before reading-lesson demand is shown.

---

## E. Revised implementation sequence

The audit's M1-M7 is sound in order but too wide at the front. Smallest practical sequence that fixes **confirmed** problems:

| Step | Contents | Gate to proceed |
|---|---|---|
| **M0** | Accept this review (conditions C1-C6); decide D1-D3 | User sign-off |
| **M1a** Assessment integrity and isolation | Provider-level race test; generic Challenge rule; mode-switch/restart reset; scenario reset schema and its use in L6, L8, L9, L12, L13, L18-L20, L25; probes converted to asserting tests; walks for the nine lessons that lack one; empty-stack start text fixes | `pnpm check` green; the 18-lesson shortcut battery and the zero-action check pass as assertions; every lesson replays and survives a mode switch; the race test is resolved either way |
| **M1b** Content and fidelity corrections | IBM-contradicted statements (text/glossary/docs); `SUBMIT` and `SJ` disclosures and new ADR; IEF374I and other inexact IDs; L22 S/I swap and SORT LRECL default; L23 STATS/mod-level rules; L27/L28 validator fixes; stale doc counts; resource links; optional CI workflow | `pnpm check` green; each corrected statement cites an `EV-*` row; docs/03, 04, 05, 10 updated |
| **M1 acceptance** | A second review of M1 output against this document | User sign-off |
| M2 (reduced) | Add `requires` (optional) and `sources` (optional) lesson fields only if M3 is approved | M1 accepted |
| M3 | First Track B batch, in the audit's order, only after the simulator changes each lesson needs | Per-lesson spec at `source-reviewed` |
| M4-M7 | Backlog; start an item only when an approved lesson depends on it | Per item |

Compatibility check against the constraints: nothing above requires accounts, cloud services, a new build system or a network call; lesson IDs and step IDs are unchanged; stored progress (status, attempts, hints, mistakes, bestScore, completedAt) is unaffected; `ispf-lab:progress:v1` is not renamed; additions to `LessonStart` are optional and additive; determinism is preserved (no clock or random input is introduced).

---

## F. M1 implementation readiness: approved scope

**Principle:** fix confirmed assessment and teaching defects with the smallest changes. No new lessons, no new simulator features.

### M1a: assessment integrity and isolation

| ID | Work | Affected modules | Acceptance criteria | Tests |
|---|---|---|---|---|
| M1a-1 | **Challenge rule.** In `feedEvents` (Challenge branch): if the lesson defines `challenge`, use it (unchanged). Otherwise require **all** step validators to have been satisfied at least once since Challenge start (order-free); a validator true on the start state counts only after being observed false then true; completion requires at least one event. Add `seen` state to `RunnerState`. Pure, deterministic | `src/tutorial/engine.ts`, `src/tutorial/types.ts` | (a) None of the 28 lessons completes from a fresh start with zero actions; (b) none of the 18 shortcuts in F-01 completes; (c) each lesson's coached Learn walk completes in Challenge mode; (d) L14 and L28 behave as before | Parametrised assertion tests built from my `m0-challenge`, `m0-single`, `m0-seq` probes; add a Challenge-mode walk for each of L1, 3, 4, 5, 7, 10, 11, 12, 13 (those without one) |
| M1a-2 | **Mode switch and restart reset; start race.** First write a provider-level test (React Testing Library, jsdom is present) that switches lessons while the previous one is in Challenge mode. If it fails, make the provider ignore runner events produced by `startLesson`'s own dispatches (set lesson and runner before dispatching, or gate with a ref). `setMode` and `restartLesson` re-apply the lesson's starting state | `src/state/TutorialProvider.tsx` | Switching lesson or mode never completes a lesson the learner did not do; progress records unchanged except for genuine completions | New `tests/tutorial/provider.test.tsx` |
| M1a-3 | **Scenario reset schema.** Extend `startingState` additively with optional `resetDatasets` (delete listed data sets), `resetProfiles`, `clearRetrieve`, `clearScreens`. Apply: L6 (`{HLQ}.TEST.JCL`), L12 (`SCRATCH`, `DRAFT`), L13 (`{HLQ}.TEST.JCL`), L18-L20 (profiles), L8, L9, L25 (`HELLO`), L23 (`HELLO`) | `src/tutorial/types.ts`, `TutorialProvider.tsx`, lesson files | Every lesson can be run twice, and after any other lesson, without a dead end; L25's job ends CC 0000 regardless of earlier work | Replay test over all 28 lessons (run twice; run after each other lesson's coached walk) |
| M1a-4 | **Convert probes to tests.** Turn audit probes a-f, l-o and my m0 probes into assertion tests under `tests/tutorial/`, each with a comment naming its finding ID and `EV-*` row. Keep the print-only originals under `evidence/probes/` | `tests/tutorial/*` | Each probe fails against the baseline behaviour it documents and passes after its fix | n/a |
| M1a-5 | **Empty-stack start text.** Fix the hints that fail when a lesson starts on `DSLIST_SEARCH` with no stack (L8-L10 "PF3 to the POM", "Option 2"): use `=` jumps or `RETURN`. No start-screen changes | lesson files | Following each hint from the start state works | Walk tests |

### M1b: content and fidelity corrections

| ID | Work | Affected modules | Acceptance criteria |
|---|---|---|---|
| M1b-1 | **Teaching statements.** Correct or soften the statements in F-09 and the per-lesson reports marked "contradicted": L1 pop-ups; L2 `3.4` PF3 count (remove the count); L3 option 0 scroll (re-teach the Scroll field; disclose the Settings convenience); L7 Browse look (disclose); L8 MODIFIED and AUTOSAVE; L15 8-screen limit; L16 wording; L18-L20 BOUNDS/CAPS/RECOVERY/undo; L22 S vs I; L23 STATS and modification level; L25 SD/M.5/OWNER default; glossary "no undo" and duplicate `JCL` key | lesson files, `src/tutorial/explain.ts`, `docs/03`, `docs/04` | Every changed sentence cites an `EV-*` row in the commit message; none asserts something IBM is silent on |
| M1b-2 | **SUBMIT and SJ.** Rewrite the Edit `SUBMIT` explanation to IBM's wording; add a Browse-vs-Edit note; disclose that simulator `SJ` opens the saved member whereas real SDSF edits a copy that is not saved; new ADR superseding the 0012 claim; update `docs/10` | `explain.ts`, `editor.ts` comment, `module9-10.ts` (L24, L27, L28), `docs/10`, `docs/adr/` | No sentence says real ISPF submits the disk copy for Edit or that SJ saves to the member |
| M1b-3 | **Validators and text confirmed defective.** L28: accept a created or renamed `PAYROLL.DATA` and either assess SYSUT2 or change the objective to "outcome only"; correct "IEF212I names the data set" in L27/L28; L27 step 5: ignore comment lines and match case-insensitively; L17 step 5 (require the re-run); L21 (require EXCLUDE before FLIP); L6 step 3/4 (check PDS attributes; require the data set to be displayed); L9 and L11 step 6 (state check, not event-only); L5 step 2 (the named data set) | `module*.ts`, `validators.ts` | Each fix has a negative test; no valid alternative route is rejected |
| M1b-4 | **Visible simulator corrections limited to what lessons display.** `IEF374I` without `RC=`; replace `IEFC606I` and `ICE026A` with verified IDs or plain simulator text; L22: `S` omits directory-block and member counts for a PDS, `SORT LRECL` defaults descending; L23: modification level increments on the first change, `STATS OFF` discards statistics | `src/jes/*.ts`, `src/engine/screens/dslistResults.ts`, `datasetPanels.ts`, `src/catalog/catalog.ts` | Updated `tests/jes`, `tests/engine`, `tests/catalog` assertions each cite an `EV-*` row |
| M1b-5 | **Housekeeping.** Fix stale counts (README 127, docs/07 140, glossary 32 vs actual); re-sync `resources.ts` with `docs/08` and update the stale IBM links per `verified-sources` section 5; optional `.github/workflows/ci.yml` running `pnpm check`; project log and changelog | `README.md`, `docs/*`, `src/content/resources.ts` | Counts match `pnpm test`; links resolve |

### Explicit exclusions from M1

New lessons; lesson metadata fields beyond what M1a-3 adds; code-side source registry; progress key or storage changes; COND/IF/DISP/PROC/abend/EBCDIC work; SDSF panel or action additions; SJ redesign; catalog flag, PDSE, TSO command expansion; Browse re-render; REXX; accessibility relabelling; mobile/read-only theory; competency views; cross-tab handling.

### M1 exit criteria

`pnpm check` green; M1a-1 assertions pass for all 28 lessons; replay test passes; provider race test resolved; every IBM-related edit traceable to an `EV-*` row; `docs/00-project-log.md`, `CHANGELOG.md`, `docs/03|04|05|10` updated; a short M1 report listing deferred items. Rough effort: M1a medium-large (runner, provider, 9 new walks, replay suite), M1b medium.

---

## G. Outstanding decisions

| # | Decision | Options | Recommended default |
|---|---|---|---|
| D1 | Progress scope | Keep global and document; key by userid with migration | **Keep global, document in an ADR**; revisit if multi-learner use appears |
| D2 | `SJ`/`SE`/`X` in the simulator | Disclose only; redesign (SJ reads held JCL, SE/X implemented) | **Disclose now; redesign deferred to M4** |
| D3 | Challenge fallback rule | Explicit `challenge` per lesson; generic "all steps observed" rule + explicit where needed | **Generic rule + explicit where needed** (section D) |
| D4 | Empty-stack lesson starts | Text-only hint fixes; start from the Primary Option Menu; add `stack` to `startingState` | **Text-only hint fixes** |
| D5 | Browse look (line numbers, "Top of Data") | Disclose; re-render to match IBM | **Disclose in M1b; re-render in a later milestone** |
| D6 | Message ID policy | Only verified IDs; otherwise plain simulator text marked simulated; keep coined IDs | **Only verified IDs; else plain text marked simulated** |
| D7 | Day-One "uncataloged" scenario | Reword to "does not exist"; add a cataloged flag | **Reword** |
| D8 | Edit `SUBMIT` unsaved changes | State IBM's wording only; assert unsaved edits are submitted | **IBM's wording only**; seek expert confirmation |
| D9 | CI | Add a minimal workflow now; later | **Add now** (one job running `pnpm check`) |
| D10 | Target IBM release in lessons | z/OS 3.2 only; mention 2.5/3.1 | **z/OS 3.2, say so in the references** |
| D11 | Who confirms the silent-documentation items | Expert; live z/OS; leave unresolved | **Ask a z/OS user or IBM Z trial access**; leave unresolved until then |

---

## H. Review of audit completeness against the Phase 0 acceptance criteria

| Criterion | Review verdict |
|---|---|
| Repository and registry inspected | Met |
| Every lesson individually audited | Met in form (28 sections, 13 fields). Depth varies; I verified only a sample of the 1,700 lines |
| Material findings have evidence | Met for the findings I re-checked; evidence quality note: probe scripts print-only (F-15) |
| IBM references identified and verified where possible | Met at book/page level. HTML deep links not obtainable; ISPF Messages and Codes not read |
| Unverifiable claims flagged | Met (and the audit was honest about it) |
| Missing subjects assessed; objectives and sources | Met for Tracks A-C; Tracks D-F are placeholders awaiting sources, as the audit says |
| Simulator capabilities cross-referenced | Met; GAP rows are traceable. Priorities need the changes above |
| Platform recommendations distinguish existing from missing | Met, but contain over-engineering (section D) |
| Authoring standards | Met; useful and proportionate |
| Implementation roadmap ready | **Not yet.** Ready after C2 and section F replace M1 |
| No implementation performed | Met (`git status` showed only docs; `node_modules` is untracked) |

**Gaps the audit did not cover that M1 should absorb:** the `startLesson` race (F-03); the lack of assertions in its own probes (F-15); a repository-wide check that the preserved quotes are 25 words or fewer (not verified by me); an explicit statement of what changes to the Challenge rule do to the stored `bestScore` semantics (none expected).

---

## 9. Independent evidence log

My probes and their raw outputs are copied to `evidence/probes/m0-review/` as `.txt` (so `tsc` and ESLint ignore them). Re-run by copying `*.probe.ts.txt` and `vitest.config.mjs.txt` to a scratch folder outside the repo, dropping the `.txt` suffix, and running `vitest` there (the config aliases `@` and `@tests` to this repo).

| File | Purpose | Result |
|---|---|---|
| `m0-challenge.probe.ts` | For every lesson: is the Challenge validator true on the fresh start state; first of five benign actions that completes | Zero-action: L2, 3, 13, 15, 18, 21, 24 (7); no further completions from Enter, PF7, PF8, PF3, HELP |
| `m0-single.probe.ts` | 20 single actions from a fresh start | L17 via `3.4`; L25 via `=S` |
| `m0-seq.probe.ts` | Scripted 2-3 action cheap sequences | L7, L23 (member list); L16 (`=3.4` then RETURN/PF4); L5, L22 (`3.4`, level, RESET); L9 (edit then SAVE); L10, L20 (edit then CANCEL) |
| `m0-validators.probe.ts` | Dump each lesson's effective Challenge validator, start screen, resets | Confirms only L14 and L28 define `challenge`; start screens; reset counts |
| `m0-l6.probe.ts` | Allocate `USER01.TEST.JCL` twice | Second attempt: `DATA SET ALREADY EXISTS`, no `DATASET_ALLOCATED`, never reaches `ALLOCATE_DATASET` |
| `m0-browse.probe.ts` | Render real Browse via 3.1 option B | `BROWSE ... Columns 00001 00072`, `****** Top of Data`, numbered `000001 //USER01H ...` |
| `m0-discover.probe.ts`, `m0-debug.probe.ts` | Field discovery; edit-then-cancel debugging (my first sequence used wrong entry fields; corrected) | n/a |
| Audit probes a-f, l-o | Executed unchanged | 32 tests pass (no assertions); console output reproduced the audit's L16, L17, L19, L20, L21, L24, L27, L28 claims |

IBM text checks (from my own extraction of the original PDFs): Edit `SUBMIT` wording and command summary; IEFC message list without 606; `ICE026I`/`ICE056A` and no `ICE026A`; `IEF374I` text; `IEF212I` text; `$HASP395` and `$HASP165` texts; `IEB351I` as a permanent I/O error; JCL Reference `DISP=MOD` creation rule, `COND` bypass rule, and `DD DATA` not ended by `//`; SDSF `SJ` "not saved", action characters, `PREFIX`/`OWNER` exact-match rule; ISPF Settings "Long message in pop-up", "bypass the second menu", "default figure of 8 ... up to 32 split screens"; Edit "any previous statistics are lost", "increments the modification level the first time that data is changed".

## 10. Recommended next steps

1. User decision: accept M0 with conditions C1-C6, and confirm defaults for D1-D3 (or choose otherwise).
2. Apply C1/C2 corrections to `phase-0-audit.md`, `existing-lessons-audit.md`, `simulator-gap-matrix.md`, `implementation-roadmap.md` (documentation only), then begin **M1a-2's failing provider test** as the first M1 task, followed by M1a-1.
3. Ask a z/OS user to confirm the silent-documentation items in C.2 in parallel; do not block M1 on them.

*Stop: M1 has not been started.*
