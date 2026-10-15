# b-06-multistep-rc — Multi-step jobs: return codes and abends

Track / module:           B z/OS and batch / Batch jobs and SDSF (display position: after lesson 27)
Number and stable ID:     lesson 35, `b-06-multistep-rc` (never changes)
Audience and difficulty:  intermediate
Lesson type:              interactive
Prerequisites:            `b-05-disp` (advice only). Leaves behind: members RCJOB and ABENDJOB in `{HLQ}.JCL` (recreated on every start) and their jobs (cleared on start)
Estimated time:           25 minutes
Review status:            **draft** — an author check and a second-pass AI source examination (claim-level evidence in `../m3-evidence-matrix.md`; findings and resolutions in this spec's last section). **Not an independent review.** Independent source review, fidelity review and expert review are pending (authoring standards section 9). Hidden from learners by the draft gate (ADR 0018).

## Learning objectives
1. Read the condition code of each step from IEF142I and the job's highest code in SDSF.
2. Explain that a nonzero return code does not stop the later steps of a job by itself.
3. Tell a return code from an abend, and recognise that a step after an abend is not executed.

## Terminology
Return code, condition code (COND CODE), Max-RC, abend, S806, flushed step.

## Conceptual explanation (original wording; sources in brackets)
- IEF142I is issued when a step completes processing normally and gives the condition code of the step. [SRC-019 IEF142I, EV-B 2.2]
- A program tells the system how it went with a return code; 0 conventionally means success. A step that ends with a nonzero code has still completed normally, so the next step is attempted unless the JCL says otherwise (COND, IF). [SRC-019 IEF142I; SRC-003 COND, EV-B 1.2]
- DFSORT treats a critical message such as ICE007A SYNTAX ERROR as ending the sort unsuccessfully; it then terminates with return code 16 (an installation option can make it abend instead). [SRC-028 ICE007A; SRC-027 ERET, PDF p.63]
- An abend is an abnormal end of the step. The system issues IEF450I for it; a later step that does not specify EVEN or ONLY is not executed and gets IEF272I. [SRC-019 IEF450I, IEF272I, EV-B 2.2]
- S806 reason 04 means the system could not find the program (module) named on EXEC; CSV003I REQUESTED MODULE ... NOT FOUND accompanies it. [SRC-020 System Codes S806; SRC-019 CSV003I]

## Worked example
RCJOB runs IEFBR14, then SORT with a bad control statement, then IEFBR14. IEF142I shows 0000, 0016, 0000: all three steps ran, and the job's highest code is 0016. ABENDJOB names a program that does not exist in its second step: the step abends S806 and the third step is not executed.

## Guided activity
1. `TSO SUBMIT JCL(RCJOB)`.
2. In SDSF open JESYSMSG of `{HLQ}R`: three IEF142I lines (0000, 0016, 0000) and ICE007A in the SORT output.
3. Edit RCJOB and correct the control statement to `SORT FIELDS=(1,3,CH,A)`.
4. SUBMIT: every step ends 0000. PF3 to save.
5. Submit ABENDJOB. It ends with an abend, not a return code.
6. Read its JESYSMSG: CSV003I / S806 for STEP2 and IEF272I for STEP3.

## Independent challenge
"Find out why RCJOB ends with a high return code although every step ran, and fix it so it ends CC 0000." The job must first have ended with CC 0016, its JESYSMSG must have been read, and a later run must end CC 0000.

## Common mistakes
- Assuming a nonzero return code stops the job (it does not, without COND or IF).
- Treating the abend as a return code: the job's status shows ABEND, and later steps are flushed.
- Fixing the wrong statement: the SYSIN data is the control statement, not the EXEC.

## Expected results
`IEF142I ... STEP WAS EXECUTED - COND CODE 0016` for STEP2 of RCJOB; `$HASP395 USER01R ENDED - RC=0016`; for ABENDJOB `IEF450I ... ABEND` for STEP2 and `IEF272I USER01A STEP3 - STEP WAS NOT EXECUTED`.

## Simulator limitations (shown to the learner)
- COND and IF/THEN/ELSE are not evaluated by the simulator (they are parsed only), so the lesson does not use them; EVEN and ONLY are not modelled.
- Only S806 exists as an abend, and the IEF450I layout differs from IBM's template (the book shows `ABEND Scde REASON=...`); treat the simulated text as SIMULATED.
- CPU times, EXCP counts and storage figures are placeholders.

## References
SRC-019 MVS System Messages: IEF142I, IEF272I, IEF450I, CSV003I (via EV-B 2.2). SRC-003 MVS JCL Reference: COND (EV-B 1.2). SRC-020 MVS System Codes: S806. SRC-028 DFSORT Messages, Codes and Diagnosis Guide: ICE007A (critical; the program terminates). SRC-027 DFSORT Application Programming Guide SC23-6878-70, PDF p.63: ERET, return code 16 or abend. Checked against the PDF text on 2026-10-15.

## Validation design
- Events: `JOB_COMPLETED` (job name, `maxRc`, `abend`), `JOB_OUTPUT_OPENED` (JESYSMSG of the right job). State: the SYSIN data of the edited RCJOB is a valid SORT control statement.
- False positives considered: another job's output (the job id is looked up and its name compared); fixing by deleting a step (the control statement check still fails); stale jobs (cleared on start).
- Alternatives accepted: `J` on the member list; `SUBMIT` in the editor or after saving.
- Challenge: CC 0016 first, JESYSMSG of an `{HLQ}R` job opened, later CC 0000 for the same job name, no Edit session open.

## Starting state and reset
`createMembers` RCJOB and ABENDJOB, `resetJobs`, screen Primary Option Menu.

## Second-pass examination: findings and resolutions (2026-10-16)
| Finding | Resolution |
|---|---|
| b-06-C09 (HIGH): ICE007A was taught for a misspelt keyword (`FIELDZ`), which IBM does not list as an ICE007A cause | the fault is now a missing comma, a documented ICE007A cause: `SORT FIELDS=(1,3,CH A)`; the simulator's SORT parser now checks p,m,f,s groups and format types so this really produces ICE007A |
| b-06-C12: "every step ends 0000" after the fix depends on a DUMMY SORTIN | the rerun step labels it the simulator's result |
| S806 over-general | "S806 reason 04" |
| "later steps are not executed" absolute | "normally" with the IF/EVEN/ONLY/recovery exceptions |
| IEF142I only for steps that complete normally; IEF472I is the abend marker the simulator omits | stated |
| placement of CSV003I/IEF450I in JESYSMSG vs the job log | stated as the simulator's |
| Max-RC is the default (JOBRC=MAXRC), not universal | "by default" |
