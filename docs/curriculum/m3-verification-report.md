# M3 verification report: bringing lessons 29-36 to independently reviewable quality

**Date:** 2026-10-16. **Branch:** `feat/m3-foundations` (pushed to `origin`; **not merged, not published, no pull request opened**). **Scope:** the eight draft lessons only. No M4 work and no new lessons.

> **This is not an independent review.** Every source check in this report was made by AI examiners working from local text extracts of the IBM PDFs, in fresh contexts that did not rely on the author's citations. They are a *second pass by the same kind of reviewer that wrote the lessons*. No human has checked a row, no z/OS practitioner has run a lesson, and no row in `verified-sources.md` was promoted to VERIFIED on this basis. Section 9 is the handoff to the real independent review.

## 1. What the owner asked, and what was done

| Owner decision | Result |
|---|---|
| Preserve ids and numbers; add a separate display order if needed | Done. Display order is the order of the `LESSONS` array; ids, numbers and stored progress are unchanged. New lessons sit where they teach (29 after lesson 8, 31 after 6, 30 before 24, 32-34 after 26, 35-36 after 27) and take the module of their neighbours. Numbers therefore appear out of sequence in the menu (ADR 0018). |
| Keep b-01 as a trace; improve conceptual assessment with the smallest mechanism | Done: multiple-choice check questions (`Lesson.questions`, `answered()`, `answerQuestion`), no new event type or persistence. b-01 has three; b-10 got four "what kind of failure" questions (added after finding its central claim unassessed). Wrong choice = mistake. |
| Keep b-10's four deterministic faults | Kept. One fault changed because the evidence contradicted its teaching: FIXRC (and b-06's RCJOB) now use a missing comma, a documented ICE007A cause, instead of a misspelt keyword. |
| No M4, no new lessons | Respected. |
| 1. Claim-level evidence matrix, all eight lessons | `m3-evidence-matrix.md`: **229 claims** (124 supported, 56 partial, 18 simulator-only, 15 inferred, 8 not supported, 8 unverified) with release, section, printed page, quote and verdict. |
| 2. Re-examine each source against the lesson text | Seven fresh-context examiners read the passages themselves (per lesson, one agent per one or two lessons), plus one for the simulator changes. 14 findings were labelled HIGH; all are fixed or disclosed (section 3). |
| 3. Review the 141-file change set | Done by a code-review agent (section 5). Dead code, a truncated help row and a public-visibility defect fixed; the recommendation to split into stacked pull requests is the owner's decision. |
| 4. Run all eight lessons in Learn and Challenge in the browser, with negative paths and alternatives | Done (section 6), including genuine defects found only in the browser. |
| 5. Challenge objective vs what the lesson teaches | Reviewed per lesson (section 2); two Challenges tightened (a-01, b-03), b-10 got questions, remaining weak points disclosed. |
| 6. Validate every simulator change against IBM, add regression tests | Section 4. |
| 7. Verify CI on a pushed feature branch | Pushed; CI **passed** (section 7). |
| 8. Update registry, specs, audit documentation, project log | Done: `verified-sources.md` section 9, per-lesson spec sections, `simulator-gap-matrix.md` section 5, `existing-lessons-audit.md`, `00-project-log.md` Phase 25, ADR 0018, changelog, behaviour docs. |

## 2. Per-lesson status

Claims = rows in the matrix (S supported / P partial / Sim simulator-only / Inf inferred / NS not supported / U unverified). "High fixed" = findings labelled HIGH by the examiner that were corrected in the lesson or simulator. Browser: L = Learn, C = Challenge; "neg" = a route that must not pass was run, "alt" = a legitimate alternative route was run.

