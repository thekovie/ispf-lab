# Curriculum roadmap (Phase 0, Deliverable 4)

Part of the [Phase 0 audit](phase-0-audit.md). Baseline commit `e97a91b`; 2026-10-14.

This is a **proposal for review**, not an approved plan. It was built after inspecting what the 28 existing lessons already teach, so subjects that appear inside existing lessons are not listed as missing. Every proposed lesson must pass the [authoring standards](lesson-authoring-standards.md) and be at `approved` status before it ships. Source references use the IDs in [verified-sources.md](verified-sources.md); where an entry says **source pending**, the IBM topic has not yet been read and the lesson cannot be written until it is.

## 1. Learning architecture

| Track | Name | Priority | Existing coverage | State |
|---|---|---|---|---|
| A | ISPF fundamentals | P0 (preserve and correct) | L1-L23 (modules 1-4, 6-9) | Keep; correct text and validators (see the [lessons audit](existing-lessons-audit.md)) |
| B | z/OS and batch fundamentals | P0 | L24-L28 (first job, SDSF status, job output, JCL error, Day-One) introduce submission and diagnosis; nothing teaches JCL construction, DISP, return codes, COND or abends | Main growth area |
| C | Mainframe operations | P1 | L25-L27 partly (SDSF status and output); no TSO/E command lesson beyond L3; no catalog, operational-safety or incident lesson | Build on corrected B |
| D | REXX and automation | P1 demand, P2 delivery | none (REXX appears only as seed members) | Needs a design decision first (see D, below) |
| E | Specialised operations | P2 | none | Mostly conceptual; sources pending |
| F | Advanced system programming | P3 | none | Conceptual orientation only |

Existing modules map to tracks as follows (no renumbering; stable IDs are retained):

| Existing module | Lessons | Track / module |
|---|---|---|
| Getting around | L1-L3 | A / Orientation |
| Data sets | L4-L6 | A / Data sets |
| The editor | L7-L11 | A / Editing |
| Managing members | L12-L13 | A / Libraries |
| Capstone | L14 | A / Capstone |
| Split screen | L15 | A / Navigation |
| Navigation mastery | L16-L17 | A / Navigation |
| Editor power tools | L18-L21 | A / Editing |
| Lists in depth | L22-L23 | A / Libraries |
| Batch jobs | L24-L28 | B / Submitting and diagnosing (bridge into Track B) and C / SDSF basics |

## 2. Proposed lessons

Conventions: **Type** = I interactive simulator exercise, C conceptual, D diagnostic interpretation, H hybrid. **Sim** = existing simulator support; "changes" cites the [gap matrix](simulator-gap-matrix.md) row. Objectives are measurable (see the standards). "Corrective" means a fix to an existing lesson is preferred over a new lesson; no duplicate is proposed.

### Track A: ISPF fundamentals (additions only where existing lessons are insufficient)

| ID | Module | Title | Type | Audience / difficulty | Prerequisites | Learning objectives | Core concepts and exercise (outcome) | Verified sources | Sim support / changes | Pri | Justification |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a-01-panel-fields-scroll | Orientation | Panel fields, Scroll and the command line | H | Beginner | L1 | Locate the Scroll field on a list or editor panel; set it to PAGE, HALF, CSR, DATA or a number; predict the effect of UP/DOWN | Replaces the false "option 0 default scroll amount" teaching in L3. Exercise: change Scroll, scroll a member, observe. Outcome: learner knows Scroll is a per-panel field | SRC-013 (function keys, panel format Scroll), SRC-014 (option 0 field list), EV-A §5 | Scroll field exists on panels; Settings exposes a default (disclose). No change required beyond GAP-05 text | P1 | Corrects a confirmed false statement and teaches the real mechanism |
| a-02-messages-help | Orientation | Short messages, long messages and HELP | H | Beginner | L1 | Distinguish short and long messages; use HELP twice to reach the tutorial; recognise pop-ups | Exercise: cause a message, press PF1, press PF1 again. Outcome: learner uses ISPF's own help path | SRC-013, SRC-014 (EV-A §5); ISPF message IDs need SRC-031 (**source pending**) | Long message shown only in the coach panel (GAP-06). Needs PF1-twice behaviour | P2 | Closes the pop-up and long-message deviation; blocked partly by SRC-031 |
| a-03-edit-profile-defaults | Editing | CAPS, NUMBER and the real default profile | D | Intermediate | L19 | Predict CAPS, NUMBER, STATS and BNDS from the data attributes; read the five `=PROF>` lines | Corrective companion to L18-L19. Exercise: read a profile display and explain each line | SRC-012 (EV-A §2) | Needs the five-line profile display (GAP-02); otherwise text only | P2 | Prevents re-teaching "CAPS OFF is the default" |

