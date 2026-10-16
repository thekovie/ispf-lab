# b-03-jcl-anatomy — Reading a job: JOB, EXEC, DD, columns and continuation

Track / module:           B z/OS and batch / Batch jobs and SDSF (display position: after lesson 26)
Number and stable ID:     lesson 32, `b-03-jcl-anatomy` (never changes)
Audience and difficulty:  beginner
Lesson type:              hybrid (read, then diagnose and fix)
Prerequisites:            `b-02-dataset-types` (advice only). Leaves behind: member `{HLQ}.JCL(BROKEN)` (recreated on every start) and its jobs (cleared on start)
Estimated time:           20 minutes
Review status:            **draft** — an author check and a second-pass AI source examination (claim-level evidence in `../m3-evidence-matrix.md`; findings and resolutions in this spec's last section). **Not an independent review.** Independent source review, fidelity review and expert review are pending (authoring standards section 9). Hidden from learners by the draft gate (ADR 0018).

## Learning objectives
1. Recognise the three statement types of a simple job (JOB, EXEC, DD) and the five fields of a statement.
2. Say where a statement's fields go (columns 1-2 `//`, name from column 3) and why nothing is coded past column 71.
3. Recognise a missing continuation (a trailing comma) from the IEFC621I message and fix it.

## Terminology
Statement, identifier field, name field, operation field, operand (parameter) field, continuation, null statement, JOB, EXEC, DD.

## Conceptual explanation (original wording; sources in brackets)
- A JCL statement is one or more 80-byte records, like punched-card images, with up to five fields: identifier, name, operation, parameters and comments. [SRC-003 JCL Reference printed p.13]
- Columns 1-2 of a JCL statement hold `//`. A name starts in column 3 (1 to 8 characters, first one alphabetic or national) and is followed by a blank; the operation follows, then the parameters. [SRC-003 p.13-14]
- Do not code fields (apart from a comment) past column 71; columns 73-80 are ignored. [SRC-003 p.14-15]
- The JOB statement marks the start of a job and tells the system how to process it; an EXEC statement identifies the program (or procedure) a step runs and marks the beginning of each step; a DD statement describes a data set and the input and output resources a step needs. [SRC-003 p.389, p.313, p.75]
- To continue a statement, stop after a complete parameter including its comma, at or before column 71, and begin the next record with `//` and a blank in column 3. [SRC-003 p.16-17]
- A null statement (`//` alone) marks the end of a job. [SRC-003 p.459]
- IEFC621I EXPECTED CONTINUATION NOT RECEIVED: a comma ended the last operand on a line, but the next line was not a continuation. [SRC-019 IEFC621I, EV-B]

## Worked example
`HELLO` is `JOB` + `EXEC PGM=IEFBR14` + the null statement `//`. In `BROKEN`, the JOB statement ends with a comma, so the system waits for a continuation, finds `//STEP1 EXEC ...` instead, and stops: IEFC621I on statement 1.

## Guided activity
1. Open `{HLQ}.JCL(HELLO)` in Edit and read it: JOB, EXEC, null statement.
2. Type `COLS` to see the ruler: `//` in columns 1-2, names from column 3.
3. PF3 out. Submit `{HLQ}.JCL(BROKEN)` with `TSO SUBMIT JCL(BROKEN)`. The job ends with JCL ERROR.
4. In SDSF open the job's JESYSMSG. Read the statement number and IEFC621I.
5. Edit `BROKEN` and remove the trailing comma (or add a proper continuation record).
6. `SUBMIT` again: CC 0000. PF3 to save.

## Independent challenge
"Make `{HLQ}.JCL(BROKEN)` run to CC 0000." No steps shown. It must first have failed with a JCL error, its JESYSMSG must have been read, then a later run of the same job must end CC 0000. The log reading was added in the M3 hardening because the lesson teaches IEFC621I and the first Challenge never required reading it.

## Common mistakes
- Adding a continuation record that starts in column 1 or has no blank in column 3.
- Believing the job ran: a JCL error means no step executed.

## Expected results
JESYSMSG lists ` STMT NO. MESSAGE` with `1 IEFC621I EXPECTED CONTINUATION NOT RECEIVED`; JESMSGLG shows the job not run because of a JCL error.

## Simulator limitations (shown to the learner)
- The simulator accepts continued operands that begin in any column after column 3; IBM allows columns 4-16.
- Only the comma trigger of IEFC621I is modelled, not a nonblank character in column 72.
- The statement number printed is that of the JESJCL listing; comment and continuation records are not numbered.
- Not every JCL error message a real converter issues exists here; unknown keywords and misplaced statements use IEFC630I and IEFC019I.

## References
SRC-003 *MVS JCL Reference* SA23-1385-70: printed p.13-17 (statement fields, columns, continuation), p.75 (DD), p.313 (EXEC), p.389 (JOB), p.459 (null statement). SRC-019 MVS System Messages (IEFC621I) via evidence EV-B. Checked against the PDF text on 2026-10-15; printed page = PDF page minus 46.

## Validation design
- Events: `COLS_DISPLAYED`, `JCL_ERROR_GENERATED` (job `{HLQ}B`), `JOB_OUTPUT_OPENED` (JESYSMSG), `JOB_COMPLETED` (CC 0000). State: the edited text of BROKEN parses with no errors (the parser is the checker, not a regex).
- False positives considered: another job's JCL error (job name required); fixing by deleting the step (still runs; accepted because the objective is a job that runs); editing the wrong member (editor must be BROKEN); stale jobs (cleared on start).
- Alternatives accepted: comma removed, or a correct continuation record added; `SUBMIT` from the editor or `TSO SUBMIT` after saving.
- Challenge: JCL error for `{HLQ}B`, then a later CC 0000 for `{HLQ}B`, with no Edit session left open.

## Starting state and reset
`createMembers` BROKEN, `resetJobs`, `resetMembers` HELLO, screen Primary Option Menu. A restart restores BROKEN and asks first if the learner changed it.

## Second-pass examination: findings and resolutions (2026-10-16)
| Finding | Resolution |
|---|---|
| b-03-C21 (HIGH): `TSO SUBMIT JCL(BROKEN)` is not what real TSO resolves (CNTL qualifier) | the Submit step now says so |
| the lesson jobs omitted MSGCLASS but sent the learner to read output in SDSF | `MSGCLASS=X` added to BROKEN and to the learner-typed job in b-04 |
| "a job is JOB, EXEC and DD statements; a null statement ends it" over-general | reworded ("a simple job"; the null statement is optional) |
| "nothing past column 71" ignores comment statements and column 72 | reworded |
| a comma inside apostrophes is not a continuation | "a comma ending the last operand" |
| PF3 saves only with AUTOSAVE on | stated |
| which spool data set holds IEFC messages, and the `STMT NO. MESSAGE` header, are UNVERIFIED | lesson says "the job's messages / the simulator's layout"; flagged for the expert |
| simulator: stray text lines were numbered by record, not by listing; a `/*` with a comment was a data record | fixed with regression tests (`tests/jes/jes.test.ts`) |