| Lesson | Claims (S/P/Sim/Inf/NS/U) | High findings fixed | Still unverified / needs an expert | Assessment quality | Browser |
|---|---|---|---|---|---|
| 29 a-01 Scroll | 10/3/5/2/1/0 | typed MAX is one-time in IBM; the simulator kept it (fixed, tests) | the real initial Edit Scroll value; real text of the simulator's `COMMAND NOT RECOGNIZED` | Challenge now needs HALF, a one-time number and a one-time MAX with the field still HALF (the number was taught but unassessed). Weak: PAGE and CSR/DATA are not assessed | L, C; neg (HALF+MAX without a number; pages only), alt (MAX typed in the field) |
| 30 b-01 Big picture | 22/6/3/2/2/0 | wrong "JES said SUBMITTED" (the TSO SUBMIT command does); "JES ran it" (an initiator does); role-session ambiguous between TSO/E and ISPF (all fixed; lesson 24 and the SUBMIT glossary entry corrected too) | `$HASP100`/`$HASP165` lines; real `S` on ST behaviour; how fine a TSO/E/ISPF/SDSF distinction a beginner needs | Trace plus three recall questions. Weak: assesses recall of roles, not understanding of why they are split; four options each | L, C; neg (answers without the trace; trace without answers; a wrong answer costs a mistake), alt (J on the member list) |
| 31 b-02 Data set types | 19/6/2/1/1/1 | "a PDSE would look like a PDS" (it shows PO-E); "zero directory blocks = sequential" only with a blank name type | real ISPF text for several simulator messages; LISTDS of a PDSE | Both data sets with the right attributes and their information shown (I or LISTDS). Not assessed: "only a library has members" (an instructed refusal, Learn only) and the PDSE concept (the simulator cannot create one) | L (incl. recovery from wrong attributes by delete and re-allocate), C; neg (no info shown; LIB with zero blocks), alt (LISTDS route) |
| 32 b-03 Reading a job | 21/9/1/1/1/1 | `TSO SUBMIT JCL(BROKEN)` is not what real TSO resolves (CNTL qualifier), now disclosed | which spool data set holds IEFC messages and the `STMT NO. MESSAGE` header | Challenge now needs the JCL error, **reading JESYSMSG**, then CC 0000. Not assessed: column rules, COLS, null statement (Learn only) | L, C; neg (fix without ever failing; fix without reading), alt (proper continuation record) |
| 33 b-04 Build a job | 16/11/0/3/0/0 | none labelled HIGH; MSGCLASS added, SMS cataloging wording corrected | none beyond the SMS wording | A job (not option 3.2) must create an FB 80 data set. Not assessed: DISP/SPACE/UNIT details beyond what creates the data set | L, C; neg (wrong LRECL; creating it with 3.2), alt (other job name, KEEP, separate RECFM/LRECL) |
| 34 b-05 DISP | 10/8/2/1/0/2 | none labelled HIGH; unsourced "OLD starts from the beginning" removed; MOD on a library member overwrote it (simulator fixed) | KEEP vs CATALOGED on SMS; real placement of IEF285I | Fix KEEPIT so the data set exists, created by the job. Not assessed: predicting the outcome of NEW/MOD/DEL (Learn only) | L, C; neg (NEW,DELETE; creating it with 3.2), alt (NEW,KEEP) |
| 35 b-06 Return codes | 11/7/1/1/1/2 | ICE007A taught for a misspelt keyword (now a missing comma, parser tightened); "every step ends 0000" labelled simulated; S806 only "reason 04" | the real ICE message for an unknown SORT keyword; whether SORTIN DUMMY ends RC 0 on real DFSORT; CSV003I/IEF450I in the job log or JESYSMSG | CC 16, log read, later CC 0000. Not assessed: abend vs return code (ABENDJOB is Learn only) | L, C; neg (fix before reading the log), alt (a different valid control statement) |
| 36 b-10 Troubleshooting | 15/6/4/4/2/2 | IEFC630I does not echo the keyword; ICE007A for a misspelt keyword; IBM does not distinguish "JCL error" and "allocation failure" by status (both are JCL ERROR; the valid line is the message id) | which ICE message real DFSORT issues; placement of IEFC messages | Four jobs: fail, read, fix, CC 0000, **and four "what kind of failure" questions**. Fixed faults (not rotated); any order | L, C; neg (wrong kind; fix without reading; fixed jobs without the answers), alt (reverse order) |

## 3. The HIGH findings and what happened to them

| # | Finding (lesson) | Resolution |
|---|---|---|
| 1 | Typed MAX in the Scroll field stays (a-01); IBM reverts it | simulator + tests + spec |
| 2 | "A PDSE would look like a PDS" (b-02) | corrected: PO-E |
| 3 | "Zero directory blocks means sequential" (b-02) | corrected with the LIBRARY exception |
| 4 | `TSO SUBMIT JCL(BROKEN)` is not the real name resolution (b-03) | disclosed in the step |
| 5-6 | ICE007A for a misspelt keyword (b-06, b-10) | fault changed to a documented cause; SORT parser now checks it |
| 7 | "Every step ends 0000" after the fix (b-06) | labelled the simulator's result |
| 8 | S806 over-general (b-06) | "reason 04" |
| 9 | IEFC630I echoes the keyword (b-10) | no longer claimed |
| 10 | "JCL error vs allocation failure" is not IBM's status distinction (b-10) | categories renamed; classification by message id; now assessed with questions |
| 11-13 | Who issues SUBMITTED; who runs the job; role-session ambiguity (b-01) | corrected |
| 14 | Draft lessons visible in every learner-facing list (diff review) | `Lesson.draft` gate; a production build verified at "28 guided lessons in 10 modules" |

