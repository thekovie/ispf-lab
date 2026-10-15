# b-04-build-a-job — Build a job from scratch

Track / module:           B z/OS and batch / Batch jobs and SDSF (display position: after b-03)
Number and stable ID:     lesson 33, `b-04-build-a-job` (never changes)
Audience and difficulty:  beginner
Lesson type:              interactive
Prerequisites:            `b-03-jcl-anatomy` (advice only). Leaves behind: member `{HLQ}.JCL(NEWDS)` and data set `{HLQ}.BUILD.DATA`; both removed on every start
Estimated time:           25 minutes
Review status:            **draft** — an author check and a second-pass AI source examination (claim-level evidence in `../m3-evidence-matrix.md`; findings and resolutions in this spec's last section). **Not an independent review.** Independent source review, fidelity review and expert review are pending (authoring standards section 9). Hidden from learners by the draft gate (ADR 0018).

## Learning objectives
1. Write a valid JOB, EXEC PGM=IEFBR14 and DD statement without a template.
2. Say what DSN, DISP, SPACE, UNIT and DCB tell the system when a DD creates a data set.
3. Submit the job, confirm CC 0000, and confirm the new data set in the data set list.

## Terminology
IEFBR14, DSN, DISP, SPACE, UNIT, DCB, RECFM, LRECL, BLKSIZE.

## Conceptual explanation (original wording; sources in brackets)
- DSNAME (DSN) names the data set: for a new data set the name is assigned to it, for an existing one the system uses it to find it. [SRC-003 printed p.164]
- DISP gives the data set's status to the system and says what to do with it after the step or job ends, normally and abnormally. If status is omitted it is NEW. [SRC-003 p.147-148, defaults p.153]
- SPACE requests space for a new data set on a direct access volume. UNIT asks for a device or a group of devices. [SRC-003 p.251, p.278]
- DCB completes data set information such as record format and length when the program does not supply it. [SRC-003 p.126]
- IEFBR14 is a program that does not actually process any data, so a job that runs it exists for the allocation and disposition work the system does around the step. [SRC-018 JCL User's Guide, PDF p.32-33]

## Worked example
```
//USER01N  JOB (ACCT),'NEW DATA SET',CLASS=A
//STEP1    EXEC PGM=IEFBR14
//NEWDD    DD  DSN=USER01.BUILD.DATA,DISP=(NEW,CATLG,DELETE),
//             SPACE=(TRK,(1,1)),UNIT=SYSDA,
//             DCB=(RECFM=FB,LRECL=80,BLKSIZE=27920)
//
```
The data set is created when the step is allocated; CATLG keeps it and records it in the catalog (on SMS-managed disk the catalog entry is made at allocation, SRC-018 p.116); DELETE would remove it if the step ended abnormally.

## Guided activity
1. Open the new member `{HLQ}.JCL(NEWDS)` in Edit (it is empty).
2. Type the JOB statement with job name `{HLQ}N`.
3. Add `//STEP1    EXEC PGM=IEFBR14`.
4. Add a DD for `{HLQ}.BUILD.DATA` with DISP=(NEW,CATLG,DELETE), SPACE, and FB 80 (continue across records where needed).
5. End the job with the null statement `//`.
6. SUBMIT: CC 0000.
7. PF3 to save, then list `{HLQ}.BUILD` in 3.4: the data set is there.

## Independent challenge
"Write and run a job that creates `{HLQ}.BUILD.DATA` as an FB, LRECL 80 data set." The data set must not exist at the start and must be created by a job (not by 3.2).

## Common mistakes
- Submitting the same job twice: DISP NEW for a data set that exists fails with a duplicate-name message.
- Forgetting the comma at the end of a continued line (lesson 32).
- Omitting DISP: the default is NEW, and for a new data set the normal disposition defaults to DELETE, so the data set disappears (lesson 34).

## Expected results
JESYSMSG shows `IGD101I ... ALLOCATED` for NEWDD and `IEF285I USER01.BUILD.DATA CATALOGED`; 3.4 lists `USER01.BUILD.DATA  PS  FB  80`.

## Simulator limitations (shown to the learner)
- Allocation messages, volume `USR001` and SMS class names are simulated.
- The simulator accepts and ignores some valid DD keywords (STORCLAS, DATACLAS, MGMTCLAS, LABEL, FREE, DSNTYPE); it does not honour them.
- A new data set is cataloged at allocation, as for SMS-managed data sets, and IEF285I reports it at the end.

## References
SRC-003 *MVS JCL Reference* SA23-1385-70: printed p.126 (DCB), p.147-148 (DISP), p.164 (DSNAME), p.251 (SPACE), p.278 (UNIT); DISP defaults from EV-B 1.1. SRC-018 *MVS JCL User's Guide* SA23-1386-70, PDF p.32-33. Checked against the PDF text on 2026-10-15 (printed = PDF page minus 46).

## Validation design
- The editor text is parsed with the simulator's JCL parser: job name, program, DD attributes and a clean parse are checked on structure, not on raw text.
- Events: `JOB_COMPLETED` (CC 0000), `DATASET_SEARCHED`. State: the data set's attributes.
- False positives considered: creating the data set with 3.2 (no `DATASET_ALLOCATED` event allowed in the Challenge); a different DSN (state check); leftovers (removed on start); wrong attributes (FB 80 required).
- Alternatives accepted: DCB=(RECFM=FB,LRECL=80) or RECFM and LRECL as separate keywords; DISP with KEEP instead of CATLG; any job name.

## Starting state and reset
`removeDatasets` `{HLQ}.BUILD.DATA`, `removeMembers` `{HLQ}.JCL(NEWDS)`, `resetJobs`, screen Primary Option Menu.

## Second-pass examination: findings and resolutions (2026-10-16)
| Finding | Resolution |
|---|---|
| b-04-C08/C27: "cataloged at the end" contradicts the SMS allocation-time cataloging the spec's own limitation states | lesson and spec corrected |
| b-04-C13: UNIT=SYSDA is installation-defined and ignored for SMS DASD | lesson says so |
| b-04-C21: "unused input lines disappear" is documented only for `I` lines | labelled the simulator's behaviour |
| b-04-C24: "PS, FB, 80" is the Attributes view of 3.4 | lesson explains the view |
| b-04-C30: no MSGCLASS | `MSGCLASS=X` in the typed JOB statement |
| simulator: new-member quote lines vanished on the first Enter and were not offered for an existing empty member | fixed: they stay until data is typed and also open for existing empty members (regression tests) |
