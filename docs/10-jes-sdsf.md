# Virtual JES and SDSF (SIMULATED)

ISPF Lab includes a small, deterministic Job Entry Subsystem so learners can submit JCL, read job output and debug
a JCL ERROR — the "day one" loop of an operator. It is an educational model, not JES2: every SDSF panel title says
**(SIMULATED)**. References: IBM z/OS MVS JCL Reference; z/OS MVS System Messages (IEF, IEFC, IGD, CSV);
z/OS SDSF User's Guide; Redbook SG24-6366 ch. 6.

## Model (`src/jes`)

- `types.ts` — `Job {id JOBnnnnn, jobName, owner, class, msgclass, source?, submittedOn, status OUTPUT|JCL_ERROR, maxRc?,
  abend?, steps[], outputs[{ddname, stepName?, records}], jcl[]}`; `JesState {nextJobNumber, jobs, log}`.
- `jcl.ts` — recogniser: `//name JOB`, `//name EXEC PGM=|PROC=`, `//dd DD`, `//*`, `//` null, `DD *`/`DD DATA` … `/*`,
  continuation (trailing comma → next line `// `), columns 73–80 ignored, comments after the operand field.
  Errors: IEFC605I UNIDENTIFIED OPERATION FIELD, IEFC621I EXPECTED CONTINUATION NOT RECEIVED, IEFC630I UNIDENTIFIED
  KEYWORD x, IEFC019I MISPLACED … STATEMENT, IEFC662I INVALID LABEL, IEFC452I JOB NOT RUN (no JOB statement).
- `programs.ts` — IEFBR14 (RC 0; allocation/disposition do the work), IEBGENER (SYSUT1→SYSUT2, SYSPRINT), SORT /
  ICEMAN (`SORT FIELDS=(p,m,f,s)` groups with a known format type, or `COPY`; a missing comma, an unbalanced parenthesis, a missing sequence or an unknown format is ICE007A → RC 16), IDCAMS (`LISTCAT LEVEL(x)`, `DELETE 'dsn'`).
  Any other module → CSV003I + ABEND S806, later steps flushed.
- `submit.ts` — allocation per DD (IEF236I/IEF237I; NEW creates the data set from SPACE/DCB, IGD17101I when the name
  exists; SHR/OLD/MOD missing → IEF212I DATA SET NOT FOUND, IEF272I STEP WAS NOT EXECUTED, job status JCL ERROR),
  execution (IEF142I COND CODE nnnn / IEF450I ABEND), dispositions (IEF285I KEPT/CATALOGED/DELETED), then the three
  JES data sets: JESMSGLG ($HASP100/373/395, IEF403I/404I, timings table), JESJCL (numbered listing), JESYSMSG.
  Message `IKJ56250I JOB name(JOBnnnnn) SUBMITTED`.

## Entry points

Editor `SUBMIT`/`SUB` (submits the member or data set being edited, as IBM's Edit manual says; IBM does not say whether
unsaved edits are included, so the **buffer** is submitted — see ADR 0015), member list `J`, `TSO SUBMIT dsn(member)` (unquoted names get the userid prefix).

## SDSF panels

| Panel | How | Content |
|---|---|---|
| SDSF menu | option `S` (`SDSF`, `=S`; the real option is what the site configures) | ST, O, LOG; I→ST and H→O with a note; DA/PR/INIT not available |
| ST / O | `ST` / `O` | NP JOBNAME JobID Owner Prty Queue C Pos Max-RC Date; default filter OWNER = userid, PREFIX `*` |
| actions | NP column | `S` browse all output, `?` job data sets, `P` purge (confirm), `SJ`/`SE` open the saved source member (real SDSF edits a copy of the job's JCL and does not save changes; `SE` edits output data sets — see ADR 0015), `=` repeat; several per Enter |
| commands | command line | `OWNER [id|*]`, `PREFIX [name*|*]`, `SORT JOBNAME|JOBID|STATUS`, `FIND`, `ST`, `O`, `LOG`, `END` |
| Job data set (`?`) | | JESMSGLG, JESJCL, JESYSMSG, then SYSOUT DDs by step; `S` browses one |
| LOG | `LOG` | accumulated $HASP/IEF lines of this session in Browse |

Max-RC: `CC 0000` (highest step condition code), `JCL ERROR`, `ABEND Sxxx`.

## The Day-One challenge

`<HLQ>.JCL(PAYRPT)` copies `<HLQ>.PAYROLL.DATA` to SYSOUT with IEBGENER. That data set does not exist (the simulator models only "in the
catalog" or "not there", with no half-way state), so allocation fails and the job ends **JCL ERROR** with
`IEF212I … SYSUT1 - DATA SET NOT FOUND` in JESYSMSG. Editing the DSN or creating the data set both repair it. Fixing the DSN to
`<HLQ>.DATA(EMPLOYEE)` and resubmitting ends `CC 0000` with the records in the SYSUT2 spool data set.
(The expansion spec suggested `PGM=IEFBR15`; a missing module is an ABEND S806 on z/OS, not a JCL ERROR, so the
seed uses a real JCL error and S806 is simulated separately.)

## Simplifications (documented deviations)

`DISP=MOD` creates a data set that does not exist and appends to an existing sequential one (IEBGENER output); on a library it fails the step and changes nothing when the member already exists (IBM terminates the job) or no member is named (IBM appends after the last member); PASS and UNCATLG behave like KEEP. If a later DD of a step fails to allocate, NEW data sets created earlier in that step stay cataloged (probed; real behaviour not verified).

JCL conversion: the `STMT NO.` in JESYSMSG is the statement number printed in the JESJCL listing (comments and continuation records are not numbered; a stray text line is numbered, IBM is silent). A `/*` delimiter, with or without a comment, ends in-stream data (JCL Reference, Delimiter statement). As the last record of the job it is accepted, also when only the null statement `//` follows, as in IBM's sample job; a `/*` followed by more JCL is still an error. IEF236I is printed only when the step's allocation succeeded. Continued operands may begin in any column after column 3 (IBM: 4-16). Only the trailing-comma trigger of `IEFC621I` is modelled.

`SJ`/`SE` share one branch and open the **saved** member; real SDSF's `SJ` edits the JCL held for the job and "changes you make to the data are not saved", and `SE` edits output data sets. Both fix routes (SJ, or Edit option 2, then resubmit) stay valid. Not a deviation: Edit `SUBMIT` (ADR 0015).

No input/held queues, initiators, classes or priorities — jobs run at once. No cataloged procedures (`EXEC PROC=`
→ IEFC612I, JCL ERROR). COND/IF not evaluated. Programs limited to the four above. Times are not modelled (dates
only). Output is never printed; `P` purges. The LOG is per browser session storage, not SYSLOG.