Also found and fixed **in the browser**, not by any examiner: the new-member quote marks that the browser sends back with every Enter were read as an invalid line command (the editor kept all input lines and showed an error); the Edit/View entry panel had a dead Command line although PF3 from the editor lands on it and the lessons say to jump with `=S`; the b-01 "Why?" text printed the answer before the learner chose; b-10's Learn flow could strand a learner who fixed a job before answering its question (the fix steps now check state).

## 4. Simulator changes validated against IBM

| Change | IBM evidence | Verdict after the second pass | Regression tests |
|---|---|---|---|
| New empty member, five `''''''` input lines | ISPF Edit and Edit Macros p.7-8, p.12, p.162 | matches the headline case; IBM is silent on when the quote lines go away; extended to existing empty members; quote marks no longer read as a command | `editorFlow.test.ts` (browser-shaped drafts included) |
| JESYSMSG `STMT NO.` = JESJCL number | only the Redbook JESJCL sample and JCL Reference p.3 | matches comments/continuations; the record-number fallback for stray text lines fixed (IBM silent) | `jes.test.ts` |
| Trailing `/*` accepted | JCL Reference p.309-310, p.459 | extended to `/*` with a comment, `/*` before `//`, and `/*` ending in-stream data | `jes.test.ts` |
| DD keywords STORCLAS/DATACLAS/MGMTCLAS/LABEL/FREE/DSNTYPE accepted and ignored | JCL Reference DD chapter | all valid; ignoring is safe for the lessons; RETPD/EXPDT effects and other keywords still open | existing GAP-33 tests |
| DISP=MOD create / append | JCL Reference p.149, p.154 | sequential paths match; a library member now fails instead of being overwritten (IBM terminates the job) | `jes.test.ts` |
| ICE007A text and cause | DFSORT Messages p.18 | text exact; the parser now rejects a missing comma, missing sequence, unbalanced parenthesis and unknown format | `jes.test.ts` |
| IEF236I before a failed allocation | System Messages IEF236I | fixed (printed only on success) | `jes.test.ts` |
| One-time MAX; scroll events carry the amount | ISPF UG Vol I p.17, p.60 | fixed / simulator-only | `editorFlow.test.ts`, `m3-lessons.test.ts` |
| Live Command line on the Edit/View entry panel | ISPF Edit entry panel | fixed (found in the browser) | `navigation.test.ts` |
| SDSF help rows over 80 columns | project rule | fixed; a test now covers every screen's help | `helpWidth.test.ts` |

Open fidelity items (none blocks a lesson; listed in `simulator-gap-matrix.md` section 5): PASS/UNCATLG/RECATALOGED wording, KEEP on SMS printing KEPT, IGD101I fixed class names, LABEL RETPD/EXPDT, DSNTYPE=LIBRARY making a PDS, `ICEnnns c` trace characters and the no-SYSOUT case, typed-then-erased input lines, END on an untouched new member, `//*` after a trailing comma, other panels' dead Command lines, cosmetic message layouts. One fix (IEF236I) was written together with its test and I did not observe it red first.

## 5. The 141-file change set

Reviewed by a code-review agent (read-only). No CRITICAL finding; one HIGH (drafts visible: fixed). Fixed from its list: the truncated SDSF help rows, dead code (`editorLineCount`, `notEditing`, an export), the Challenge history cap (400 raised to 2,000 events, pinned by a test), duplicate changelog headings and awkward README wording; a committed personal path in two probe files was scrubbed. **Not changed:** the reviewer's scope-creep findings. Milestone inventory: M1a 17 src files / 9 test files / 45 docs files (the Phase 0 and M0 audit package and about 29 probe scripts under `docs/curriculum/evidence/probes/`), M1b 21 / 10 / 4, M1 closure 9 / 5 / 6, M2 7 / 2 / 5, M3 13 / 7 / 12 before this hardening. The reviewer's verdict: the diff is **not reviewable as one pull request**; it recommended four stacked PRs (audit docs with trimmed probes; M1a/M1b/M1 closure; M2; M3 behind the draft gate). That split is the owner's call. `tests/tutorial/m3-lessons.test.ts` is now over 1,200 lines (guideline 800) and was not split.

## 6. Browser testing (Chrome, console clean)

Method, stated plainly: the lessons were driven through the real UI at `localhost:3000/lab` (Next dev server) with a small driver that sets field values and dispatches `input` and `keydown` events on the real inputs, so the app's own React handlers, Terminal draft logic, lesson runner and persistence all ran; the b-01 check-question buttons were also clicked with genuine mouse events. The events are programmatic, not hardware keystrokes. Every lesson was run in Learn and in Challenge, each with at least one negative path and one legitimate alternative route (section 2). Mode switches and restarts were exercised many times (the restart confirmation appeared and was accepted or dismissed). Screenshots: `docs/curriculum/evidence/m3-browser/` (b-01 wrong-answer feedback, b-10 Challenge complete, plus the earlier a-01 and b-02 captures).

