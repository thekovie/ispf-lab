# b-10-job-troubleshooting — Batch troubleshooting: classify the failure, then fix it

Track / module:           B z/OS and batch / Batch jobs and SDSF (display position: after b-06)
Number and stable ID:     lesson 36, `b-10-job-troubleshooting` (never changes)
Audience and difficulty:  intermediate
Lesson type:              diagnostic
Prerequisites:            `b-06-multistep-rc` (advice only). Leaves behind: members FIXJCL, FIXDSN, FIXPGM, FIXRC in `{HLQ}.JCL` and data set `{HLQ}.TRB.DATA`; members recreated, data set removed, jobs cleared on every start
Estimated time:           30 minutes
Review status:            **draft** — an author check and a second-pass AI source examination (claim-level evidence in `../m3-evidence-matrix.md`; findings and resolutions in this spec's last section). **Not an independent review.** Independent source review, fidelity review and expert review are pending (authoring standards section 9). Hidden from learners by the draft gate (ADR 0018). The roadmap lists lesson b-08 (abends) as a prerequisite; it is not built, so this lesson uses only the S806 abend the simulator has and says so

## Learning objectives
1. Say which of four kinds of failure a job log shows: a JCL error, an allocation failure, an abend, or a bad return code.
2. Find the evidence for each in the right place (SDSF status, JESYSMSG, the step's own output).
3. Apply the matching fix and confirm CC 0000.

## Terminology
JCL error, allocation failure, abend, return code, Max-RC, IEFC630I, IEF212I, IEF450I, S806.

## Conceptual explanation (original wording; sources in brackets)
- A JCL error is found while the system reads the job, before any step runs. IEFC630I UNIDENTIFIED KEYWORD says a keyword was not valid for that statement. [SRC-019 IEFC630I, EV-B 2.1; lesson b-03]
- An allocation failure happens when a step starts: IEF212I jobname stepname ddname - DATA SET NOT FOUND names the DD that could not be allocated, not the data set; the DD statement shows the name. [SRC-019 IEF212I, EV-B 2.2]
- An abend ends a step abnormally. S806 reason 04 means the program named on EXEC was not found; CSV003I accompanies it, and later steps are not executed. [SRC-020 S806; SRC-019 CSV003I, IEF272I]
- A step can end normally with a nonzero return code; the job keeps going, and SDSF shows the highest code. DFSORT ends an unsuccessful sort with return code 16 (or abends, by installation option). [SRC-019 IEF142I; SRC-028 ICE007A; SRC-027 ERET]
- Where to look: SDSF status first (CC, ABEND, JCL ERROR), then JESYSMSG for the step messages, then the step's own SYSOUT. [SRC-018 JCL User's Guide, EV-B 2]

## Worked example
FIXDSN: STEP1 fails to allocate `{HLQ}.NOTES.TXTT`; JESYSMSG says `IEF212I ... OUT - DATA SET NOT FOUND` and the step is not executed. Read the DD, see the extra T, remove it, resubmit: CC 0000.

## Guided activity
For each of four jobs, in this order (JCL error, allocation failure, abend, bad return code):
1. Submit it and open its JESYSMSG. Decide which kind of failure it is.
2. Edit the member, fix the one fault, and resubmit until the job ends CC 0000.

## Independent challenge
"FIXJCL, FIXDSN, FIXPGM and FIXRC each have one fault. For each job: let it fail, read its JESYSMSG, fix it, and run it to CC 0000." No steps shown; any order.

## Common mistakes
- Looking only at the return code (a JCL error and an abend have none).
- Reading IEF212I as naming the data set: it names the DD.
- Fixing a symptom in the wrong job.

## Expected results
FIXJCL: JCL ERROR, `IEFC630I UNIDENTIFIED KEYWORD` (the simulator also appends the keyword; the real message appends a location phrase). FIXDSN: JCL ERROR status with IEF212I. FIXPGM: ABEND S806 and IEF272I for the later step. FIXRC: CC 0016 with all steps run.

## Simulator limitations (shown to the learner)
- Both a converter error and an allocation error show JCL ERROR in the SDSF status; real JES2 does the same ($HASP165 covers the converter and initiator phases). Classify by the message id (IEFC converter or IEF allocation) in JESYSMSG. This is IBM behaviour, not a simulator gap.
- Message layouts for IEFC630I and IEF450I follow the simulator, not IBM's exact templates (SIMULATED).
- Only S806 exists as an abend; the faults are fixed, not rotated (determinism). A z/OS practitioner should review them.

## References
SRC-019 MVS System Messages: IEFC630I, IEF212I, IEF272I, IEF142I, CSV003I (via EV-B 2). SRC-020 MVS System Codes: S806. SRC-027/028 DFSORT: ERET, ICE007A. SRC-018 MVS JCL User's Guide: job output. Checked on 2026-10-15.

## Validation design
- Events: `JOB_COMPLETED` (per job name: failure kinds and success), `JOB_OUTPUT_OPENED` (JESYSMSG of that job). No state shortcut: the Challenge needs, per job, failure then read then success.
- False positives considered: fixing a job without running it as is first (the failure event is required first); reading another job's log (job id compared); stale jobs (cleared on start).
- Alternatives accepted: any fix that makes the job end CC 0000 (for FIXJCL correcting DISP or removing the keyword; for FIXDSN correcting the name or creating the data set; for FIXPGM any valid program; for FIXRC a valid control statement).

## Starting state and reset
`createMembers` FIXJCL, FIXDSN, FIXPGM, FIXRC; `removeDatasets` `{HLQ}.TRB.DATA`; `resetJobs`; screen Primary Option Menu.

## Second-pass examination: findings and resolutions (2026-10-16)
| Finding | Resolution |
|---|---|
| b-10-C05 (HIGH): IEFC630I does not echo the bad keyword; its text locates the error from the last correct keyword | lesson no longer says it names the word; layout labelled simulated |
| b-10-C27 (HIGH): ICE007A for a misspelt keyword | FIXRC now uses the documented missing-comma fault (as in b-06) |
| b-10-C14 (MEDIUM-HIGH): IBM does not distinguish "JCL error" and "allocation failure" by status; both are JCL ERROR. The valid line is the message source (IEFC converter vs IEF allocation) | categories renamed "converter (syntax) error" and "allocation error"; both stated to show JCL ERROR; classification is by message id; the "simulator limitation" about the identical status is removed (it is IBM behaviour) |
| S806 over-general | "reason 04" |
| IEF236I was printed before a failed allocation's IEF212I | simulator fixed (regression test) |
| "status" vs the Max-RC column; "suggested order" vs IBM-defined order | reworded |
| `sources` lacked SRC-021/023/024 | added |
