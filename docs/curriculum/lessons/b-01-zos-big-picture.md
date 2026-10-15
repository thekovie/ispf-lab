# b-01-zos-big-picture — The big picture: TSO/E, ISPF, JES and SDSF

Track / module:           B z/OS and batch / Foundations
Number and stable ID:     lesson 30, `b-01-zos-big-picture` (never changes)
Audience and difficulty:  beginner
Lesson type:              hybrid (guided trace of one job through four components; the roles are explained, not quizzed)
Prerequisites:            none (`requires` empty). Leaves behind: one submitted job `{HLQ}H`; the job queue is cleared on every start
Estimated time:           15 minutes
Review status:            **draft** — claims checked against SRC-001 by the author only. Source review, fidelity review and expert review pending

## Learning objectives
1. Say what TSO/E, ISPF, JES and SDSF are for, in one sentence each.
2. Follow one piece of work through them: an interactive session, an edit, a submitted job, and its output.
3. Tell which component you are using at each step of that trace.

## Terminology
z/OS, TSO/E (TSO), ISPF, JES (JES2), spool, SDSF, job, SUBMIT.

## Conceptual explanation (original wording; sources in brackets)
- An operating system is a collection of programs that manage the internal workings of a computer system. z/OS is the IBM mainframe operating system used here. [SRC-001 printed p.92, 3.1]
- TSO/E gives a user an interactive session with z/OS: a single-user logon and a basic command prompt. Most users reach it through its menu-driven interface, ISPF. [SRC-001 p.166, 4.2]
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
- Believing SDSF is part of ISPF: it is reached from the ISPF menu, but it reads JES.

## Expected results
`LISTDS` prints the data set name and its attributes; SUBMIT answers `JOB {HLQ}H(JOB00001) SUBMITTED` (simulated job number); SDSF ST lists `{HLQ}H` with `CC 0000`.

## Simulator limitations (shown to the learner)
- Jobs run to completion at once here; on a real system a job waits in a queue until an initiator is free.
- The ISPF Command Shell and SDSF are simulated; SDSF is labelled so on screen.
- The roles of TSO/E, ISPF, JES and SDSF are explained but not quizzed: the Challenge checks the trace, not recall of definitions.

## References
SRC-001 *Introduction to the New Mainframe: z/OS Basics* SG24-6366-02 (2011): printed p.92 (3.1), p.166 and p.169 (4.2, 4.2.2), p.172 (4.3), p.257 (6.8), p.275 (7.2). Checked against the PDF text on 2026-10-15. The book is z/OS 1.x era; the roles described are unchanged, but release-specific screens in it are not reproduced here.

## Validation design
- Events: `TSO_COMMAND_ENTERED` (step 1 and Challenge), `MEMBER_OPENED` HELLO in Edit, `JOB_SUBMITTED` from the editor, `JOB_STATUS_OPENED`, `JOB_OUTPUT_OPENED`.
- False positives considered: another TSO command (accepted, any TSO command shows the layer); opening SDSF without a submitted job (needs the submitted-job output event); output of a different job (the job id must match the HELLO submission); stale jobs (the queue is cleared on start).
- Alternatives accepted: `J` on the member list instead of `SUBMIT` in the editor; `?` and then a data set instead of `S`; a TSO command typed as `TSO LISTDS ...` on the option line.
- Challenge check is false at the start and after leftovers (jobs cleared, history only since the Challenge started).

## Starting state and reset
`resetJobs`, `resetMembers` for `{HLQ}.JCL(HELLO)`, screen Primary Option Menu.