Not covered: browsers other than Chrome; touch or mobile (the app gates small screens); keyboard-only and screen-reader use of the new question buttons (they are real `<button>`s with labels, untested with assistive technology); the production build was checked only for lesson counts (28 on the landing page and in the structured data), not walked through.

## 7. CI and deployment

- **CI:** `feat/m3-foundations` was pushed and the workflow now also runs on `feat/**` pushes. Run 38826775525 on commit `7e90716`: install with the frozen lockfile, `pnpm check` and `pnpm build` **all passed** on `ubuntu-latest`, Node 22. This is the first CI run this project has ever had. Later commits (the Challenge tightening, b-10 questions and this report) were pushed afterwards; their run is recorded in the final response.
- **Vercel:** the repository has a Vercel integration. Pushing the branch produced a **preview build with status success** (dashboard link only; the preview URL was not opened or inspected). Because drafts are gated, a preview shows the 28 reviewed lessons, but it does contain the M1a-M2 changes, which are also not yet approved for production. Nothing was merged to `main`, so no production deployment was triggered.
- Node 22 (CI) against the local Node is now verified for build and tests; a second browser is not.

## 8. Remaining blockers before `approved`

1. **Independent review of all eight lessons** (section 9): source review by a second person from the IBM pages, fidelity run in three modes, expert (z/OS practitioner) review. Nothing in this report substitutes for it.
2. **Open evidence items** that only an expert or a live system can close: which spool data set holds IEFC converter messages and the `STMT NO. MESSAGE` layout; where CSV003I/IEF450I appear (job log or JESYSMSG); the real ICE message for an unknown SORT keyword; whether a real DFSORT run with `SORTIN DD DUMMY` ends RC 0; real ISPF text for several simulator-only messages; the initial Edit Scroll value; `S` vs `?` on the ST panel.
3. **Register gaps:** no per-topic HTML URLs for most 3.2 manuals (book-level and PDF page only); `hasa300` is only a CANDIDATE source.
4. **Pedagogy:** lesson numbers appear out of sequence in the menu (29 between 8 and 9); the check questions assess recall only; the Challenges for b-02, b-05 and b-06 leave some taught claims to Learn mode.
5. **Decision for the owner:** whether to split the 141-file diff into stacked pull requests before any merge, and whether the M1a probe scripts and the Phase 0 audit package belong in the product repository.
6. `docs/curriculum/full-progress-report.md` (the earlier progress report) is stale and untracked; it was left out of every commit.

## 9. Independent-review handoff

**Artifacts:** `m3-evidence-matrix.md` (229 claims with page citations and the examiners' quotes; treat every quote and page as *to be re-checked*); `lessons/<id>.md` (spec, validation design, and a "findings and resolutions" section per lesson); `verified-sources.md` section 9 (page offsets, register gaps); `simulator-gap-matrix.md` section 5; ADR 0018.

**How to see the drafts:** `pnpm dev` (it sets `NEXT_PUBLIC_SHOW_DRAFT_LESSONS=1`) and open `/lab`; a production build hides them unless the flag is set when building.

**Reviewer A, source review** (needs the IBM z/OS 3.2 PDFs or Docs): for each lesson, re-verify every row marked PARTIAL, INFERRED, NOT-SUPPORTED or UNVERIFIED and a random 20% of SUPPORTED rows; confirm the cited page says what the lesson now says; add the per-topic URLs the register lacks.

**Reviewer B, fidelity run** (three modes): run each lesson in Learn, Practice and Challenge from a clean browser profile; try the negative paths and alternatives in section 2; look for any accepted shortcut and any rejected legitimate route; check the check questions are fair (one defensible answer, no giveaway text).

**Reviewer C, expert (z/OS practitioner):** decide the open items in section 8.2; judge whether classifying a failure by message id (rather than SDSF status) is how practitioners teach it; whether FIXPGM's S806 and FIXRC's ICE007A are realistic first examples; whether b-01's four-way role split is the right level for a beginner.

**Acceptance criteria to move a lesson from `draft` to `approved`:** all three reviews recorded in the spec; every PARTIAL and NOT-SUPPORTED row resolved or labelled simulated; then remove `draft: true` from the lesson and update the public counts (landing text, social image, README) in the same change.

## 10. Next steps (not started)

1. Commission the three reviews above. 2. Decide on the stacked-PR split. 3. After approval, remove the draft flags lesson by lesson and update public copy. 4. Only then consider M4 simulator work (COND/IF, abends, EBCDIC sort, allocation rollback) and rotating faults for b-10; neither was started here.