### Track B: z/OS and batch fundamentals (P0)

| ID | Module | Title | Type | Audience / difficulty | Prerequisites | Learning objectives | Core concepts and exercise (outcome) | Verified sources | Sim support / changes | Pri | Justification |
|---|---|---|---|---|---|---|---|---|---|---|---|
| b-01-zos-big-picture | Orientation | IBM Z, z/OS, TSO/E, ISPF, JES and SDSF: who does what | C | Beginner | none | Name the role of z/OS, TSO/E, ISPF, JES2 and SDSF; trace "edit, submit, view output" through them | Short conceptual lesson with a one-page diagram and a matching exercise. Outcome: a mental model before JCL | SRC-001 ch.4 (4.1-4.3), ch.6-7 (TOC read; chapter text **source pending** for address spaces) | None needed (static lesson, no terminal) | P0 | Foundation; avoids forcing a concept into a terminal task |
| b-02-dataset-types | Data sets | PS, PDS, PDSE and data set attributes | H | Beginner | L6 | Distinguish PS, PDS, PDSE by DSORG, directory blocks and DSNTYPE; choose RECFM and LRECL for source and JCL | Allocate a PS and a PDS, compare in 3.4/LISTDS; read DSORG. Outcome: learner can justify attributes | SRC-014 (EV-A §6: directory blocks, LIBRARY type), SRC-001 ch.5.8-5.9 (TOC read), SRC-015 LISTDS | 3.2 allocate and 3.4 exist; PDSE not distinguished (GAP-11) | P0 | Existing L5-L6 mention but do not explain; fixes the "dir blocks make a PDS" wording |
| b-03-jcl-anatomy | JCL | JOB, EXEC and DD: reading a job | H | Beginner | b-02 | Identify the JOB, EXEC and DD statements; explain columns 1-71, continuation and the null statement | Read the HELLO job; mark each statement; fix a continuation error. Outcome: learner can read any simple job | SRC-003 (EV-B §1.4), SRC-018 | Parser supports JOB/EXEC/DD; needs GAP-37 (numbering) and GAP-38 (trailing `/*`) | P0 | The audit found no lesson teaches JCL structure |
| b-04-build-a-job | JCL | Build a job from scratch | I | Beginner | b-03 | Write a valid JOB/EXEC PGM=IEFBR14/DD that allocates a data set, then submit and verify | Create `{HLQ}.CNTL(NEWDS)`; submit; confirm in 3.4. Outcome: first independently written job | SRC-003 DISP (EV-B §1.1), SRC-025 IEFBR14/JCL UG | Supported; add GAP-33 (accept valid DD keywords) | P0 | Brief requires "constructing a job from scratch" |
| b-05-disp | JCL | Data set disposition: NEW, OLD, SHR, MOD and what happens afterwards | I | Intermediate | b-04 | Predict the data set's fate for each DISP combination; correct a job that deletes its output | Run four jobs, compare IEF285I outcomes. Outcome: learner can choose DISP deliberately | SRC-003 (EV-B §1.1), SRC-019 IEF285I (EV-B §2.2) | Needs GAP-36 (MOD append and not-found, PASS, UNCATLG, rollback) | P0 | DISP is untaught today and the simulator is wrong for MOD |
| b-06-multistep-rc | JCL | Multi-step jobs and return codes | I | Intermediate | b-05 | Read IEF142I per step; explain that a nonzero RC does not stop the job | Copy a member with IEBGENER, then a second step; compare condition codes. Outcome: RC vs abend understood | SRC-019 IEF142I (EV-B §2.2), SRC-025 (EV-B §5) | Supported; IEBGENER DCB inheritance and message text unverified (GAP-46) | P0 | Return codes are a stated P0 subject |
| b-07-cond-if | JCL | Conditional execution with COND and IF/THEN/ELSE | I | Intermediate | b-06 | Predict which steps run for given return codes; write an IF/THEN and an equivalent COND | Two jobs, vary a step's RC, observe bypassed steps. Outcome: both mechanisms understood | SRC-003 COND/IF (EV-B §1.2) | **Requires** GAP-30 and GAP-31 | P0 | Brief P0; simulator currently ignores COND |
| b-08-abends | JCL | Abends and system completion codes | D | Intermediate | b-06 | Distinguish RC from abend; interpret S806, S0C7, SB37; state the first diagnostic step | Read three prepared job logs, answer, then fix a job (wrong program name). Outcome: abend triage routine | SRC-020 (EV-B §3), SRC-019 CSV003I/IEA995I/IEC030I | Only S806 exists. **Requires** GAP-41 (scripted S0C7, SB37 outcomes) | P0 | Brief P0 |
| b-09-instream-utilities | JCL | In-stream data and the common utilities | I | Intermediate | b-06 | Use DD * for SYSIN; run SORT and IDCAMS LISTCAT; interpret SYSPRINT | SORT a member by a key; list catalog entries. Outcome: utilities as building blocks | SRC-027 (EV-B §5), SRC-026, SRC-025 | SORT collation wrong (GAP-45); LISTCAT layout (GAP-46); DD DATA (GAP-34) | P1 | Common beginner tasks; needs fidelity fixes first |
| b-10-job-troubleshooting | JCL | Batch troubleshooting capstone | D | Intermediate | b-05, b-08 | Locate the failure in a job log; classify it (JCL error, allocation failure, program abend, bad RC); propose and apply a fix | Three scenarios (misspelt keyword, missing data set, wrong DISP) with rotating faults. Outcome: structured diagnosis | SRC-019 IEFC/IEF messages (EV-B §2), SRC-018 | Needs GAP-42 (real message IDs) and independent fault seeds | P0 | Brief P0; replaces the single Day-One scenario as the capstone and corrects it (GAP-10) |
| b-11-procs-jcllib | JCL | Cataloged procedures and JCLLIB | I | Intermediate | b-10 | Call a PROC, override a DD, explain symbolics | Use a seeded PROC | SRC-003 (**source pending**: PROC topics not read) | **Requires** GAP-32 (PROC/PEND/SET/JCLLIB) | P2 | Real jobs use PROCs; defer until the parser supports them |

