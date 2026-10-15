# b-05-disp — Disposition: what happens to a data set after the step

Track / module:           B z/OS and batch / Batch jobs and SDSF (display position: after b-04)
Number and stable ID:     lesson 34, `b-05-disp` (never changes)
Audience and difficulty:  intermediate
Lesson type:              interactive
Prerequisites:            `b-04-build-a-job` (advice only). Leaves behind: members DISPNEW, DISPMOD, DISPDEL, KEEPIT in `{HLQ}.JCL` and data sets `{HLQ}.DISP.OUT`, `{HLQ}.DISP.KEEP`; the members are recreated and the data sets removed on every start
Estimated time:           25 minutes
Review status:            **draft** — an author check and a second-pass AI source examination (claim-level evidence in `../m3-evidence-matrix.md`; findings and resolutions in this spec's last section). **Not an independent review.** Independent source review, fidelity review and expert review are pending (authoring standards section 9). Hidden from learners by the draft gate (ADR 0018).

## Learning objectives
1. Read DISP=(status,normal,abnormal) and say what each part means.
2. Predict the fate of a data set for NEW,CATLG; MOD; OLD,DELETE; and no DISP at all.
3. Find and fix a job that deletes its own output.

## Terminology
Status (NEW, OLD, SHR, MOD); normal disposition (KEEP, CATLG, DELETE); abnormal disposition; IEF285I.

## Conceptual explanation (original wording; sources in brackets)
- DISP describes the status of a data set and what to do with it after the step or job ends, normally and abnormally. [SRC-003 printed p.147-154]
- If you omit the status it is NEW. If you omit the normal disposition it is DELETE for a new data set and KEEP for an existing one; the abnormal default is the normal disposition, except that when the normal disposition is PASS it is DELETE for a new data set or KEEP for an existing one. [SRC-003 p.147-152, EV-B 1.1]
- MOD adds records to the end of an existing sequential data set. If the system cannot find the data set, it assumes the data set is being created in this step. [SRC-003 p.147-152, EV-B 1.1]
- CATLG places an entry for the data set in the catalog and keeps it. DELETE removes the data set and its catalog entry when the system found the data set through the catalog; an existing data set whose retention period has not passed is kept. [SRC-003 p.147-152, EV-B 1.1]
- IEF285I reports the disposition after the step with a word such as CATALOGED, KEPT or DELETED. [SRC-019 IEF285I, EV-B 2.2]

## Worked example
A job with `DISP=(NEW,CATLG)` leaves the data set cataloged (IEF285I CATALOGED). The same DD with no DISP defaults to NEW, DELETE: the data set exists only while the step runs and IEF285I says DELETED.

## Guided activity
1. `TSO SUBMIT JCL(DISPNEW)`: `{HLQ}.DISP.OUT` is created with one record (NEW,CATLG).
2. Open the job's JESYSMSG in SDSF and find IEF285I `CATALOGED`.
3. `TSO SUBMIT JCL(DISPMOD)`: MOD adds a second record.
4. Browse `{HLQ}.DISP.OUT` in 3.4 with `B`: two records.
5. `TSO SUBMIT JCL(DISPDEL)`: OLD,DELETE removes the data set.
6. `TSO SUBMIT JCL(KEEPIT)`: it ends CC 0000, but `{HLQ}.DISP.KEEP` is gone (no DISP, so NEW,DELETE).
7. Edit KEEPIT, add `DISP=(NEW,CATLG)` to the DD, SUBMIT: the data set stays. PF3 to save.

## Independent challenge
"Fix `{HLQ}.JCL(KEEPIT)` so that after the job runs `{HLQ}.DISP.KEEP` exists." The data set must be created by the job, not by the Data Set Utility.

## Common mistakes
- Assuming a job that ends CC 0000 kept its output: the default disposition may have deleted it.
- Submitting a NEW job twice: the second fails because the name exists.
- Using NEW on a data set you meant to add to (use MOD).

## Expected results
IEF285I lines in JESYSMSG: `USER01.DISP.OUT CATALOGED`, later `DELETED`; for KEEPIT the first run shows `USER01.DISP.KEEP DELETED`.

## Simulator limitations (shown to the learner)
- PASS and UNCATLG are not modelled: the simulator treats them like KEEP. They are not used here.
- MOD appends only to sequential data sets written by IEBGENER; a MOD data set that is a library member is replaced.
- New data sets are cataloged at allocation, as for SMS-managed data sets; the IEF285I words follow the DISP.
- If a later DD in a step fails to allocate, data sets created earlier in the same step stay in the catalog (probed 2026-10-15). Real behaviour was not verified, so no lesson step depends on it.

## References
SRC-003 *MVS JCL Reference* SA23-1385-70: DISP printed p.147-152 (checked through the EV-B 1.1 evidence rows). SRC-019 MVS System Messages: IEF285I (EV-B 2.2). Checked on 2026-10-15.

## Validation design
- Events: `JOB_COMPLETED` per job name, `JOB_OUTPUT_OPENED` (JESYSMSG), `MEMBER_OPENED` (browse). State: the data set exists or is gone; record counts; the parsed DD of the edited KEEPIT.
- False positives considered: running a different job (job name required); creating data sets with 3.2 (Challenge forbids `DATASET_ALLOCATED`); stale data sets (removed on start).
- Alternatives accepted: `DISP=(NEW,KEEP)` or `(NEW,CATLG,DELETE)`; `J` on the member list instead of `TSO SUBMIT`.

## Starting state and reset
`createMembers` DISPNEW, DISPMOD, DISPDEL, KEEPIT; `removeDatasets` `{HLQ}.DISP.OUT`, `{HLQ}.DISP.KEEP`; `resetJobs`.

## Second-pass examination: findings and resolutions (2026-10-16)
| Finding | Resolution |
|---|---|
| "Compare OLD, which starts writing from the beginning" has no source | removed from the lesson |
| "the words you will see most" is an unsourced frequency claim; KEPT can also appear for data sets removed by TSO DELETE or IDCAMS | reworded |
| DELETE and the abnormal default had unstated conditions | stated |
| KEEP on SMS-managed disk implies CATLG (JCL Reference p.151); the simulator prints KEPT for `(NEW,KEEP)` | disclosed here and in the lesson; the simulator is unchanged (real word possibly CATALOGED) |
| "New data sets are cataloged at allocation, as for SMS-managed data sets" is not in the cited JCL Reference | reworded as the simulator's behaviour; SRC-018 p.116 supports it for SMS disk |
| MOD on an existing library member silently overwrote it (IBM terminates the job) | simulator fixed: the step fails, the member is unchanged; MOD on a library with no member fails with a clear message |
