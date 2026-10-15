# ISPF Lab: Phase 0 audit (Deliverable 1, entry point)

**Repository baseline:** `thekovie/ispf-lab`, branch `main`, commit **`e97a91b842cc1c525c9694adf3533695bf57f82c`** (working tree clean at the start; `docs/curriculum/` is the only change).
**Audit dates:** 2026-10-14 to 2026-10-15. **Stage:** Phase 0 (research, audit, verification). **Code changes:** none in `src/`, `tests/` or configuration.
**Target IBM release for verification:** z/OS 3.2 (PDF editions); older releases noted where used.

> The audit stops here. Phase 1 is **not** started. Everything in the roadmaps is a proposal awaiting review.

## Document index

| # | Document | Purpose |
|---|---|---|
| 1 | **phase-0-audit.md** (this file) | Executive report and index |
| 2 | [existing-lessons-audit.md](existing-lessons-audit.md) | Individual review of all 28 lessons, 13 fields each |
| 3 | [verified-sources.md](verified-sources.md) | Source registry (SRC-001 to SRC-031), claim-level findings index, link vetting, gaps |
| 4 | [curriculum-roadmap.md](curriculum-roadmap.md) | Proposed tracks, modules and lessons |
| 5 | [simulator-gap-matrix.md](simulator-gap-matrix.md) | Traceable capability and fidelity matrix (64 rows, IDs GAP-01 to GAP-78) and resolution of the 8 known concerns |
| 6 | [implementation-roadmap.md](implementation-roadmap.md) | Milestones M0 to M7, platform recommendations |
| 7 | [lesson-authoring-standards.md](lesson-authoring-standards.md) | Template, evidence, objective, exercise, challenge, validation, fidelity and approval standards |
| R | [m0-acceptance-review.md](m0-acceptance-review.md) | Independent M0 acceptance review (verdict: conditionally accepted) and corrections C1-C6 |
| M1a | [m1a-report.md](m1a-report.md) | M1a report: assessment integrity and isolation (implemented, awaiting review) |
| — | [evidence/](evidence/) | Raw claim-level IBM evidence (EV-A, EV-B, EV-C) and the runner probe scripts (`probes/`) |

## 1. Scope and methodology

- **Inspected:** the lesson registry (28 lessons, 10 modules, 137 steps), the tutorial engine, validators and glossary, `TutorialProvider`, the ISPF engine (`src/engine`, `src/editor`, `src/catalog`, `src/parsers`), the virtual JES, JCL parser and SDSF (`src/jes`, `src/engine/screens/sdsf.ts`), persistence (`src/persistence`), state, components, the 15 test files, and the project documentation and ADRs.
- **Method:** three code-exploration passes, then IBM verification in three parallel streams (ISPF and TSO/E; JCL, JES and messages; SDSF and the registry), then three lesson-audit passes (L1-14, L15-21, L22-28) that re-read each lesson against the evidence. Runner behaviour was **probed** with throwaway Vitest scripts outside the repo (preserved as text under `evidence/probes/`). The coordinator spot-checked the highest-impact claims directly in the code (Challenge fallback, L28 objective vs validator, `SJ`/`SE`/`X`, the glossary `SUBMIT` sentence, `IEFC606I`, `ICE026A`, COND).
- **Runtime evidence:** `pnpm install --frozen-lockfile` was needed (the checkout had no `node_modules`; ignored by git). `pnpm check` then passed: typecheck clean, lint clean, **15 test files, 231 tests**. Passing tests establish internal consistency only.
- **IBM sources:** IBM Docs landing pages via fetch; z/OS 3.2 PDF editions downloaded and text-extracted for topic-level reading; per-topic HTML for Edit `SUBMIT` (3.2 and 2.5) and the JCL Reference (3.1). Citations are book, doc number, release and printed page (about ±1 page).
- **Not available or not done** (reported honestly): per-topic HTML deep links for most z/OS 3.2 topics (the topic-slug pages return index summaries; the SDSF HTML TOC returned 404); the SHARE lab URL is unresolved; no live z/OS system was available to confirm silent-documentation items; the ISPF Messages and Codes book, REXX, Communications Server diagnostics and RACF topics were not read; the coordinator did not independently re-derive every line of the three lesson reports (spot-checks only).

