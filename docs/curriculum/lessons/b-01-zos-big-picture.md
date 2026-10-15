# b-01-zos-big-picture — The big picture: TSO/E, ISPF, JES and SDSF

Track / module:           B z/OS and batch / Batch jobs and SDSF (display position: before lesson 24)
Number and stable ID:     lesson 30, `b-01-zos-big-picture` (never changes)
Audience and difficulty:  beginner
Lesson type:              hybrid (guided trace of one job through four components; three multiple-choice check questions after the trace, ADR 0018)
Prerequisites:            none (`requires` empty). Leaves behind: one submitted job `{HLQ}H`; the job queue is cleared on every start
Estimated time:           15 minutes
Review status:            **draft** — an author check and a second-pass AI source examination (claim-level evidence in `../m3-evidence-matrix.md`; findings and resolutions in this spec's last section). **Not an independent review.** Independent source review, fidelity review and expert review are pending (authoring standards section 9). Hidden from learners by the draft gate (ADR 0018).

## Learning objectives
1. Say what TSO/E, ISPF, JES and SDSF are for, in one sentence each.
2. Follow one piece of work through them: an interactive session, an edit, a submitted job, and its output.
3. Tell which component you are using at each step of that trace.

## Terminology
z/OS, TSO/E (TSO), ISPF, JES (JES2), spool, SDSF, job, SUBMIT.

## Conceptual explanation (original wording; sources in brackets)
- An operating system is a collection of programs that manage the internal workings of a computer system. z/OS is the IBM mainframe operating system used here. [SRC-001 printed p.92, 3.1]
- TSO/E gives each user ID its own interactive session with z/OS and a basic command prompt (the READY prompt in native TSO). Most users reach it through its menu-driven interface, ISPF. [SRC-001 p.166, 4.2]
- At the basic prompt (native TSO) you type commands such as `LISTDS` to look at data sets. [SRC-001 p.169, 4.2.2]
- ISPF is a full-panel application navigated by keyboard. It includes a text editor and browser, and utilities for locating and listing data sets. [SRC-001 p.172, 4.3]
- The job entry subsystem (JES; JES2 in this course) receives jobs into the operating system, schedules them for processing and controls their output. One way a job reaches JES is from ISPF with the SUBMIT command. [SRC-001 p.275, 7.2]
- SDSF displays output held in the JES spool area, so you can check a job and delete the output you do not need. [SRC-001 p.257, 6.8]

## Worked example
One job, four components: you are in a TSO/E session; you open the JCL member `{HLQ}.JCL(HELLO)` in the ISPF editor; `SUBMIT` hands it to JES; SDSF shows what JES kept of the output.

## Guided activity
1. At the ISPF Command Shell (option 6) enter `LISTDS '{HLQ}.JCL'`. This is TSO, below the menus.
2. Back at the menu, open `{HLQ}.JCL(HELLO)` in Edit (option 2). This is ISPF.
3. Type `SUBMIT`. The message `JOB {HLQ}H(JOBnnnnn) SUBMITTED` is the system answering; JES now has the job.
4. Leave the editor and go to SDSF (`=S`, then `ST`). SDSF reads the JES spool.
5. Put `S` next to the job to browse its output.
6. PF3 back to the status panel.

## Independent challenge
"Run any TSO command at the ISPF Command Shell, submit `{HLQ}.JCL(HELLO)` from ISPF, and open that job's output in SDSF." Order matters: the TSO command first, then the submit, then the output of that same job.

## Common mistakes
- Looking at SDSF before the job was submitted (the list is empty).
- Submitting a different member: only the job from `HELLO` counts.
- Believing SDSF is part of ISPF: SDSF is not part of ISPF: it can be started from the ISPF menu or from TSO, and the job and output data it shows comes from JES.

## Expected results
`LISTDS` prints the data set name and its attributes; SUBMIT answers `JOB {HLQ}H(JOB00001) SUBMITTED` (simulated job number); SDSF ST lists `{HLQ}H` with `CC 0000`.

## Simulator limitations (shown to the learner)
- Jobs run to completion at once here; on a real system a job waits in a queue until it is selected to run (class, priority and hold status all play a part).
- The ISPF Command Shell and SDSF are simulated; SDSF is labelled so on screen.
- The roles are checked by three multiple-choice questions after the trace (recall only, not understanding of why the roles are split); the Challenge needs the trace and the three answers.

## References
SRC-001 *Introduction to the New Mainframe: z/OS Basics* SG24-6366-02 (2011): printed p.92 (3.1), p.166 and p.169 (4.2, 4.2.2), p.172 (4.3), p.257 (6.8), p.275 (7.2). Checked against the PDF text on 2026-10-15. The book is z/OS 1.x era; the roles described are unchanged, but release-specific screens in it are not reproduced here.

## Validation design
- Events: `TSO_COMMAND_ENTERED` (step 1 and Challenge), `MEMBER_OPENED` HELLO in Edit, `JOB_SUBMITTED` from the editor, `JOB_STATUS_OPENED`, `JOB_OUTPUT_OPENED`.
- False positives considered: another TSO command (accepted, any TSO command shows the layer); opening SDSF without a submitted job (needs the submitted-job output event); output of a different job (the job id must match the HELLO submission); stale jobs (the queue is cleared on start).
- Alternatives accepted: `J` on the member list instead of `SUBMIT` in the editor; `?` and then a data set instead of `S`; a TSO command typed as `TSO LISTDS ...` on the option line.
- Challenge check is false at the start and after leftovers (jobs cleared, history only since the Challenge started).

## Starting state and reset
`resetJobs`, `resetMembers` for `{HLQ}.JCL(HELLO)`, screen Primary Option Menu.

## Second-pass examination: findings and resolutions (2026-10-16)
b-01 gained three multiple-choice check questions (ADR 0018) after the trace: `role-session` (TSO/E), `role-jes` (JES), `role-sdsf` (SDSF). A wrong choice is a mistake; the Challenge requires the full trace **and** all three answers. The claims in the questions repeat the lesson's teaches lines (SRC-001 ch.4 p.166-172, 6.8 p.257, 7.2 p.275); their claim-level evidence rows are in `../m3-evidence-matrix.md` (b-01 section). The second-pass examination found the first wording ambiguous (ISPF also accepts TSO commands), wrong about who issues the SUBMITTED message (the TSO SUBMIT command, not JES) and wrong that JES runs the job (an initiator does); all three are corrected, and the check steps no longer show an explanation before the answer. The questions assess recall of roles, not understanding of why the roles are split; a richer assessment needs expert input on what a z/OS practitioner expects a beginner to explain.