**Corrective, not new:** L24-L28 are corrected in place (SUBMIT wording, `SJ`/`SE`/`X` behaviour, IEF212I wording, Day-One scenario). The "reading job output" subject is covered by L26 once corrected; no second lesson is proposed.

### Track C: Mainframe operations (P1)

| ID | Module | Title | Type | Audience / difficulty | Prerequisites | Learning objectives | Core concepts and exercise (outcome) | Verified sources | Sim support / changes | Pri | Justification |
|---|---|---|---|---|---|---|---|---|---|---|---|
| c-01-tso-commands | TSO/E | Core TSO/E commands and data set naming | I | Beginner | L3 | Use LISTDS, LISTCAT, DELETE, RENAME, SUBMIT; predict prefixing with and without quotes | Run each command with quoted and unquoted names. Outcome: learner avoids wrong-data-set mistakes | SRC-015, SRC-017 (EV-A §7), SRC-016 messages | **Requires** GAP-20 (qualification) and GAP-23 (message text) | P1 | Corrects L3 and the prefix behaviour |
| c-02-job-lifecycle | JES | The job lifecycle in JES2 | C | Beginner | b-01 | Order the phases (input, conversion, execution, output, purge); map each to SDSF queue names | Diagram plus sequencing exercise. Outcome: learner knows where a job "is" | SRC-021 (EV-B §4), SRC-023 queue/phase table (EV-C Part 2) | Simulator jobs complete synchronously (GAP-44); lesson is conceptual | P1 | Needed before any SDSF operations lesson |
| c-03-sdsf-filters | SDSF | Finding your jobs: PREFIX, OWNER, FILTER and SORT | I | Beginner | L25 | Predict what `PREFIX ABC` vs `PREFIX ABC*` shows; use OWNER and SORT | Submit three jobs, filter. Outcome: correct filter use | SRC-023 (EV-C Part 2 d) | **Requires** GAP-51; FILTER/ARRANGE not implemented (GAP-54) | P1 | Corrects a confirmed matching-rule defect |
| c-04-sdsf-job-control | SDSF | Cancel, hold, release and purge | I | Intermediate | c-02, c-03 | Choose the right action character for a runaway or held job; state what purge removes | Scripted held and looping jobs. Outcome: safe job control | SRC-023 actions table (EV-C Part 2 c) | **Requires** GAP-44 (job states) and GAP-54 (C/A/H) | P2 | Operational skill but needs queue-state modelling |
| c-05-messages-interpretation | Operations | Reading system messages | D | Intermediate | b-06 | Look up an IEF/IEC/IDC message by ID in the messages book; extract source, meaning and response | Given five messages, find and apply the documented response. Outcome: self-service diagnosis | SRC-008, SRC-019 | Static; no simulator change | P1 | Teaches the lookup habit rather than memorising texts |
| c-06-catalog-storage | Storage | Catalogs, uncataloged data sets and space | H | Intermediate | b-02 | Explain catalog vs VTOC; diagnose "not found" vs "not cataloged"; recognise SB37/SD37 | LISTCAT, DELETE, recatalog scenario | SRC-001 ch.5.11 (TOC), SRC-026 (EV-B §5), SRC-020 | **Requires** GAP-10 (cataloged flag) and GAP-41 (space abends) | P2 | Fixes the mislabelled Day-One scenario honestly |
| c-07-operational-safety | Operations | Destructive operations and safe habits | C | Beginner | L12-L13 | List the checks before DELETE/RENAME/overwrite; explain read-only and RACF's role | Case-based questions on the simulator's confirm panels; RACF disclosed as out of scope | SRC-014 (3.3 note, EV-A §6); RACF topics **source pending** (SRC-010 landing only) | Confirm panels exist; checkbox ignored (GAP-14) | P2 | Brief lists operational safety; honest about RACF |
| c-08-incident-investigation | Operations | Incident investigation | D | Intermediate | b-10, c-05 | Reconstruct a failed nightly job from JESMSGLG, JESYSMSG and the catalog; write a three-line incident note | Multi-evidence scenario | SRC-019, SRC-023 | Needs the fidelity fixes above | P2 | Integrates B and C |

