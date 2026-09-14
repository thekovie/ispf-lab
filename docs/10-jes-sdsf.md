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
  KEYWORD x, IEFC606I MISPLACED … STATEMENT, IEFC662I INVALID LABEL, IEFC452I JOB NOT RUN (no JOB statement).
- `programs.ts` — IEFBR14 (RC 0; allocation/disposition do the work), IEBGENER (SYSUT1→SYSUT2, SYSPRINT), SORT /
  ICEMAN (`SORT FIELDS=(p,l,CH,A|D)` or `COPY`; ICE007A → RC 16), IDCAMS (`LISTCAT LEVEL(x)`, `DELETE 'dsn'`).
  Any other module → CSV003I + ABEND S806, later steps flushed.
- `submit.ts` — allocation per DD (IEF236I/IEF237I; NEW creates the data set from SPACE/DCB, IGD17101I when the name
  exists; SHR/OLD/MOD missing → IEF212I DATA SET NOT FOUND, IEF272I STEP WAS NOT EXECUTED, job status JCL ERROR),
  execution (IEF142I COND CODE nnnn / IEF450I ABEND), dispositions (IEF285I KEPT/CATALOGED/DELETED), then the three
  JES data sets: JESMSGLG ($HASP100/373/395, IEF403I/404I, timings table), JESJCL (numbered listing), JESYSMSG.
  Message `IKJ56250I JOB name(JOBnnnnn) SUBMITTED`.

## Entry points

Editor `SUBMIT`/`SUB` (the **buffer** is submitted so unsaved experiments work — real ISPF submits the data set on
disk), member list `J`, `TSO SUBMIT dsn(member)` (unquoted names get the userid prefix).

## SDSF panels

| Panel | How | Content |
|---|---|---|
| SDSF menu | option `S` (`SD`, `SDSF`, `M.5`, `=S`) | ST, O, LOG; I→ST and H→O with a note; DA/PR/INIT not available |
| ST / O | `ST` / `O` | NP JOBNAME JobID Owner Prty Queue C Pos Max-RC Date; default filter OWNER = userid, PREFIX `*` |
| actions | NP column | `S` browse all output, `?` job data sets, `P` purge (confirm), `SJ`/`SE` edit the source member, `=` repeat; several per Enter |
| commands | command line | `OWNER [id|*]`, `PREFIX [name*|*]`, `SORT JOBNAME|JOBID|STATUS`, `FIND`, `ST`, `O`, `LOG`, `END` |
| Job data set (`?`) | | JESMSGLG, JESJCL, JESYSMSG, then SYSOUT DDs by step; `S` browses one |
| LOG | `LOG` | accumulated $HASP/IEF lines of this session in Browse |

Max-RC: `CC 0000` (highest step condition code), `JCL ERROR`, `ABEND Sxxx`.

## The Day-One challenge

`<HLQ>.JCL(PAYRPT)` copies `<HLQ>.PAYROLL.DATA` to SYSOUT with IEBGENER. That data set is not cataloged, so the
job ends **JCL ERROR** with `IEF212I … SYSUT1 - DATA SET NOT FOUND` in JESYSMSG. Fixing the DSN to
`<HLQ>.DATA(EMPLOYEE)` and resubmitting ends `CC 0000` with the records in the SYSUT2 spool data set.
(The expansion spec suggested `PGM=IEFBR15`; a missing module is an ABEND S806 on z/OS, not a JCL ERROR, so the
seed uses a real JCL error and S806 is simulated separately.)

## Simplifications (documented deviations)

No input/held queues, initiators, classes or priorities — jobs run at once. No cataloged procedures (`EXEC PROC=`
→ IEFC612I, JCL ERROR). COND/IF not evaluated. Programs limited to the four above. Times are not modelled (dates
only). Output is never printed; `P` purges. The LOG is per browser session storage, not SYSLOG.