## 2. Existing course coverage

28 lessons in 10 modules: Getting around (L1-3), Data sets (L4-6), The editor (L7-11), Managing members (L12-13), Capstone (L14), Split screen (L15), Navigation mastery (L16-17), Editor power tools (L18-21), Lists in depth (L22-23), Batch jobs (L24-28). Coverage is **strong for ISPF fundamentals** (navigation, data sets, Browse/Edit, line and primary commands, profiles, UNDO, split screen, member lists) and **thin for everything batch**: five lessons cover submitting a job, SDSF status, output data sets, a JCL error and a capstone. **No lesson teaches** how to write JCL, DISP, return codes as a concept, COND/IF, abends, or TSO/E beyond a single lesson. REXX appears only as seed members.

## 3. Audit status counts

| Status | Lessons |
|---|---|
| VERIFIED | 0 |
| VERIFIED WITH LIMITATIONS | 0 |
| **CORRECTION REQUIRED** | **28** |
| INSUFFICIENT EVIDENCE | 0 |
| REVIEW NOT COMPLETED | 0 |

This is a strict result and needs the right reading. **27 of 28** lessons contain at least one statement or simulator behaviour that IBM documentation contradicts, does not support, or that the simulator misrepresents (lesson 21's content is IBM-consistent; its defects are validation-only). **18 of 28** have a Challenge mode that completes with three or fewer unrelated actions from a fresh start (7 with no learner action at all: L2, 3, 13, 15, 18, 21, 24), reproduced independently in the [M0 acceptance review](m0-acceptance-review.md); 4 more (L6, L8, L14, L28) depend on leftover state; 6 could not be shortcut (L1, 4, 11, 12, 26, 27). The cause is that only L14 and L28 define their own `challenge`. *(The first version of this report said "at least 25 of 28"; M0 review condition C1 corrected it.)* The underlying lesson design, step flow, glossary and most commands are sound and many specific behaviours were confirmed correct. A per-lesson table with defect counts and the top issue is in [existing-lessons-audit.md](existing-lessons-audit.md) section 2.

## 4. Critical findings

Ordered by consequence. Each has evidence in the linked documents.

1. **Challenge mode does not assess many lessons (P0).** `src/tutorial/engine.ts:41-45` evaluates the last step's validator after every dispatch. **Independently reproduced:** 7 lessons complete with no action, 11 more with two or three cheap actions (total 18); 4 depend on leftover state, and `setMode` keeps data so Learn → Challenge can finish immediately (code-read; L28 and L8/L14 not re-run in the review). (GAP-60, GAP-61; M0 review F-01)
2. **Replay dead ends and hidden state coupling (P0).** L6 cannot be replayed (`DATA SET ALREADY EXISTS`); L12 and L13 leave data behind; L9 saves a broken JOB card that L25 never resets; no lesson resets edit profiles; six lessons start with an empty panel stack. (GAP-62, GAP-72, GAP-73)
3. **False statement about Edit `SUBMIT` (P1 after M0 review; was P0/P1).** The glossary, code comment, `docs/10` and ADR 0012 say real ISPF submits the on-disk data set and call the buffer behaviour a deviation. IBM's Edit page says it submits "the member or data set you are editing"; the on-disk wording exists only for **Browse** SUBMIT. The simulator behaviour is consistent with IBM; the justification is wrong. Whether unsaved edits are included is not stated by IBM and needs expert confirmation. (GAP-01)
4. **`SJ` write-back is wrong (P1 after M0 review; was P0).** L27 and L28 teach "SJ, fix, PF3 saves the member". IBM says SJ edits the JCL held by JES and "changes you make to the data are not saved"; `SE` edits output data sets and `X` is Print. The simulator's `SJ` and `SE` share one branch and open the **current catalog member**. The Day-One challenge validator depends on the write-back. (GAP-50)
5. **Non-existent or inexact message IDs in job output (P1 for `IEF374I` and the lesson wording; P2 for `IEFC606I` and `ICE026A`, which only appear on error paths no lesson walks; was P0/P1).** `IEFC606I` and `ICE026A` do not exist in z/OS 3.2; `IEF374I` carries a fabricated `RC=`; `IEF237I` prints `JES2` for DUMMY; `IEB351I` is used as "not found"; `ICE000I` has the wrong product number; JESMSGLG lines lack time and job id. Lesson text says "IEF212I names the data set"; it names job, step and DD. (GAP-42)
6. **Statements taught as fact that IBM contradicts (P1).** Pop-ups (L1), typed `3.4` PF3 count (L2), option 0 scroll (L3), Browse line numbers (L7), MODIFIED flag (L8), CAPS default, BNDS and `=PROF>` layout, RECOVERY/UNDO wording, "no undo" (L18-L20), S vs I, STATS OFF and per-save mod level (L22-L23), `SD`/`M.5` and OWNER default (L25).
7. **JCL realism gaps (P1).** `COND` is parsed and never evaluated (IBM evaluates it); `IF/THEN/ELSE` is rejected as invalid JCL; `DISP=MOD` on a missing data set errors (IBM: treated as new) and MOD replaces rather than appends; PASS/UNCATLG unmodelled; a missing procedure is a mid-run error rather than a conversion error; only five programs and one abend (`S806`) exist; SORT uses ASCII collation (IBM: EBCDIC).
8. **Tests encode these defects (P1).** For example `tests/tutorial/lessons.test.ts:64-68` (two PF3s after `3.4`), `tests/engine/sdsf.test.ts:56-71` (SJ write-back), `:8-9` (buffer-SUBMIT premise), `lessons.test.ts:371-380` (state-only L28 Challenge).
9. **Progress is global per browser** while catalog, profiles and JES are per userid; Import overwrites it. (GAP-63)
10. **Refuted suspicions (do not "fix"):** top-level `RECFM`/`LRECL`/`BLKSIZE`/`DSORG` on a DD is valid IBM syntax; DISP defaults match IBM; `S806-04` with `CSV003I` and `IKJ56250I` are correct; `X` on the option line ending a split screen is correct; `;` stacking, `=` jump, RETURN and RETRIEVE match IBM.

## 5. Source verification summary

- **SRC-001 to SRC-011:** all 11 resolve to the intended material (landing level). Seventeen further IBM books were identified and read at topic level (SRC-012 to SRC-028, with doc numbers), plus candidates (SRC-029 to SRC-031) not yet read. Details and page-level citations: [verified-sources.md](verified-sources.md).
- **Topic-level evidence** covers ISPF Edit and Browse, User's Guide, utilities 3.x, TSO/E commands and messages, JCL (DISP, COND, IF, DD, in-stream data, null statement), system, JES2 and DFSORT messages, system codes, IEFBR14, IEBGENER, DFSORT, IDCAMS and the SDSF User's Guide.
- **Unresolved or unverified:** per-topic HTML deep links; ISPF message texts (SC19-3622-70 unread); IEBGENER SYSPRINT text; whether Edit SUBMIT requires a prior SAVE; the default `CNTL` qualifier for TSO SUBMIT; whether JCL-error jobs appear on SDSF O/H; SAVE of an empty new member; REXX, Communications Server diagnostics, RACF and JES2 command topics (landing only).
- **The repo's own links:** the ISPF User's Guide link is pinned to 3.1 (3.2 exists, and option 0, 3.x and Browse are in **Volume II**); the "Edit and Edit Macros" link is a z/OS 1.8 (2006) copy on a university host; the SHARE lab URL does not resolve; `docs/08` and `resources.ts` have drifted by one link.

## 6. Curriculum gaps

Full proposals with prerequisites, objectives, sources and exercise types are in [curriculum-roadmap.md](curriculum-roadmap.md).

| Track | Priority | Finding |
|---|---|---|
| A ISPF fundamentals | P0 preserve | Correct the 23 lessons; add three small lessons only where existing ones are insufficient (panel fields and Scroll, messages and HELP, real default profile) |
| B z/OS and batch | P0 | Main gap. Eleven proposed lessons: z/OS overview, data set types, JCL anatomy, build a job, DISP, multi-step and return codes, COND/IF, abends, in-stream data and utilities, troubleshooting capstone, procs. Several need simulator work first |
| C Operations | P1 | TSO/E commands, job lifecycle (conceptual), SDSF filtering and job control, messages interpretation, catalog and storage, operational safety, incident investigation |
| D REXX | P1 demand, P2 delivery | No interpreter exists; propose reading ("predict the output") lessons first; sources pending |
| E Specialised | P2 | Only z/OS UNIX editing (SRC-011) has a verified topic; the rest are conceptual and source-pending |
| F Advanced | P3 | Orientation only; sources pending |

Existing subjects were checked before declaring gaps: for example "reading job output" is covered by L26 once corrected, and "debugging a JCL error" by L27, so no duplicate lessons are proposed.

## 7. Simulator fidelity concerns

Summarised from the [gap matrix](simulator-gap-matrix.md) (64 rows). The eight known concerns from the brief resolved as: (1) L28 output inspection **confirmed**; (2) DISP defaults **partial** (defaults right, MOD/PASS/UNCATLG and allocation leak wrong); (3) COND parsed not executed **confirmed**; (4) unsaved-buffer SUBMIT **partial with a documentation defect**; (5) scenario isolation **confirmed**; (6) global progress **confirmed**; (7) oversimplified outputs **confirmed**; (8) tests prove consistency not fidelity **confirmed**.

## 8. Prioritised recommendations

Detailed in [implementation-roadmap.md](implementation-roadmap.md). In order:

1. **M0 review gate** and expert confirmation of the open items (Edit SUBMIT unsaved changes, SDSF SJ/SE, JESMSGLG layout).
2. **M1 corrections, split after the M0 review.** **M1a (assessment integrity and isolation):** a Challenge completion guard, outcome-based Challenge validators, scenario reset, mode-switch reset, the `startLesson` race test, probes converted to asserting tests. **M1b (content and fidelity):** the SUBMIT and SJ wording, message IDs, contradicted lesson statements, listed validators, stale counts. See [implementation-roadmap.md](implementation-roadmap.md) section 3.
3. **M2 infrastructure:** lesson metadata (`requires`, `difficulty`, `sources`, `reviewStatus`), source registry in code, CI, link fixes, progress-identity decision.
4. **M3 first Track B batch** (`b-01` to `b-06`, `b-10`, `a-01`) on the corrected runner.
5. **M4+** simulator extensions only when an approved lesson needs them; platform items (prerequisites view, accessibility, read-only theory access); Track C and D; selective E/F.

Explicitly not recommended: accounts, cloud sync, AI tutor, full emulation, more ISPF panels for their own sake.

## 9. Unresolved questions for review

1. Does real ISPF Edit `SUBMIT` include unsaved changes without a prior SAVE? (IBM's page is silent; expert or live check.)
2. Should progress be per userid or per browser? (ADR needed.)
3. Should the catalog gain a "cataloged" flag, or should the Day-One scenario be reworded to "does not exist"?
4. Is a minimal REXX interpreter justified, or do reading exercises suffice?
5. Do JCL-error jobs appear on SDSF `O` or `H` (MSGCLASS-dependent)?
6. Does `SJ` on a job submitted from an unsaved buffer show the submitted JCL? (IBM: "the JCL held by JES"; the simulator shows the saved member.)
7. Which ISPF messages should gain IDs, and who reads SC19-3622-70?
8. Is the TSO descriptive-qualifier behaviour for unquoted names worth modelling, given IBM does not document `CNTL` as a default for SUBMIT?

## 10. Phase 0 completion status

**Verdict: Phase 0 meets its acceptance criteria, with the disclosed limits below.** The independent [M0 acceptance review](m0-acceptance-review.md) (2026-10-15) reached **CONDITIONALLY ACCEPTED**; conditions C1-C6 are closed by the corrections recorded in this file, `existing-lessons-audit.md`, `simulator-gap-matrix.md` and `implementation-roadmap.md`. Only **M1a** is authorised; M1b and later require a further review.

| Acceptance criterion | Status | Note |
|---|---|---|
| Repository and lesson registry inspected | Met | 28 lessons, 10 modules, 137 steps |
| Every existing lesson individually audited | Met | All 28, 13 fields each |
| Material findings have supporting evidence | Met | EV-A/B/C rows, code references, probes. Items marked "code-read" were not reproduced at runtime |
| Authoritative IBM references identified | Met | SRC-001 to SRC-031 |
| URLs and sections verified where technically possible | **Partly met** | Landing pages and PDF pages verified; HTML per-topic deep links mostly not obtainable |
| Unverifiable claims and inaccessible sources flagged | Met | verified-sources §6, audit Appendix B |
| Missing subjects assessed for educational value | Met | Tracks A to F |
| Proposed courses have measurable objectives | Met for A, B, C; **lighter for D, E, F** (sources pending) | |
| New lessons have source mappings and prerequisites | Met for A, B, C; **D, E, F marked "source pending"** | |
| Simulator capabilities cross-referenced | Met | 64 gap rows |
| Material simulation inaccuracies documented | Met | |
| Platform recommendations distinguish existing from gaps | Met | implementation-roadmap §9 |
| All recommendations have priority and justification | Met | |
| Dependencies and affected modules identified | Met | |
| Authoring and quality requirements documented | Met | |
| Implementation roadmap ready for review | Met | |
| No major feature or simulator implementation performed | Met | Only `docs/curriculum/**`, the project-log entry and a changelog line were added. `node_modules` was installed from the frozen lockfile (untracked) to run the tests |

Residual risks before implementation: expert confirmation of the silent-documentation items; reading the ISPF Messages and Codes book; the coordinator's spot-check (not full re-derivation) of the three lesson reports; and the 3.2 HTML deep links.

## 11. Confidence of findings (added after the M0 review)

The audit mixes three kinds of evidence. Use this table to tell them apart.

| Class | Meaning | Findings |
|---|---|---|
| **Independently reproduced** | Re-checked by the M0 reviewer against primary IBM text and/or by running code | Edit `SUBMIT` wording; `IEFC606I` and `ICE026A` do not exist; `IEF374I` has no `RC=`; `IEF212I` names job/step/DD; `$HASP395` forms; SDSF `SJ` "not saved", `SE`/`X` meanings, `PREFIX`/`OWNER` exact match; `DISP=MOD`, `COND`, `DD DATA` rules; pop-up setting, "bypass the second menu", 8/32 split screens, STATS and modification-level rules; Browse drawn with line numbers; Challenge completes with no action in L2, 3, 13, 15, 18, 21, 24; with a few actions in L5, 7, 9, 10, 16, 17, 19, 20, 22, 23, 25; L6 replay dead end; L28 alternate repair rejected; L27 completes with zero jobs; tests that lock in defects; progress key is global |
| **Code-read, not executed** | Established from reading source; plausible and consistent with the evidence, not reproduced at runtime by the reviewer | `setMode` leaving Challenge completable on leftover state for L8/L14/L28; profile leakage between lessons; missing resets in L12/L13/L25; empty-stack lesson starts (L5, 7-10, 12); allocation leak on a failed second DD; most per-lesson details not named above |
| **Unverified hypothesis** *(resolved in M1a: reproduced by a provider-level test, RED on the baseline, fixed)* | Not established at Phase 0 | **`startLesson` event race:** `TutorialProvider.startLesson` dispatches `LOAD_CATALOG`/`LOAD_JES`/`GOTO` before it sets the new lesson and runner, and every dispatch notifies the listener that still holds the previous lesson, runner and mode. The previous lesson might be marked completed. Needs a provider-level test (first task of M1a) |
| **Unresolved: IBM silent** | Documentation does not say | Whether Edit `SUBMIT` includes unsaved edits; whether `SJ` leaves the PDS member untouched; O/H visibility of JCL-error jobs; the PF3 count after a typed `3.4`; IEBGENER SYSPRINT text; default `CNTL` qualifier; SAVE of an empty new member; ISPF message texts (SC19-3622 unread) |

**Withdrawn or softened by the M0 review:** the L14 `finalCheck` placement finding (the lesson objective discloses "anywhere in the member is accepted"; now P3), and the L16 "`=option` is RETURN followed by the option" finding (a simplification, not a contradiction; P2).