### Track D: REXX and automation (P1 demand; delivery staged)

Decision needed before any D lesson: the simulator has no REXX interpreter. The proposal is to deliver the first four lessons as **diagnostic reading** exercises ("predict the output") that need no interpreter, and to decide on a minimal interpreter only if learners need to run code. All D sources are **pending**: SRC-006 and SRC-029 were verified as landing pages only.

| ID | Title | Type | Difficulty | Prerequisites | Objectives | Concepts / exercise | Sources | Sim support / changes | Pri | Justification |
|---|---|---|---|---|---|---|---|---|---|---|
| d-01-rexx-variables | Variables, expressions and SAY | D | Beginner | L12 | Predict the output of five short programs | Variables, `SAY`, concatenation, arithmetic | **source pending** (SRC-006 chapters) | Static; no interpreter | P2 | Gateway to automation |
| d-02-rexx-control-flow | IF, DO and SELECT | D | Beginner | d-01 | Trace loops and branches | Conditionals and loop forms | **source pending** | Static | P2 | |
| d-03-rexx-parse-strings | PARSE and string functions | D | Intermediate | d-02 | Extract fields from a record with PARSE | PARSE, SUBSTR, WORD | **source pending** | Static | P2 | |
| d-04-rexx-tso | Calling TSO/E commands from REXX | D | Intermediate | d-03, c-01 | Predict `ADDRESS TSO` results and RC | ADDRESS, command RC | **source pending** | Static | P2 | |

