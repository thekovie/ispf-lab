# sources-B: IBM documentation verification for ISPF Lab JES/JCL simulator

Audit date 2026-10-14. Repo read-only (src/jes/jcl.ts, submit.ts, programs.ts, docs/10-jes-sdsf.md; plus parseDsnRef in src/catalog/catalog.ts).

## Method and honesty notes

- Primary source: the z/OS **3.2** PDFs on ibm.com, downloaded with curl and text-extracted (PyMuPDF). Every quote below was read in that extracted text. URL pattern: `https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/<id>_v3r2.pdf`. "p." = PDF page number (the book's own page is usually PDF page minus 12 to 14).
- JCL Reference DISP/COND/DD/IF topics were also fetched as HTML for **3.1** (`https://www.ibm.com/docs/en/SSLTBW_3.1.0/com.ibm.zos.v3r1.ieab600/<page>.htm`) and gave the same content. Marked "3.1 HTML" where used.
- Books (all 3.2 unless stated): MVS JCL Reference SA23-1385-70 (ieab600); MVS JCL User's Guide SA23-1386-70 (ieab500); MVS System Messages Vol 4 SA38-0671-70 (ieam400), Vol 6 SA38-0673-70 (ieam600), Vol 7 SA38-0674-70 (ieam700), Vol 8 SA38-0675-70 (ieam800); MVS System Codes SA38-0665-70 (ieah700); JES2 Messages SA32-0989-70 (hasa100); JES2 Initialization and Tuning Reference SA32-0992-70 (hasa400); SDSF User's Guide SC27-9028-70 (isfa600); DFSMSdfp Utilities SC23-6864-70 (idau100); DFSMS Access Method Services Commands SC23-6846-70 (idai200); DFSORT Application Programming Guide SC23-6878-70 (icea100); DFSORT Messages, Codes and Diagnosis Guide SC23-6879-70 (icem100).
- Not fetched / not verified: the IBM Docs "new form" topic URLs for most topics (only `topic=statement-disp-parameter` returned a summary page with no subtopic content). Nothing here comes from memory; where a text is silent the row says so.
- Repo-behaviour verdicts are from reading the code; nothing was executed.

---

## 1. JCL (MVS JCL Reference, SA23-1385-70, z/OS 3.2, ieab600_v3r2.pdf)

### 1.1 DISP

Topic pages: "DISP parameter" (PDF p.194-199; book p.147-152), "Status subparameter", "Normal termination disposition subparameter", "Abnormal termination (conditional) disposition subparameter", "Defaults".
URL: https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/ieab600_v3r2.pdf ; 3.1 HTML: .../iea3b6_Defaults12.htm, iea3b6_Status_subparameter.htm, iea3b6_Normal_termination_disposition_subparameter.htm, iea3b6_Abnormal_termination__conditional__disposition_subparameter.htm

| Claim | Quote (<=25 words) | Verdict vs repo | Caveats |
|---|---|---|---|
| Default status | "If you omit the status subparameter, the default is NEW." | SUPPORTS [`dispStatus(...) \|\| "NEW"`] | Repo only allocates a DD when DSN present. |
| Default normal disposition | "the default is DELETE for a NEW data set or KEEP for an existing data set." | SUPPORTS [normal DELETE for NEW else KEEP] | |
| Default abnormal disposition | "the default is the disposition specified or implied by the second subparameter." | SUPPORTS [abnormal = normal] | If 2nd subparameter is PASS, abnormal default is DELETE (new) / KEEP (existing); repo has no PASS. DISP omitted entirely = NEW, DELETE, DELETE. |
| MOD when data set absent | "If the system cannot find volume information ... the system assumes that the data set is being created in this job step." | CONTRADICTS [repo errors IEF212I DATA SET NOT FOUND for MOD of a missing data set] | Doc: MOD = "records are to be added to the end" of an existing data set, OR "A new data set is to be created." Caveat: if VOLUME/UNIT info is coded the outcome differs (IEF285I System-action text). |
| MOD appending | "the read/write mechanism is positioned after the last sequential record for an existing data set or at the beginning for a new data set." | CONTRADICTS [repo replaces all records] | MOD requires sequential data set. |
| PASS | "Indicates that the data set is to be passed." Note: "A data set can be passed only within a job." | CONTRADICTS (not modelled) [repo treats PASS as KEPT and keeps the data set cataloged] | PASS allowed on normal disposition only; not valid as abnormal disposition (abnormal page lists DELETE, KEEP, CATLG, UNCATLG). |
| UNCATLG | "Indicates that the system is to delete the entry pointing to the data set in the catalog ... The data set is kept." | CONTRADICTS [repo treats as KEPT, leaves catalog entry] | With SMS "UNCATLG is ignored for SMS-managed data sets and VSAM data sets (KEEP is implied)." Repo simulates SMS (IGD101I), so UNCATLG-ignored would actually be defensible for new data sets. |
| CATLG vs KEEP | "For new SMS-managed data sets, KEEP implies CATLG." CATLG: "place an entry pointing to the data set in the catalog. The data set is kept." | SUPPORTS for SMS-managed NEW (repo shows IGD101I, i.e. SMS-simulated) ; CONTRADICTS if the learner is told non-SMS KEEP also catalogs | Doc never says NEW is cataloged only by CATLG, only that KEEP implies CATLG for SMS. IGD17101I ("duplicate name exists in catalog") shows SMS defines the catalog entry at allocation time, which supports repo catalog-at-allocation for SMS data sets. IEF285I reports CATALOGED at disposition time. |
| DELETE of cataloged data | "DELETE implies UNCATLG: the system deletes the data set and removes its catalog entry." | SUPPORTS [repo deleteDataset] | When volume info came from the catalog. |

### 1.2 COND, IF/THEN/ELSE/ENDIF, EVEN/ONLY

Topic pages: "COND parameter" (EXEC) PDF p.373-375 / book p.327-328; "COND parameter" (JOB) PDF p.451 / book p.405; "Chapter 18. IF/THEN/ELSE/ENDIF statement construct" PDF p.413-414 / book p.367; "Considerations when using the COND parameter".
URL: https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/ieab600_v3r2.pdf ; 3.1 HTML: xexcond.htm, iea3b6_Subparameter_definition64.htm, condcau.htm, ifuse.htm

| Claim | Quote | Verdict | Caveats |
|---|---|---|---|
| EXEC COND semantics | "If any of the test conditions are satisfied, the system evaluates the COND parameter as true and bypasses the job step." | CONTRADICTS [repo parses COND, never evaluates] | Up to eight tests; code 0-4095; operators GT GE EQ LT LE NE; true = bypass (inverse of IF). |
| JOB COND | "if any test is satisfied, the system bypasses all remaining job steps and terminates the job." | CONTRADICTS [not evaluated] | "A step bypassed because of an EXEC statement COND parameter does not produce a return code." |
| EVEN / ONLY | "EVEN: Specifies that this job step is to be executed even if a preceding job step abnormally terminated." ONLY: "only if a preceding step abnormally terminated." | CONTRADICTS [not implemented; repo always flushes after abend] | |
| Flush after abend | "If a step abnormally terminates, the system normally bypasses all following steps in the job" unless IF with ABEND keywords or EVEN/ONLY. | SUPPORTS [repo `flushed = true`] | Also "If a step abnormally terminates during scheduling, due to failures such as JCL errors or the inability to allocate space, the system bypasses the remaining steps, no matter what the COND parameter requests." (supports repo flush after IEF212I). |
| IF/THEN/ELSE/ENDIF | "Use the IF/THEN/ELSE/ENDIF statement construct to conditionally execute job steps within a job." "The system evaluates the relational-expression at execution time." | CONTRADICTS [repo rejects IF/THEN as IEFC605I UNIDENTIFIED OPERATION FIELD] | Nesting limit 15. Example `//   IF  RC > 4  THEN`. A stepname that did not execute makes the expression false. |

### 1.3 DD statement keywords

Topic pages: "Chapter 12. DD statement" index (3.1 HTML ddst.htm lists 75 parameters); "DCB parameter" PDF p.172-173 / book p.126-127.
URL: https://www.ibm.com/docs/en/SSLTBW_3.1.0/com.ibm.zos.v3r1.ieab600/ddst.htm ; PDF as above.

| Claim | Quote | Verdict | Caveats |
|---|---|---|---|
| RECFM/LRECL/BLKSIZE top-level | "Alternate syntax for DCB keyword subparameters: All of the DCB keyword subparameters can be specified without the need to code DCB=." Also "KEYLEN, LRECL, and RECFM are described as DD parameters." | SUPPORTS [repo accepts RECFM, LRECL, BLKSIZE top-level] | Index page ddst.htm (3.1) separately lists BLKSIZE, LRECL, RECFM as DD parameters. |
| DSORG top-level | same alternate-syntax sentence; "DSORG=organization" is documented as a DCB subparameter (PDF p.~195 area, "DSORG subparameter of DD DCB parameter") | SUPPORTS (by the alternate-syntax rule) | DSORG is NOT in the 75-item DD parameter index; only legal top-level via the alternate syntax. Doc also: "Do not code the DSORG subparameter with DD parameters DDNAME, QNAME, RECORG." |
| DSNTYPE, STORCLAS, DATACLAS, MGMTCLAS, LABEL, FREE, DLM, REFDD, LIKE | All nine appear as DD parameters in the DD index (DSNTYPE xdddsnty.htm, STORCLAS xddstorc.htm, DATACLAS xdddatac.htm, MGMTCLAS xddmgmtc.htm, LABEL xddlabel.htm, FREE xddfree.htm, DLM xdddlm.htm, REFDD xddrefdd.htm, LIKE xddlike.htm); chapters in TOC (DSNTYPE p.171, FREE p.187, LABEL p.201, LIKE p.208, REFDD p.241, STORCLAS p.261). | CONTRADICTS [repo flags all as IEFC630I UNIDENTIFIED KEYWORD] | Repo DD_KEYWORDS has only 13 names; the real DD parameter list has 75 (AVGREC, BLKSZLIM, CCSID, EXPDT, RETPD, KEYLEN, RECORG, TERM, ...). |
| EXEC keywords | EXEC has PGM, PROC, PARM, COND, REGION, TIME plus ACCT, ADDRSPC, CCSID, DYNAMNBR, MEMLIMIT, PERFORM, RD, RLSTMOUT ... "A job can have a maximum of 255 job steps." (PDF p.359) | CONTRADICTS (minor) [EXEC_KEYWORDS = PGM, PROC, PARM, COND, REGION, TIME] | |

### 1.4 In-stream data, DLM, delimiter, null statement, columns, continuation

URLs: PDF as above. 3.1 HTML: xddaster.htm, xdddata.htm, xdddlm.htm.

| Topic / page | Quote | Verdict | Caveats |
|---|---|---|---|
| "* Parameter" (PDF p.141, book p.95) DD * end | "When DLM is not coded on this DD statement, /* in the input stream or // to indicate another JCL statement." | SUPPORTS [repo ends DD * at `/*` or any `//`] | |
| "DATA parameter" (PDF p.~135, book p.121) | 3.1 HTML: "Unlike a DD * statement, the data is not ended by the // that indicates another JCL statement." Ends at `/*` or DLM or end of input. Also: "Use a DATA parameter instead of the * parameter if any of the data records start with //." | CONTRADICTS [repo ends DD DATA at any `//` record too] | |
| "DLM parameter" (book p.160) | "Use the DLM parameter to specify a delimiter to terminate this in-stream data set." (3.1 HTML). Delimiter statement: "2 - 18 characters specified in a DLM parameter" (ch.14); DD * page says "the eight-character delimiter" (inconsistent in IBM text). | CONTRADICTS [DLM not in DD_KEYWORDS -> IEFC630I; regex `^(\*\|DATA)(,\|$)` ignores DLM] | JES2: with DLM on DD *, `//` also still ends data; on DD DATA only the delimiter ends it (3.1 HTML). |
| "Chapter 14. Delimiter statement" (PDF p.355, book p.309) | "A delimiter statement is optional: If the data is preceded by a DD * statement without a DLM parameter." Must appear "At the end of an in-stream data set that begins with a DD DATA statement." | SUPPORTS for `/*` ending DD * ; CONTRADICTS for DD DATA with //-lines | Delimiter cannot be continued. |
| Stray trailing `/*` after last step | JCL User's Guide (SA23-1386-70, ieab500_v3r2.pdf PDF p.33) example: "/* (optional) denotes the end of the job." | CONTRADICTS (likely) [repo gives IEFC605I for any non-`//` record outside in-stream data] | Reference manual itself only defines `/*` as data delimiter; the Guide example shows a trailing `/*`. |
| "Chapter 23. Null Statement" (PDF p.505, book p.459) | "Use the null statement to mark the end of a job." Syntax `//`; "Columns 3 through 72 must be blank." "The system ignores statements between a null statement and the next valid JOB statement." | SUPPORTS [repo stops at `//`] | Note: "JES2 ignores a NULL statement when it is included in a job's JCL statements. JES2 processes JES2 control statements following a NULL statement as part of the job." |
| Columns (PDF p.60-61, book p.14-15) | "Do not code fields, except on the comment statement, past column 71. Columns 73-80 are ignored" ; "maximum length of any JCL statement is limited to 8194 characters." | SUPPORTS [repo slices 72 chars] | Column 72 is the continuation indicator for comments; repo treats column 72 as text. |
| Continuation (PDF p.62-64, book p.16-17) | "Interrupt the field after a complete parameter or subparameter, including the comma ... at or before column 71"; "Code a blank character in column 3"; "Continue ... beginning in any column from 4 through 16." | SUPPORTS [comma then `// `] | Repo accepts operand text starting after any number of blanks (doc: columns 4-16). Doc column-3 rule says "blank or an asterisk"; repo treats `//*` after a comma-ending line as IEFC621I (doc silent on interleaved comments here: UNRESOLVED). Cannot continue: JCL command, comment, delimiter, null statements. |
| JOB statement (ch.21, PDF p.435-436, book p.389-390) | "A JOB statement has two kinds of parameters: positional and keyword." "A JOB statement can contain two positional parameters ... accounting parameter first, followed by the programmer's name" | SUPPORTS [repo uses positional "1" as NAME] | CLASS (PDF p.~471), MSGCLASS, NOTIFY, MSGLEVEL, TYPRUN all documented. Repo ignores TYPRUN: doc "TYPRUN= COPY/HOLD/JCLHOLD/SCAN"; SCAN = "scan this job's JCL for syntax errors, without running the job". MSGCLASS: "Use the MSGCLASS parameter to assign the job log to an output class." |
| EXEC PGM/PARM/PROC (ch.16, book p.313-336) | "An EXEC statement must contain one of the positional parameters: PGM, PROC, or procedure name." | SUPPORTS | PARM is "mutually exclusive with the PARMDD keyword". |
| Procedure not found timing | See IEFC612I (section 2): Source "Converter"; System action "ends the job, but scans the remaining job control statements"; IEFC452I: "the job will not be initiated; no steps will be processed." | CONTRADICTS [repo emits IEFC612I inside the step loop, so earlier steps in the same job can already have run] | |
| Temporary data sets (DSNAME, PDF p.210-211, book p.164-165) | "name for temporary data set: &&dsname" ; "Double ampersands to identify a temporary data set name." DISP page: "Specify a normal termination disposition of PASS or DELETE for a temporary data set." | CONTRADICTS (not supported) [parseDsnRef regex excludes `&`, returns null, so `DSN=&&TEMP` yields IEF212I DATA SET NOT FOUND] | repo behaviour inferred from catalog.ts line 39. |
| Referbacks (Backward references, PDF p.69, book p.23) | "*.stepname.ddname where the referenced statement ... is in an earlier step" | CONTRADICTS (not supported) [`DSN=*.STEP1.DD` -> null from parseDsnRef -> IEF212I] | |
| Concatenation (PDF p.138, book p.92; name field p.75) | "To concatenate data sets, omit the ddnames from all the DD statements except the first in the sequence." "You cannot concatenate output data sets." | CONTRADICTS [repo names unnamed DD `DDn` and does not concatenate] | |
| DD * allowed companion keywords (PDF p.141) | "All other parameters are either ignored or result in a JCL error." | DOESN'T ADDRESS repo (repo does not check) | |

### 1.5 Job / step termination

| Claim | Quote / source | Verdict |
|---|---|---|
| Step return code in IEF142I | IEF142I: "A step completed processing normally. The system issues this message to give the condition code from the step." | SUPPORTS [repo IEF142I COND CODE nnnn] |
| Flush after abend | see 1.2; IEF272I (Vol 8 p.184): "A previous step ended abnormally, but the current step did not specify EVEN or ONLY in the COND parameter" | SUPPORTS flush; CONTRADICTS lack of EVEN/ONLY |
| COND=EVEN/ONLY | see 1.2 | CONTRADICTS (not implemented) |
| S122/S222 never run later steps | "After certain types of abnormal termination ... remaining job steps are not executed, regardless of whether EVEN or ONLY were specified" (122, 222) (Considerations: Errors that prevent step execution, PDF p.376) | DOESN'T ADDRESS repo (repo has no cancel) |

---

## 2. Messages

Format per row: ID | book/volume + page | exact documented text | meaning | repo claim | verdict.
Release 3.2 for all. URLs are the PDFs named in the header notes.

### 2.1 Converter (IEFC) messages — z/OS MVS System Messages Vol 8 (IEF-IGD) SA38-0675-70, ieam800_v3r2.pdf

| ID (PDF p.) | Documented text and meaning (quote <=25 words) | Repo text | Verdict |
|---|---|---|---|
| IEFC605I (535) | `UNIDENTIFIED OPERATION FIELD` — "the system either could not find an operation field or could not identify the operation field as a valid JCL verb"; system ends the job; Source Converter. | `IEFC605I UNIDENTIFIED OPERATION FIELD` (also reused with invented texts "JOB STATEMENT NAME FIELD MISSING", "EXEC STATEMENT WITHOUT PGM OR PROC") | SUPPORTS base text; the two repo-invented variants are not real texts. Real missing-jobname message is IEFC635I `JOBNAME MISSING ON THE JOB STATEMENT. SPECIFY JOBNAME AND RE-SUBMIT.` (p.555). Also repo flags IF/THEN and non-`//` records with it. |
| IEFC606I | **Not found.** Vol 8 IEFC list jumps IEFC605I -> IEFC607I. No IEFC606I in any extracted volume. | `IEFC606I MISPLACED JOB STATEMENT / MISPLACED DD OR EXEC STATEMENT - NO JOB STATEMENT / MISPLACED DD STATEMENT` | CONTRADICTS (message ID does not exist in 3.2 Vol 8). Nearest real: IEFC019I `MISPLACED statement STATEMENT` (PDF p.514) and IEFC020I `DUPLICATE statement STATEMENT`; IEFC607I `JOB HAS NO STEPS`. |
| IEFC612I (539) | `PROCEDURE [procname] WAS NOT FOUND` — "The system could not find a procedure in the input stream procedure directory, in any library specified on the JCLLIB statement, or in the system procedure library concatenation." System action: "ends the job, but scans the remaining job control statements." Source Converter. | `IEFC612I PROCEDURE name WAS NOT FOUND` | SUPPORTS text; CONTRADICTS timing (conversion error, job not run). |
| IEFC621I (543-544) | `EXPECTED CONTINUATION NOT RECEIVED` — "found either a comma at the end of the last operand on a line or a nonblank character in column 72, but the next line was not a continuation." | same text | SUPPORTS. Note column-72 trigger not modelled. |
| IEFC630I (553) | `UNIDENTIFIED KEYWORD text` where text is like `IN THE parameter FIELD` or `ON THE cntr STATEMENT`; "a valid keyword was not consistent with the statement operation code; for example, DSNAME in an EXEC statement." | `IEFC630I UNIDENTIFIED KEYWORD DSNTYPE` style | PARTIAL: ID and base text right; trailing text format differs. Valid keywords wrongly rejected (see 1.3). |
| IEFC662I (570) | `INVALID LABEL` — "statement label in the name field is too long or contains an incorrect character." | same | SUPPORTS. |
| IEFC452I (532-533) | `text - JOB NOT RUN - JCL ERROR` where text is JOBFAIL / INVALID / jobname / procstep. "the job will not be initiated; no steps will be processed." "The error message appears in the SYSOUT data set." | `IEFC452I jobname - JOB NOT RUN - JCL ERROR`; also `IEFC452I JOB NOT RUN - NO JOB STATEMENT` | SUPPORTS main form; the NO JOB STATEMENT variant is invented (real: JOBFAIL/INVALID). |

### 2.2 IEF / IGD messages — Vol 8

| ID (PDF p.) | Documented text and meaning | Repo | Verdict |
|---|---|---|---|
| IEF212I (146-147) | `jobname [procstep] stepname ddname[+ xxx] - DATA SET NOT FOUND` — names **job, step and DD**, not the data set. Causes include "The data set was not cataloged or passed." System action: "The system ends the job." Source Allocation. | `IEF212I job step dd - DATA SET NOT FOUND` (also with other error strings: `... - <allocation error>`) | Format SUPPORTS. Claim "names the data set" CONTRADICTED: the message does not name the DSN (lesson text asks "which DD, which data set?", correct since DSN must be read from the DD). Repo reuses IEF212I with non-NOT-FOUND suffixes (not real). |
| IEF272I (184) | `jobname [procstep] stepname - STEP WAS NOT EXECUTED` — "An error appeared in a job control statement." "A previous step ended abnormally, but the current step did not specify EVEN or ONLY" ; "required I/O devices, volumes, or space that could not be allocated." | same | SUPPORTS. |
| IEF374I (245) | `STEP/stepname/STOP yyyyddd.hhmm CPU xxxx MIN xx.xx SEC SRB xxxx MIN xx.xx SEC VIRT xxxxK SYS xxxxK EXT xxxxK SYS xxxxK` — "SMF issues this message to give information about the step." **No return code in the text.** JCL UG sample (ieab500 p.33): `IEF374I STEP /STEP1 / STOP 1996286.1521 CPU 0MIN 00.01SEC SRB 0MIN 00.00SEC VIRT 4K SYS 180K EXT 4K SYS 9424K` | `IEF374I STEP/name/STOP <date> RC=0000` | CONTRADICTS (RC= is not part of IEF374I; the code is in IEF142I). Also repo uses a calendar date where doc has yyyyddd.hhmm. |
| IEF142I (111) | `jobname [procstep] stepname STEP WAS EXECUTED - COND CODE cde` | `IEF142I job step - STEP WAS EXECUTED - COND CODE 0000` | SUPPORTS (JCL UG sample prints a " - " after stepname). |
| IEF285I (196-197) | `dsname dsp rc VOL SER NOS= ser,...` ; dsp is one of CATALOGED, DELETED, HDELETED, KEPT, PASSED, RECATALOGED, SUBSYS, SYSIN, SYSOUT, UNCATALOGED. | `IEF285I   dsn  KEPT/CATALOGED/DELETED` then `IEF285I   VOL SER NOS= vol.` | SUPPORTS; PASSED/UNCATALOGED/SYSIN/SYSOUT not produced. |
| IEF376I (246) | `JOB/jobname/STOP yyyyddd.hhmm CPU xxxx MIN xx.xx SEC SRB xxxx MIN xx.xx SEC` | `IEF376I  JOB/name/STOP <date> CPU=0MIN 00.01SEC` | PARTIAL: ID right; repo layout (`CPU=0MIN`, no SRB, date) differs from `CPU xxxx MIN xx.xx SEC SRB ...`. |
| IEF236I (163) | `ALLOC. FOR jobname [procstep] stepname` | same | SUPPORTS. |
| IEF237I (164) | `dev ALLOCATED TO ddname` ; dev = device number, or "DMY: A DD DUMMY was allocated", subsystem name (e.g. JES2) for SYSIN/SYSOUT, VIO, TRM, QNM. | repo: `JES2 ALLOCATED TO dd` for SYSOUT/in-stream **and for DUMMY**; `<volser> ALLOCATED TO dd` for data sets | DUMMY: CONTRADICTS (should be DMY). Data sets: CONTRADICTS (device number, not volume serial). SYSOUT/SYSIN JES2: SUPPORTS. |
| IEF450I (270) | `jobname [procstep] stepname - ABEND {Scde \| Ucde} REASON=xxxxxxxx [TIME=hh.mm.ss]` ; "A job step abnormally ended." Action: "ends the job and issues message IEF472I". | `IEF450I job step - ABEND=S806 U0000 REASON=00000004` | DIFFERS from the documented template (no `=` after ABEND; Scde or Ucde alternatives, not both). Document is the authority in this audit; flag for review, not a hard error. |
| IEF403I (259) | `jobname-STARTED [-TIME=hh.mm.ss]` ; JCL UG sample: `IEF403I SORT - STARTED - TIME=15.21.28` | `IEF403I job - STARTED` | PARTIAL: ID, meaning right; TIME= omitted. Note book says "In response to a MONITOR JOBNAMES command" but the JCL UG shows it in every JESMSGLG. |
| IEF404I (259-260) | `jobname-ENDED [-TIME=hh.mm.ss]` ; sample `IEF404I SORT - ENDED - TIME=15.21.28` | `IEF404I job - ENDED` | PARTIAL, same. |
| IGD101I (1396) | `SMS ALLOCATED TO DDNAME ddname DSN dsname STORCLAS scname MGMTCLAS mcname DATACLAS dcname text` where text is `VOLSER NOS= volid{,volid...}`; "A new SMS managed data set was created". | three-line form `(ddname) / DSN (dsn) / STORCLAS (..) MGMTCLAS (..) DATACLAS (..)` | PARTIAL: fields right; parenthesised layout and missing `VOLSER NOS=` differ from doc. |
| IGD17101I (1560) | `DATA SET dsname NOT DEFINED BECAUSE DUPLICATE NAME EXISTS IN CATALOG RETURN CODE IS rc REASON CODE IS rsnc IGG0CLxx` ; "The SMS VTOC data set services define request fails." See IDC3009I. | `IGD17101I DATA SET dsn` / `NOT DEFINED BECAUSE DUPLICATE NAME EXISTS IN CATALOG` | PARTIAL: omits RETURN CODE/REASON CODE text; two-line split is a layout choice. |

### 2.3 CSV / IEA — Vol 4 (CBD-DMO) SA38-0671-70 ieam400_v3r2.pdf; Vol 6 (GOS-IEA) SA38-0673-70 ieam600_v3r2.pdf

| ID (PDF p.) | Documented text | Repo | Verdict |
|---|---|---|---|
| CSV003I (Vol 4 p.1835) | `REQUESTED MODULE mod NOT FOUND` — "could not find the module entry point, mod, that a LINK, XCTL, ATTACH, or LOAD macro specified." Task ends. | `CSV003I REQUESTED MODULE x NOT FOUND` | SUPPORTS. |
| CSV028I (Vol 4 p.1854) | `[ABENDcde-return-code] JOBNAME=jjj STEPNAME=sss` ; "follows a related message (of the format CSV0xxI)". | `CSV028I ABEND806-04 JOBNAME=j STEPNAME=s` | SUPPORTS (doc shows `ABENDcde-return-code`, repo's `ABEND806-04` fits). |
| IEA995I (Vol 6 p.1492) | `SYMPTOM DUMP OUTPUT text`, text = `{SYSTEM\|USER} COMPLETION CODE=cde [REASON CODE=reason-code] TIME=... SEQ=... ASID=...` ; issued "when a SYSABEND, SYSUDUMP, or SYSMDUMP is requested". | `IEA995I SYMPTOM DUMP OUTPUT  SYSTEM COMPLETION CODE=806  REASON CODE=00000004` | PARTIAL: only issued if a dump DD (SYSUDUMP/SYSABEND/SYSMDUMP) exists; repo issues it unconditionally, and omits TIME/SEQ/CPU/ASID lines. |

### 2.4 JES2 messages — z/OS JES2 Messages SA32-0989-70 (hasa100_v3r2.pdf)

| ID (PDF p.) | Documented text | Repo | Verdict |
|---|---|---|---|
| $HASP100 (125) | `$HASP100 jobname ON devname programmer FROM text` ; "A JOB statement has been detected in the input stream from the indicated device, and JES2 has assigned the associated job a JES2 job identifier." If devname is INTRDR it also shows ijobid, ijobname. | ` $HASP100 JOB ON INTRDR   FROM TSU00001 USER` | PARTIAL: consistent shape; doc says the jobid may precede the message ("JES2 message format" p.15). |
| $HASP373 (307) | `jobname STARTED - INIT init - CLASS class - SYS sysname` ; "The specified job is starting to run." | `$HASP373 job STARTED - INIT 1    - CLASS A - SYS SYS1` | SUPPORTS. |
| $HASP395 (310) | `jobname ENDED` / `jobname ENDED RC= nnnn` / `jobname ENDED ABEND= Sxxx` / `ABEND= Udddd` ; JCL UG sample shows `$HASP395 SORT  ENDED`. No "JCL ERROR" variant listed. | `$HASP395 job ENDED - RC=0000`, `- ABEND=S806`, `- JCL ERROR` | PARTIAL: RC/ABEND variants match; `ENDED - JCL ERROR` is not a documented $HASP395 form (and repo skips $HASP395 for conversion errors, which is consistent). JES2 does document `$HASP165 jobname ENDED AT nodename - JCL ERROR` (p.173-174) for JCL errors. |

### 2.5 Data management / utility messages — Vol 6/7 and utility books

| ID (PDF p.) | Documented text | Repo | Verdict |
|---|---|---|---|
| IEC130I (Vol 7 p.378) | `ddname - DD STATEMENT MISSING` — OPEN issued for a DCB whose ddname is not on any DD statement. "Processing continues. However, an abnormal end is likely." | ` IEC130I SYSUT1 DD STATEMENT MISSING` (no " - ") then RC 12 | PARTIAL: dash missing; a real IEBGENER run would normally abend/ end per OPEN failure, repo returns RC 12. |
| IEB351I (Vol 7 p.186) | `I/O ERROR jjj, sss, ddd, devtyp, ddname, op, err, xxxx, acc` — "A permanent input/output error occurred"; "The return code is 12." | `IEB351I <ddname: NO DATA SET NAME / not found...>` | CONTRADICTS meaning: IEB351I is a permanent I/O error (SYNADAF text), not a data-set-not-found message. RC 12 is right. |
| IDC3012I (Vol 6 p.768) | `ENTRY entname NOT FOUND` | `IDC3012I ENTRY name NOT FOUND` | SUPPORTS. |
| IDC0550I (Vol 6 p.607) | `ENTRY (x) dsname DELETED` ; x=A for non-VSAM. | `IDC0550I ENTRY (A) name DELETED` | SUPPORTS. |
| IDC0551I (p.607) | `** ENTRY dsname NOT DELETED` | same | SUPPORTS. |
| IDC3203I (p.796) | `ITEM 'xxx' DOES NOT ADHERE TO RESTRICTIONS` — xxx is the offending constant; "Processing skips to the end of the command." | `IDC3203I ITEM DOES NOT ADHERE TO RESTRICTIONS` (no item) | PARTIAL (item text missing). |
| IDC3009I (p.~714) | `... catalog RETURN CODE IS return-code - REASON CODE IS IGGOCLaa - reason-code sfi` ; catalog management return/reason code. | not produced | DOESN'T ADDRESS (IGD17101I points to it). |
| IDC3003I (p.712) | `FUNCTION TERMINATED. CONDITION CODE IS cde.` | `IDC3003I FUNCTION TERMINATED. CONDITION CODE IS 12` (no final period) | PARTIAL. |
| IDC0001I / IDC0002I (p.587) | `FUNCTION COMPLETED, HIGHEST CONDITION CODE WAS cde` ; `IDCAMS PROCESSING COMPLETE. MAXIMUM CONDITION CODE WAS cde` | same | SUPPORTS. Note: LISTCAT with no matching entries gives CC 4 (doc note under IDC0001I). Repo RC 4 for empty list SUPPORTS. |

### 2.6 DFSORT messages — z/OS DFSORT Messages, Codes and Diagnosis Guide SC23-6879-70 (icem100_v3r2.pdf)

| ID (PDF p.) | Documented text | Repo | Verdict |
|---|---|---|---|
| ICE000I (31) | `- CONTROL STATEMENTS FOR 5655-ZOS, Z/OS DFSORT vr - hh:mm ON day mmm dd, yyyy-` | `ICE000I 0 - CONTROL STATEMENTS FOR 5650-ZOS, Z/OS DFSORT (SIMULATED)` | CONTRADICTS product number: doc says **5655-ZOS**, repo prints 5650-ZOS. Also text lacks date/time. |
| ICE007A (32) | `SYNTAX ERROR` — "Critical. A control statement contained an error in syntax." Program terminates. | `ICE007A SYNTAX ERROR ON CONTROL STATEMENT` | PARTIAL: real text is just `SYNTAX ERROR`. |
| ICE026A | **Does not exist.** Only `ICE026I SMF RECORD NOT WRITTEN TO THE SMF DATA SET (RC=nn)` (p.38). | `ICE026A 0 SORTIN DD STATEMENT MISSING` etc. | CONTRADICTS. Closest real message for a missing DD: `ICE056A ddname NOT DEFINED` — "Critical. A required DD statement was not supplied." (p.47). |
| ICE201I (85) | `RECORD TYPE IS x - DATA STARTS IN POSITION y` ; F -> 1, V -> 5. | `ICE201I 0 RECORD TYPE IS F - DATA STARTS IN POSITION 1` | SUPPORTS. |
| ICE054I (47) | `RECORDS-IN: n, OUT: n2` (as extracted) — records read / written to SORTOUT. | `ICE054I 0 RECORDS - IN: n, OUT: n` | SUPPORTS (spacing in PDF extraction uncertain). |
| ICE055I (47) | `INSERT n, DELETE n` | `ICE055I 0 INSERT 0, DELETE 0` | SUPPORTS. |
| ICE052I (46) | `END OF DFSORT` ; "The program completed." | `ICE052I 0 END OF DFSORT`, `ICE052I 3 END OF DFSORT` on error | SUPPORTS. |

## 3. Abend codes — z/OS MVS System Codes SA38-0665-70 (ieah700_v3r2.pdf)

| Code (PDF p.) | Documented meaning | Verdict vs repo |
|---|---|---|
| S806 (512) | "The supervisor ... detected an error during the processing of a LINK(X), XCTL(X), ATTACH(X), or LOAD macro". Reason 04: "The system could not find the module, whose entry point is the value of the EP or EPLOC operand, in the indicated library". Accompanied by CSV003I (reason 04). Also "The system issues an ABEND dump." | SUPPORTS [repo: unknown program -> CSV003I + S806-04] |
| S0C7 (212) | "Data exception." | DOESN'T ADDRESS (not simulated) |
| S013 (35) | "The error occurred during processing of an OPEN macro instruction ... accompanied by message IEC141I." | DOESN'T ADDRESS |
| S222 (339) | "The operator, or an authorized time sharing option extensions (TSO/E) user, canceled the job without requesting a dump." | DOESN'T ADDRESS |
| S322 (386) | "The system took a longer time to run a job or job step than the time specified in ... The TIME parameter of the EXEC or JOB statement." | DOESN'T ADDRESS |
| S722 (496) | Reason 00: output limit exceeded (OUTLIM on SYSOUT DD, JOBPARM LINES/CARDS, STANDARDS). Reason 04: "The job has exceeded its SPOOL space limit". | DOESN'T ADDRESS |
| S913 (529-530) | "The error occurred during processing of an OPEN macro instruction." Accompanied by IEC150I (IEC150I text: 913-rc ... ; password-protected data set or checkpoint/VSAM-with-DCB cases; Vol 7 p.422). | DOESN'T ADDRESS |
| SB37 (571) | "The error was detected by the end-of-volume routine" with IEC030I. IEC030I rc 04: "all space was used on the current volume and no more volumes were specified" (and extent/track limits). | DOESN'T ADDRESS |
| SD37 (600) | "an output operation to a direct access device was requested", message IEC031I; IEC031I rc 04: "A data set opened for output used all the primary space, and no secondary space was requested." | DOESN'T ADDRESS |

(All of the above are doc-only; the repo only produces S806.)

## 4. JES2 / SDSF formats

| Topic | Source / page | Quote | Verdict |
|---|---|---|---|
| Job id format and rollover | JES2 Initialization and Tuning Reference SA32-0992-70, "JOBDEF" RANGE parameter, hasa400_v3r2.pdf PDF p.205 (book p.185); table default `RANGE 1-9999`, range 1-999999 | "setting the upper limit above 99,999 causes the JOBID format to change from CCCNNNNN to C0NNNNNN where CCC is either JOB, STC, or TSU, and C is J, S, or T." | SUPPORTS "J + 7 digits" only as `J0NNNNNN` (letter J, a 0, six digits), and only when installation RANGE upper limit > 99999. It is NOT an automatic format change at 99999; JES2 assigns numbers from the configured RANGE (default per table 1-9999 as extracted; verify on a live system). Repo `jobIdFor` not read. |
| JESMSGLG / JESJCL / JESYSMSG purpose | JCL Reference OUTPUT JCL JESDS parameter (PDF p.555-556) | "JESMSGLG data set, which contains the JES and operator messages"; "JESJCL data set, which contains the JCL statements"; "JESYSMSG ... any JCL error messages and any system messages for this job." | SUPPORTS. JCL UG p.33 sample: JESMSGLG header `J E S 2   J O B   L O G  --  S Y S T E M  AQTS  --  N O D E  PLPSC`. |
| Typical line format | JCL UG ieab500 PDF p.33 sample | ` 15.21.28 JOB17653  IRR010I  USERID userid   IS ASSIGNED TO THIS JOB.` | CONTRADICTS repo [repo prefix is a date `${day}` with no job id; docs show `hh.mm.ss JOBnnnnn` prefix on JESMSGLG lines]. JESYSMSG lines have no prefix (SUPPORTS repo). Statement lines in JESJCL: sample ` 1 //SORT JOB ...` (statement number, then JCL) SUPPORTS. |
| JES2 message format | JES2 Messages p.15 | `[hh.mm.ss] [sysname] {jobid} ... $HASPnnn text` | time stamp, system name and jobid are optional console-format prefixes. |
| Job statuses INPUT/ACTIVE/OUTPUT | SDSF User's Guide SC27-9028-70, "Values for the PhaseName and Queue Columns", Table 286, isfa600_v3r2.pdf PDF p.362-363 | Queue values include INPUT, CONVERSION, SETUP, EXECUTION, PRINT, OUTPUT, PURGE, XMITTER; phases include "EXECUTING: Scheduled on main", "INPUT: Active in input processing". | PARTIAL/CONTRADICTS: no queue named ACTIVE; executing jobs are on the EXECUTION queue. Max-RC values (p.~358): "CC xxxx", "JCL ERROR", "ABENDUxxxx or ABEND Sxxx", "CANCELED", "CONV ABEND", "SEC ERROR", "SYS FAIL" — SUPPORTS repo Max-RC text. |
| Job failing JCL conversion visible in SDSF O/H? | IEFC452I: "The error message appears in the SYSOUT data set." JCL Reference TYPRUN=JCLHOLD: "the job completes JCL processing and then is placed in the OUTPUT queue" (when error messages are pending). SDSF UG: "you can use SDSF to review the output and correct JCL errors." | SUPPORTS (indirect): a job with a JCL error ends with spool output (JESMSGLG/JESJCL/JESYSMSG) on the output queue. The documents do not explicitly say "visible on the O/H panel" for MSGCLASS held/non-held; held vs non-held depends on MSGCLASS (UNRESOLVED detail). |

## 5. Utilities

| Topic | Source | Quote / finding | Verdict vs repo |
|---|---|---|---|
| IEFBR14 | JCL UG (ieab500 PDF p.32-33) | "IEFBR14 is the name of a program within your MVS system. It does not actually process any data" | SUPPORTS [RC 0, allocation/disposition do the work]. DFSMSdfp Utilities also says data sets can be deleted via "an IEFBR14 job" (idau100 p.~) |
| IEBGENER DDs | DFSMSdfp Utilities SC23-6864-70, ch.7, Table 29 (PDF p.185-186 / book p.153-154) | "SYSPRINT DD Defines a sequential data set for messages." "SYSUT1 DD Defines the input data set." "SYSUT2 DD Defines the output data set." "SYSIN DD Defines the control data set, or specifies DUMMY when the output is sequential and no editing is specified." | SUPPORTS. |
| DCB inheritance SYSUT1 -> SYSUT2 | same, "SYSUT2 DD Statement" (PDF p.188, book p.156) | "When the data set is on DASD or tape and record format and logical record length are not specified in the JCL for the output data set, and the data class does not supply them, values for each are copied from the input data set." Table 30 gives RECFM/LRECL/BLKSIZE combinations. IEB352I: "WARNING: ONE OR MORE OF THE OUTPUT DCB PARMS COPIED FROM INPUT". | DOESN'T ADDRESS repo (repo copies records only, writes via saveRecords; attributes not shown) |
| Default SYSUT1 attributes | same (PDF p.187) | "The default record format is undefined (U) for the input data set." "a default logical record length of 80 is used." | DOESN'T ADDRESS |
| IEBGENER SYSPRINT text | Utilities + Messages Vol 7 | **No text "n RECORDS COPIED FROM SYSUT1 TO SYSUT2" or "PROCESSING ENDED AT EOD" found** in idau100 or ieam700 (grepped). IEBGENER messages documented in Vol 7 as IEB3xx (e.g. IEB311I `CONFLICTING DCB PARAMETERS`, IEB352I). | INSUFFICIENT: repo texts are unverified against 3.2 documents. |
| IEBGENER return codes | Utilities appendix | 00 success; 04 "Probable successful completion. A warning message is written."; 12 "unrecoverable error exists and the job step is stopped". | SUPPORTS RC 12 for errors. |
| DFSORT SORT FIELDS syntax | DFSORT Application Programming Guide SC23-6878-70, "SORT control statement" (PDF p.449-453, book p.421-424) | "FIELDS=( p,m,f,s )"; "specifies how the control field is to be ordered ... A ascending, D descending, E ..." ; also `FIELDS=COPY`. | SUPPORTS [`SORT FIELDS=(p,l,fmt,A\|D)`, COPY]. Repo ignores `f` (format). |
| Format codes | Table 64 | CH "Character"; ZD "Signed zoned decimal"; PD "Signed packed decimal"; BI "Unsigned binary"; also AQ, FI, FL, AC ... | CONTRADICTS [repo treats every format as character compare; ZD/PD/BI semantics not implemented]. |
| Collating | Guide ch.1 (PDF p.33) and App. D Table 109/110 (PDF p.860-868) | "DFSORT uses EBCDIC, the standard IBM collating sequence, or the ASCII collating sequence when sorting". "The collating sequence for character data and binary data is absolute". EBCDIC Table 109: a=129, A=193, 0=240. | CONTRADICTS [repo compares JS UTF-16 strings, i.e. ASCII-like: digits < upper < lower]. In EBCDIC lowercase < uppercase < digits. |
| DFSORT SORT also accepts | SORT control statement | "DFSORT accepts but does not process the following SORT operands: WORK=value and ORDER=value." | DOESN'T ADDRESS |
| IDCAMS LISTCAT output | Access Method Services Commands SC23-6846-70, "LISTCAT Output Listing" (idai200 PDF p.~410, ln.20225) | header line `LISTING FROM CATALOG -- ICFUCAT1`; entry lines `NONVSAM ------- USER.MODEL`; summary `THE NUMBER OF ENTRIES PROCESSED WAS:` ... `IDC0001I FUNCTION COMPLETED, HIGHEST CONDITION CODE WAS 0`, `IDC0002I ...`. `IN-CAT --- catname` lines appear only in the ALL (detailed) form. | PARTIAL/CONTRADICTS: repo prints `IN-CAT --- CATALOG.USER` under every default entry (doc: only with ALL), omits `LISTING FROM CATALOG -- name` header and the entries-processed trailer. `NONVSAM -------` prefix SUPPORTS. LISTCAT `LEVEL(level)`: "specifies the high-level qualifiers" (SUPPORTS). |
| IDCAMS DELETE | IDC messages | not found: `IDC3012I ENTRY name NOT FOUND`, `IDC0551I ** ENTRY name NOT DELETED`, CC 8; found: `IDC0550I ENTRY (A) name DELETED` | SUPPORTS. |

## 6. Summary of unresolved / insufficient items

1. IEFC606I does not exist in 3.2 Vol 8 (repo uses it for MISPLACED statements; use IEFC019I or IEFC605I/IEFC607I as appropriate).
2. ICE026A does not exist; only ICE026I (SMF). Use ICE056A for missing DD.
3. IEBGENER SYSPRINT lines ("n RECORDS COPIED...", "PROCESSING ENDED AT EOD") not found in the Utilities or Vol 7 text: unverified.
4. IEF450I: book template `ABEND {Scde|Ucde} REASON=xxxxxxxx` differs from repo `ABEND=S806 U0000 REASON=00000004`; flagged for the caller (book is authority here, no further evidence fetched).
5. Interleaved `//*` comment lines between continuation lines: doc says column 3 may be "a blank or an asterisk" but not explicit; UNRESOLVED.
6. JES2 default job-number RANGE (1-9999 as extracted from the PDF table) should be sanity-checked before being taught; the documented format switch is J0NNNNNN when RANGE upper limit > 99,999.
7. Whether SDSF shows a JCL-error job on O vs H depends on MSGCLASS; docs only say output goes to the output queue.