### Track E: Specialised operations (P2)

All entries are conceptual or diagnostic and **source pending** unless stated. No simulator changes are proposed.

| ID | Title | Type | Difficulty | Prerequisites | Objectives | Sources | Pri | Justification |
|---|---|---|---|---|---|---|---|---|
| e-01-started-tasks | Started tasks and the operator console | C | Intermediate | c-02 | Distinguish batch jobs, TSO sessions and started tasks | SRC-030 (JES2 commands, cover only) **pending** | P2 | Operations context |
| e-02-comm-server-basics | Communications Server and TCP/IP fundamentals | C | Intermediate | b-01 | Name the TCP/IP stack's role; read a Netstat-style display | SRC-009 landing; diagnostic-command references **pending** | P2 | Brief lists Communications Server |
| e-03-racf-basics | RACF: users, groups, profiles and access | C | Intermediate | c-07 | Explain how a data set access decision is made | SRC-010 landing; topics **pending** | P2 | Needed to explain S913 and safety |
| e-04-uss-oedit | z/OS UNIX files from ISPF | H | Intermediate | L14 | Open a UNIX file with OEDIT and explain mode and one-session-per-file | SRC-011 (verified topic) | P2 | Only verified topic in this track |
| e-05-vsam-idcams | VSAM and IDCAMS DEFINE/REPRO | H | Intermediate | b-09 | Define a KSDS, load it, list it | SRC-026 (partial); DEFINE/REPRO topics **pending** | P2 | Common in production; needs IDCAMS expansion |
| e-06-hsm-storage | Storage management and HSM | C | Advanced | c-06 | Describe migrate and recall | **pending** | P3 | Orientation only |

### Track F: Advanced system programming (P3)

Conceptual orientation lessons only; no simulator work; all sources **pending**. Candidates: f-01 Assembler overview, f-02 SMP/E concepts, f-03 WLM service classes, f-04 Parallel Sysplex concepts, f-05 CICS and Db2 orientation. They are listed so the architecture is complete; none should be scheduled before Track B and C are approved.

## 3. Overlap check (no duplicates)

| Candidate | Decision |
|---|---|
| "Reading job output" | Covered by corrected L26; not a new lesson |
| "Debugging a JCL error" | L27 corrected; b-10 extends it with allocation failures and abends; no overlap in outcome |
| "TSO SUBMIT" | Appears in L24 and c-01; c-01 owns the naming/prefix outcome, L24 the submit-and-observe outcome |
| "SDSF basics" | L25 owns panels; c-03 owns filtering; c-04 owns job control |
| Data sets (L5-L6) vs b-02 | b-02 adds types and attributes; L5-L6 keep navigation and allocation |

## 4. Sequencing and dependencies

1. Corrections and assessment fixes to existing lessons (milestone M1) precede new content, so new lessons are built on a trustworthy runner.
2. Lesson metadata (`requires`, `difficulty`, `sources`) and per-lesson challenge baselines (M2) precede Track B.
3. Track B order: b-01 → b-02 → b-03 → b-04 → b-05 → b-06 → b-10; b-07 and b-08 follow the simulator work in GAP-30/31/41; b-09 follows GAP-45.
4. Track C starts with c-01 and c-05 (low simulator cost), then c-03, then c-02.
5. Track D waits for the interpreter decision; Tracks E and F wait for verified sources.
