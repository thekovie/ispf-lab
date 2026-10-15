# M3 claim-level evidence matrix (lessons 29-36)

**Date:** 2026-10-15. **Status of this document:** a *second-pass AI source examination*. A fresh-context examiner re-read every cited passage in the local text extracts of the IBM PDFs and judged each claim against the lesson text; it did not rely on the spec's citations. **This is not the independent review** required by the authoring standards (section 9): no human and no second organisation has checked any row. Every verdict below must be re-checked by the independent reviewer.

Verdicts: **SUPPORTED** (the passage says this) · **PARTIAL** (supports a narrower or different statement) · **NOT-SUPPORTED** (passage does not say it or contradicts it) · **INFERRED** (follows only by reasoning) · **SIMULATOR-ONLY** (a statement about the simulator, not IBM) · **UNVERIFIED** (no source found).
"Fix" says what was changed in the lesson after the examination; rows marked *fixed* are covered in the "Resolution" column of the per-lesson findings in `m3-verification-report.md`.

## Sources used (printed page = PDF page minus offset, derived from page footers)

| Short | Document | Release / edition | Offset | URL in the register |
|---|---|---|---|---|
| UG1 | z/OS ISPF User's Guide Vol I, SC19-3627-70 (SRC-013) | z/OS 3.2, updated 2025-09-30 | 28 | https://www.ibm.com/docs/SSLTBW_3.2.0/com.ibm.zos.v3r2.f54ug00/abstract.htm (book level only) |
| UG2 | z/OS ISPF User's Guide Vol II, SC19-3628-70 (SRC-014) | z/OS 3.2, updated 2026-04-27 | 38 | none (book level) |
| EDIT | z/OS ISPF Edit and Edit Macros, SC19-3621-70 (SRC-012) | z/OS 3.2, updated 2026-06-22 | 32 | https://www.ibm.com/docs/en/SSLTBW_3.2.0/com.ibm.zos.v3r2.f54em00/submit.htm |
| TSO-CR | z/OS TSO/E Command Reference, SA32-0975-70 (SRC-015) | z/OS 3.2, updated 2025-09-30 | 26 | none (book level) |
| RB | Introduction to the New Mainframe: z/OS Basics, SG24-6366-02 (SRC-001) | Third Edition, March 2011 (z/OS 1.x era) | 24 | https://www.redbooks.ibm.com/abstracts/sg246366.htm |

The register has no per-topic URLs for UG1, UG2 or TSO-CR; the HTML topic pages were not fetched. A reviewer should add topic URLs.

## a-01-panel-fields-scroll

| ID | Where | Claim | Verdict | Source | Quote / note | Fix |
|---|---|---|---|---|---|---|
| a-01-C01 | teaches[0], step open | The Scroll ===> field holds the scroll amount; type over it to change it | SUPPORTED | UG1 ch.2 p.17 | "Indicates the scroll amount (if scrolling applies). You can type over it to change it." | none |
| a-01-C02 | step open explanation | Scroll is a short field "on line 2, after Command ===>"; many panels carry one; it says how far each scroll key moves | PARTIAL | UG1 p.59, p.16; UG2 p.28; EDIT Figs 3-4 | Real ISPF default puts the Command line at the bottom, not line 2. "Many panels" and "how far each scroll command moves" are supported (p.59) | *fixed*: line 2 labelled as the simulator's layout |
| a-01-C03 | teaches[1], step page | PAGE is a full screen; data moves one full page | SUPPORTED (loose) | UG1 p.17, p.59 | p.59: page = amount of information currently visible; PF-key lines are not part of the page | *fixed*: "full page of the visible data" |
| a-01-C04 | teaches[1], step half | HALF is half the scrollable area | SUPPORTED | UG1 p.17, p.59 | "Scroll by half the number of lines or columns in the scrollable area." | none |
| a-01-C05 | teaches[1] | A number is that many lines | SUPPORTED | UG1 p.17 | "A number of lines or columns (between 0 and 9999)." | none |
| a-01-C06 | step page | PF8 moves the data down | SUPPORTED | UG1 p.25; EDIT p.10 | "F8 Forward. Moves the screen down the scroll amount." | none |
| a-01-C07 | step page | The Scroll field shows PAGE at the start | SIMULATOR-ONLY | EDIT Figs 3-4 show `Scroll ===> CSR`; no source gives the real initial Edit amount | Simulator seeds it from the option 0 default | *fixed*: labelled as the simulator's starting value |
| a-01-C08 | step half | Typing over the field changes the amount until changed again | SUPPORTED | UG1 p.60 | "the new value remains in effect until you change it again." | none |
| a-01-C09 | teaches[2], step once | `DOWN 3` is a temporary one-time override; data moves 3 lines | SUPPORTED | UG1 p.60 | "...Command ===> UP 3 ... a temporary, one-time override of the scroll amount." (example is UP) | none |
| a-01-C10 | step once | The field is not touched and still says HALF | INFERRED | UG1 p.60 | follows from "temporary override" | kept |
| a-01-C11 | teaches[3] | MAX goes to the end of the data, once | PARTIAL | UG1 p.17 | MAX goes to the limit of the data in the scroll direction (UP MAX = top) | *fixed*: "in the direction you scroll" |
| a-01-C12 | step max, Challenge | `DOWN MAX` shows the last page; applies to that scroll only; the field stays HALF | SUPPORTED | UG1 p.17, p.60 | "MAX only applies to the next scroll command... reverts to the previous setting." | none |
| a-01-C13 | step max | Real ISPF keeps separate saved amounts for Browse, Edit/View and member lists | SUPPORTED | UG1 p.60, p.9 | p.60 three values (ZSCBR, ZSCED, ZSCML); p.9 lists Data Set List too | *fixed*: spec says "at least three" |
| a-01-C14 | step max | DATA and CSR also scroll a full page *here* | SIMULATOR-ONLY (labelled) | UG1 p.17, p.59-60 | real DATA = one line less than a page; CSR moves to the cursor | kept, labelled |
| a-01-C15 | step max | The "number, then scroll key" form is not supported here | SIMULATOR-ONLY (labelled) | UG1 p.60 | real ISPF supports it | kept, labelled |
| a-01-C16 | step max, spec | One amount per edit session; only the Edit field can be changed | SIMULATOR-ONLY | n/a | | kept |
| a-01-C17 | step leave | PF3 leaves; nothing changed so nothing to save | INFERRED | UG1 p.24; EDIT p.11 | not stated for the no-change case | kept |
| a-01-C18 | Challenge, objective | HALF, scroll, one-time MAX, field still HALF | SUPPORTED | C08, C12 | | none |
| a-01-C19 | spec | Valid amounts: number 0-9999, PAGE, HALF, DATA, CSR, MAX | PARTIAL | UG1 p.17 vs p.59 | field limited to 4 digits; command accepts larger | *fixed* in spec |
| a-01-C20 | spec (common mistakes) | "MAX typed in the field is one-time only when given with the scroll command" | **NOT-SUPPORTED (contradicted)** | UG1 p.17, p.60 | "The value MAX is an exception. Following a MAX scroll, the scroll amount reverts to its previous value." | **fixed**: spec corrected and simulator now reverts a field MAX after one scroll (regression test) |
| a-01-C21 | spec | `COMMAND NOT RECOGNIZED` for HALF typed on the command line | SIMULATOR-ONLY / UNVERIFIED | EDIT p.13 | message text is the simulator's own | kept, labelled simulated |

## b-02-dataset-types

| ID | Where | Claim | Verdict | Source | Quote / note | Fix |
|---|---|---|---|---|---|---|
| b-02-C01 | step seq | Traditional z/OS data sets are made of records, not a byte stream | SUPPORTED | RB 5.8 p.211 | "Traditional z/OS data sets are record oriented. In normal usage, there are no byte stream files" | none |
| b-02-C02 | step seq | Every record is fixed or variable length | PARTIAL | RB p.211-212 | the Redbook list includes RECFM U | *fixed*: "fixed or variable (or undefined)" |
| b-02-C03 | step seq | In the editor each line is a record | SUPPORTED | RB p.211 | "When editing a data set with ISPF, for example, each line is a record." | none |
| b-02-C04 | step seq | FB = fixed-length records grouped in blocks | SUPPORTED | RB p.212 | "FB (Fixed Blocked) Several logical records are combined into one physical block." | none |
| b-02-C05 | teaches[3], step seq | FB with LRECL 80 is the usual choice for source and JCL | PARTIAL | RB p.212, p.216, p.277 | FB is "commonly used for fixed-length records"; JCL is 80-byte card images. LRECL 80 for *source* is not stated | *fixed*: "conventional for JCL (80-byte card images) and widely used for source" |
| b-02-C06 | step seq, spec | Zero directory blocks means a sequential data set | **PARTIAL (true only in a sub-case)** | UG2 3.2 p.107-108; RB Fig 4-5 footnote p.172 | p.107: PS when zero, PO when greater; p.108: with LIBRARY and zero directory size ISPF allocates a PDSE | **fixed**: "with Data set name type blank, zero directory blocks gives a sequential data set"; spec corrected |
| b-02-C07 | step seq | 3.2 > A with Record format, Record length, Directory blocks | SUPPORTED | UG2 p.102-108 | | none |
| b-02-C08 | teaches[0] | A sequential data set (PS) is one stream of records | SUPPORTED (wording) | RB 5.9.1 p.215 | "records stored in physical order and processed in sequence" | *fixed*: "records in order" |
| b-02-C09 | step lib, teaches[1] | PDS: members, names up to 8 characters, a directory entry per member, organization PO | SUPPORTED | RB 5.9.2 p.215 | | none |
| b-02-C10 | step lib | Directory blocks reserve the directory | SUPPORTED | RB p.217; UG2 p.107 | "its size is fixed when the data set is allocated" | none |
| b-02-C11 | step lib | Most of what you edit in ISPF lives in libraries | PARTIAL | RB p.216 | only "A primary use of ISPF is to create and manipulate PDS data sets." | *fixed* |
| b-02-C12 | teaches[2], step compare | A PDSE is a library with a different internal format | SUPPORTED | RB 5.9.3 p.218 | | none |
| b-02-C13 | step compare | PDSE directory grows by itself | SUPPORTED | RB p.217 | "The directory can expand automatically as needed" | none |
| b-02-C14 | step compare | PDSE reuses space of deleted members; needs no compress | SUPPORTED | RB p.217; UG2 p.153 | "You do not need to compress a PDSE." | none |
| b-02-C15 | step compare | The 3.4 list shows organization, record format and record length | PARTIAL (over-general) | UG2 3.4 p.130, p.134-136 | only the Attributes view shows Dsorg, Recfm, Lrecl; default is the Volume view | *fixed*: names the Attributes view; simulator's single combined view labelled simulated |
| b-02-C16 | step compare | "A PDSE would look like a PDS here" | **NOT-SUPPORTED (contradicted)** | UG2 p.140, Fig 88 p.136 | 3.4 Dsorg shows `PO-E` for a PDSE | **fixed**: "a PDSE shows PO-E where a PDS shows PO" |
| b-02-C17 | step compare | This simulator cannot create a PDSE | SIMULATOR-ONLY (labelled) | UG2 p.108 | LIBRARY allocates a PDSE in real ISPF | kept |
| b-02-C18 | step info-lib | Data Set Information shows organization PO, directory blocks, member count | SUPPORTED | UG2 3.1 I, Fig 61 p.93 | | none |
| b-02-C19 | step info-lib | For a library it shows "name type PDS" | PARTIAL | UG2 Fig 61 p.93, Fig 65 p.97 | PDS value pictured only on the short panel for managed volumes | *fixed* |
| b-02-C20 | step info-lib | A real PDSE shows name type LIBRARY and NOLIMIT directory blocks | SUPPORTED | UG2 p.94, Fig 63 p.95 | | none |
| b-02-C21 | step info-lib | ...because its directory has no fixed size | INFERRED | RB p.218 | | kept |
| b-02-C22 | step info-lib | `S` (short) omits directory blocks and member count; use `I` | SUPPORTED (partitioned only) | UG2 3.1 S p.96; 3.4 S p.152 | | *fixed*: "for a library" |
| b-02-C23 | step info-seq | PS, no directory | SUPPORTED | UG2 Fig 64 p.95 | | none |
| b-02-C24 | step listds | LISTDS prints record format, length, block size, organization | SUPPORTED | TSO-CR p.175, p.177 | | none |
| b-02-C25 | step listds | The DSORG column reads PO for the library | SUPPORTED | TSO-CR p.175 | text does not cover LISTDS of a PDSE | none |
| b-02-C26 | step listds | `=6` is the ISPF Command Shell | SUPPORTED | UG1 p.20 | | none |
| b-02-C27 | step member | Only a library has members | SUPPORTED | RB p.215 | | none |
| b-02-C28 | step member | `DATA SET IS NOT PARTITIONED` (simulator's own) | SIMULATOR-ONLY (labelled) | no ISPF text found | | kept |
| b-02-C29 | Challenge | Show information for each (option I or LISTDS) | SUPPORTED | UG2 p.152; TSO-CR p.175 | | none |
| b-02-C30 | spec | Re-allocating gives `DATA SET ALREADY EXISTS` | UNVERIFIED (simulator message) | none | | spec labelled |

**Could not verify (a-01, b-02):** real ISPF message text for a member on a sequential data set, an unrecognised Edit command, an invalid scroll amount and a duplicate allocation (ISPF Messages and Codes is not in the local extracts); the real initial Edit Scroll value; what option I shows for a PDS on a managed volume; LISTDS of a PDSE; whether the 3.4 Total view shows Dsorg; whether the 2011 Redbook PDSE statements hold in 3.2 (UG2 agrees).

## b-10-job-troubleshooting

Additional sources (printed page = PDF page minus offset, from page footers): MVS System Messages Vol 8 IEF-IGD (SRC-019, SA38-0675-70, offset 12) · Vol 4 CBD-DMO (offset 16) · Vol 6 GOS-IEA (offset 16) · MVS System Codes (SRC-020, SA38-0665-70, offset 14) · MVS JCL Reference (SRC-003, SA23-1385-70, offset 46) · MVS JCL User's Guide (SRC-018, SA23-1386-70, offset 22) · JES2 Messages (SRC-021, SA32-0989-70, offset 14) · SDSF Operation and Customization (SRC-024, SA23-2274-70, offset 60) · SDSF User's Guide (SRC-023, SC27-9028-70, offset 52) · DFSORT Messages, Codes and Diagnosis Guide (SRC-028, SC23-6879-70, offset 14) · DFSORT Application Programming Guide (SRC-027, SC23-6878-70, offset 28). PDFs: `https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/<id>_v3r2.pdf`; JCL Reference topic: https://www.ibm.com/docs/en/zos/3.2.0?topic=mvs-zos-jcl-reference; SDSF: https://www.ibm.com/docs/en/zos/3.2.0?topic=sdsf.

| ID | Where | Claim | Verdict | Source (document, section, printed page) | Quote / note | Resolution |
|---|---|---|---|---|---|---|
| b-10-C01 | step texts, spec | Look first at SDSF status, then JESYSMSG, then the step's own SYSOUT | INFERRED | JCL UG ch.2 p.21 | IBM defines the data sets, not a sequence | *fixed*: "a suggested order" |
| b-10-C02 | steps | SDSF indicator takes the forms CC, ABEND, JCL ERROR | SUPPORTED | SDSF O&C ST columns p.229; SDSF UG p.306 | "ABEND Sxxx" / "CC xxxx" / "JCL ERROR"; column is Max-RC | *fixed*: say Max-RC |
| b-10-C03 | step jcl-read, spec | A JCL error is found before any step runs | PARTIAL | IEFC452I Vol8 p.521; $HASP165 JES2 p.160; JCLRef p.330 | true for converter errors; IBM's JCL ERROR also covers initiator-phase failures | **fixed**: "a converter (syntax) error is found before any step runs" |
| b-10-C04 | step jcl-read | A misspelt DD keyword gives IEFC630I UNIDENTIFIED KEYWORD | SUPPORTED | Vol8 IEFC630I p.541 | "could not be recognized as a valid keyword. Either the keyword was misspelled" | none |
| b-10-C05 | step jcl-read, spec, simulator | The message names the word it did not accept (DIPS) | **NOT-SUPPORTED** | Vol8 IEFC630I pp.541-542 | template is `UNIDENTIFIED KEYWORD text`, text = "IN THE parameter FIELD" / "ON THE cntr STATEMENT", parameter = *last correctly specified keyword before the error* | **fixed**: lesson no longer claims the message echoes the keyword; layout labelled simulated |
| b-10-C06 | step jcl-read | The statement number points at the DD | UNVERIFIED | none (no STMT NO. text in any local extract) | | labelled simulator layout |
| b-10-C07 | step jcl-read | Converter errors are read in JESYSMSG | UNVERIFIED | Vol8 IEFC630I "issues messages about the job to the job log"; JCL UG p.21 | no passage says which spool data set holds IEFC messages | **fixed**: "the job's messages"; flagged for expert confirmation |
| b-10-C08 | spec | A converter error ends as JCL ERROR (IEFC452I ... JOB NOT RUN - JCL ERROR) | SUPPORTED | Vol8 IEFC452I pp.520-521; SDSF p.229 | "text - JOB NOT RUN - JCL ERROR" | none |
| b-10-C09 | step dsn-read | The converter had no complaint; the failure is in allocation | SUPPORTED | Vol8 IEF212I p.135 (Source: Allocation, IEFAB469); IEFC630I (Source: Converter) | | none |
| b-10-C10 | step dsn-read | A missing data set under DISP=SHR gives IEF212I | SUPPORTED | Vol8 IEF212I p.135 | "The data set was not cataloged or passed." | none |
| b-10-C11 | step dsn-read | IEF212I names job, step and DD, not the data set | SUPPORTED | Vol8 IEF212I p.134 | `jobname [procstep] stepname ddname[+ xxx] - DATA SET NOT FOUND` | none |
| b-10-C12 | spec | An allocation failure happens when a step starts | INFERRED | IEF272I p.172; IEF236I p.151; JCLRef p.330 | timing implied, not stated | *fixed*: "when the system allocates the step's data sets" |
| b-10-C13 | step dsn-read | FIXDSN ends with SDSF JCL ERROR | INFERRED | $HASP165 p.160; SDSF p.229 | rests on "initiator phase" | kept; not taught as a way to tell the two apart |
| b-10-C14 | description, objective, spec | "JCL error" and "allocation failure" are two kinds of failure with a different status | **PARTIAL** | IEF272I p.172; JCLRef p.330; $HASP165 p.160 | IBM lumps both under JCL ERROR; the valid line is the *message source* (IEFC converter vs IEF allocation) | **fixed**: categories renamed "converter (syntax) error" and "allocation error"; both show JCL ERROR; classification is by message id |
| b-10-C15 | step dsn-read | After a failed allocation the step is not executed and the job ends | SUPPORTED | IEF272I p.172; JCLRef p.330 | "the system ends the job" | none |
| b-10-C16 | spec limitations | "The simulator shows both as JCL ERROR" is a simulator limitation | PARTIAL | $HASP165 p.160 | probably IBM behaviour, not a simulator gap | *fixed*: moved out of limitations |
| b-10-C17 | steps, b-06 | S806 is a missing program | PARTIAL | System Codes 806 pp.498-499; RB p.395 | only reason 04 is "module not found" (LINK/XCTL/ATTACH/LOAD); no local text links EXEC PGM= to S806 explicitly except the Redbook sample | **fixed**: "S806 reason 04: the module was not found, here the program named on EXEC PGM=" |
| b-10-C18 | step pgm-read | CSV003I REQUESTED MODULE ... NOT FOUND accompanies S806-04 | SUPPORTED | System Codes 806 action table p.498; Vol4 CSV003I p.1819 | | none |
| b-10-C19 | simulator | CSV028I ABEND806-04 and IEA995I are shown | SUPPORTED | Vol4 CSV028I p.1838; Vol6 IEA995I p.1476; RB p.395 | | none |
| b-10-C20 | step pgm-read | SDSF shows ABEND, not a code | SUPPORTED | SDSF p.229 | | none |
| b-10-C21 | step pgm-read | After the abend the next step is not executed (IEF272I) | SUPPORTED | Vol8 IEF272I p.172; JCLRef COND p.327 | exceptions EVEN/ONLY, IF ABEND; the job has none | none |
| b-10-C22 | spec | A JCL error and an abend have no return code | PARTIAL | JCLRef DISP p.147; JOBRC p.413 | an abended step has a completion code, no COND CODE | *fixed*: "no condition code" |
| b-10-C23 | step pgm-read | Abend message layout IEF450I ABEND=S806 U0000 REASON=00000004 | SIMULATOR-ONLY | Vol8 IEF450I pp.258-259; IEF472I p.272 | simulator omits IEF472I, uses a non-template layout | *fixed*: disclosure added to pgm-read |
| b-10-C24 | step rc-read | IEF142I gives each step's code | SUPPORTED | Vol8 IEF142I pp.99-100 | simulator adds " - " the template lacks | disclosed |
| b-10-C25 | step rc-read | Highest step code is the job's CC | SUPPORTED | JCLRef JOB JOBRC p.413 | default MAXRC can be changed by JOBRC= | none |
| b-10-C26 | step rc-read | A nonzero code is not a job failure; later steps still run | PARTIAL | Vol8 IEF142I p.100; JCLRef COND p.327 | add "unless COND/IF stops them" | *fixed* |
| b-10-C27 | step rc-read/rc-fix, fault | `SORT FIELDZ=...` produces ICE007A SYNTAX ERROR | **NOT-SUPPORTED** | DFSORT Msgs ICE007A p.18, ICE012A/ICE013A p.19 | ICE007A causes: unbalanced parenthesis, missing comma, embedded blank, invalid format type; ICE013A = invalid keyword operand; ICE012A = no FIELDS operand | **fixed**: the fault is now a documented ICE007A cause (see verification report) |
| b-10-C28 | simulator | ICE007A text SYNTAX ERROR, critical | SUPPORTED | DFSORT Msgs ICE007A p.18 | "Critical. A control statement contained an error in syntax." | none |
| b-10-C29 | spec | DFSORT ends an unsuccessful sort with RC 16, or abends by option | SUPPORTED | DFSORT APG p.25, p.35; Msgs p.137 | "return code of 16, 20 or 28" | none |
| b-10-C30 | step rc-fix | The cause is in the SORT step's own output, not JESYSMSG | INFERRED | DFSORT Msgs ch.2 p.13 | | kept |
| b-10-C31 | simulator | IEF236I is printed before a failed allocation's IEF212I | SIMULATOR-ONLY | Vol8 IEF236I p.151 | IEF236I means allocation succeeded | **fixed in simulator** (see verification report) |
| b-10-C32 | simulator | `$HASP395 ... ENDED - JCL ERROR` | SIMULATOR-ONLY | JES2 Messages $HASP395 p.296 | documented forms: ENDED, ENDED RC=, ENDED ABEND=; JCL ERROR form is $HASP165 | disclosed |
| b-10-C33 | spec | Only S806 exists; faults are fixed | SIMULATOR-ONLY | none | | disclosed |

**Could not verify (b-10):** which spool data set holds IEFC6xx messages and the `STMT NO. MESSAGE` layout; that SDSF shows JCL ERROR specifically for IEF212I; the exact real text of IEF142I, IEF450I and ICE052I; which ICE message real DFSORT issues for a misspelt FIELDS; that EXEC PGM= not found maps to S806-04 beyond the macro-level text and a 2011 Redbook sample.

## b-05-disp

Sources: JCLREF = MVS JCL Reference SA23-1385-70 (SRC-003, offset 46; https://www.ibm.com/docs/en/zos/3.2.0?topic=mvs-zos-jcl-reference); MSG8 = MVS System Messages Vol 8 IEF-IGD SA38-0675-70 (SRC-019, offset 12); JCLUG = MVS JCL User's Guide SA23-1386-70 (SRC-018, offset 22); RB = Redbook SG24-6366-02 (offset 24). The register gives URLs only for SRC-001 and SRC-003.

| ID | Where | Claim | Verdict | Source | Quote / note | Resolution |
|---|---|---|---|---|---|---|
| b-05-C01 | objective, spec | DISP=(status,normal,abnormal) describes the data set's status and what to do after the step | SUPPORTED | JCLREF DISP Purpose p.147 | "describe the status of a data set to the system and tell the system what to do with the data set after termination of the step or job" | none |
| b-05-C02 | teaches, spec | With no DISP: NEW, DELETE for normal and abnormal termination | SUPPORTED | JCLREF DISP Defaults p.153 | "the default is a NEW data set with a disposition of DELETE for both normal and abnormal termination" | none |
| b-05-C03 | spec | Omitted status means NEW | SUPPORTED | JCLREF p.153 | spec cited p.147-152; the Defaults text is p.153 | citation range corrected to 147-154 |
| b-05-C04 | spec | Omitted normal disposition: DELETE for NEW, KEEP for an existing data set | SUPPORTED | JCLREF p.153 | | none |
| b-05-C05 | spec | The abnormal default equals the normal disposition | PARTIAL | JCLREF p.153 | except when the normal disposition is PASS | *fixed* in spec |
| b-05-C06 | teaches, step mod | MOD adds records to the end of an existing sequential data set, or creates it if missing | PARTIAL | JCLREF MOD p.149 | creation only when no volume information is found (catalog or passed) | *fixed*: condition stated |
| b-05-C07 | step mod | "Compare OLD, which starts writing from the beginning" | UNVERIFIED | JCLREF p.149 defines OLD only as exclusive use | write position depends on how the program opens the data set | **fixed**: sentence removed |
| b-05-C08 | steps | NEW means this job creates the data set | SUPPORTED | JCLREF p.148 | | none |
| b-05-C09 | steps | CATLG puts a catalog entry in place and keeps the data set | SUPPORTED | JCLREF p.151 | | none |
| b-05-C10 | step del, spec | DELETE removes the data set and its catalog entry | PARTIAL | JCLREF p.150 | holds when volume information came from the catalog; an unexpired RETPD/EXPDT keeps it | *fixed*: condition stated |
| b-05-C11 | steps, spec | IEF285I reports the disposition performed for each data set | SUPPORTED | MSG8 IEF285I p.184 | | none |
| b-05-C12 | step first | CATALOGED, KEPT and DELETED are the words you will see most | PARTIAL | MSG8 p.184 lists ten words; says nothing about frequency | | **fixed**: "common words include..." |
| b-05-C13 | teaches | IEF285I tells you the outcome: CATALOGED, KEPT or DELETED | PARTIAL | MSG8 pp.184-185 | KEPT means no action by this request; a data set removed by TSO DELETE/IDCAMS can show KEPT | *fixed* |
| b-05-C14 | step keepit | No DISP means NEW, DELETE | SUPPORTED | JCLREF p.153 | | none |
| b-05-C15 | step keepit | A CC 0000 job can still have thrown its output away | INFERRED | MSG8 IEF142I p.99 + C14 | | kept |
| b-05-C16 | step fix | Trailing comma continues the DD onto the next record | SUPPORTED | JCLREF "Continuing the parameter field" pp.16-17 | | citation added |
| b-05-C17 | spec | (NEW,KEEP) or (NEW,CATLG,DELETE) both leave the data set | PARTIAL | JCLREF p.151 | "For new SMS-managed data sets, KEEP implies CATLG"; on non-SMS volumes KEEP leaves it uncataloged | *fixed*: stated as SMS-managed |
| b-05-C18 | spec | New data sets are cataloged at allocation, as for SMS-managed data sets | UNVERIFIED | none | | **fixed**: "the simulator catalogs new data sets when allocated" |
| b-05-C19 | spec | PASS and UNCATLG are treated like KEEP | SIMULATOR-ONLY | JCLREF pp.151-152 define them differently | | disclosed |
| b-05-C20 | spec | MOD on a library member replaces it | SIMULATOR-ONLY | JCLREF p.154: "If the member name already exists, the system terminates the job." | | **fixed in simulator**: the step now fails and the member is unchanged |
| b-05-C21 | spec | Submitting a NEW job twice: the second fails because the name exists | PARTIAL | JCLREF p.149 | SMS-managed duplicate names fail the request | spec qualified |
| b-05-C22 | steps | IEF285I is in the job's JESYSMSG | PARTIAL | JCLUG pp.13-14, p.21; RB p.261 | neither labels the DD | acceptable; sources added |
| b-05-C23 | simulator | IEF285I layout `dsname dsp ... VOL SER NOS=` | SUPPORTED (layout) | MSG8 p.184; RB p.261 | simulator prints KEPT for KEEP of a NEW data set; real word may be CATALOGED (KEEP implies CATLG on SMS) | disclosed |

## b-06-multistep-rc

Additional sources: JES2MSG = JES2 Messages SA32-0989-70 (SRC-021, offset 14); JES2INIT = JES2 Initialization and Tuning Reference SA32-0992-70 (SRC-022, offset 20); SDSFUG = SDSF User's Guide SC27-9028-70 (SRC-023, offset 52); CODES = MVS System Codes SA38-0665-70 (SRC-020, offset 14); MSG4 = System Messages Vol 4 (offset 16); DFSORT-AG = Application Programming Guide SC23-6878-70 (SRC-027, offset 28); DFSORT-MSG = Messages, Codes and Diagnosis Guide SC23-6879-70 (SRC-028, offset 14).

| ID | Where | Claim | Verdict | Source | Quote / note | Resolution |
|---|---|---|---|---|---|---|
| b-06-C01 | teaches | IEF142I gives the condition code of each step | PARTIAL | MSG8 IEF142I p.99; JCLREF p.147 | only for steps that complete normally; an abended step gets IEF472I | *fixed*: "each step that completes normally" |
| b-06-C02 | spec | IEF142I is issued when a step completes processing normally | SUPPORTED | MSG8 p.99 | | none |
| b-06-C03 | teaches, step | The job's highest step code is its Max-RC | PARTIAL | JES2INIT JOBCLASS JOBRC p.174; SDSFUG p.306 | "The default value is MAXRC"; LASTRC possible per job class | *fixed*: "by default" |
| b-06-C04 | step | "Each step ends with a return code that the program chose" | PARTIAL | MSG8 p.99 | the condition code comes from register 15 at the end of the step | *fixed* |
| b-06-C05 | steps | A nonzero return code does not stop later steps unless COND or IF says so | SUPPORTED | MSG8 IEF142I action p.99; JCLREF COND p.327 | | none |
| b-06-C06 | spec | 0 conventionally means success | SUPPORTED | JCLUG p.14 | | none |
| b-06-C07 | step | The SORT messages are in the SYSOUT data set | SUPPORTED | JCLUG p.21; DFSORT-AG p.64 | | none (needs `//SYSOUT DD`) |
| b-06-C08 | step | SDSF ST shows CC 0016 | SUPPORTED | SDSFUG p.306; JCLUG p.21 | | none |
| b-06-C09 | step, spec, fault | DFSORT prints ICE007A SYNTAX ERROR for the misspelt `SORT FIELDZ=...` | **NOT-SUPPORTED** | DFSORT-MSG p.18 | ICE007A causes: unbalanced parenthesis, missing comma, embedded blank, invalid format type; ICE006A covers an invalid or missing operand | **fixed**: the fault is now a missing comma, a documented ICE007A cause |
| b-06-C10 | step | ICE007A is critical and DFSORT terminates | SUPPORTED | DFSORT-MSG p.18 | | none |
| b-06-C11 | spec | After a critical error DFSORT ends with RC 16 (option: abend) | INFERRED | DFSORT-AG ERET p.35, return codes p.25 | NOABEND returns 16, 20 or 28 | both pages cited |
| b-06-C12 | step fix | After the fix every step ends 0000 (SORTIN DUMMY, SORTOUT SYSOUT=*) | **UNVERIFIED** | DFSORT-AG p.67 | "be sure to supply RECFM, LRECL and BLKSIZE"; NULLOUT may give RC 0, 4 or 16 | **fixed**: labelled simulated |
| b-06-C13 | steps | An abend ends the step abnormally and the system issues IEF450I | PARTIAL | MSG8 IEF450I pp.258-259; IEF472I pp.272-273; JCLREF p.147 | the simulator emits IEF450I only, never IEF472I | disclosed |
| b-06-C14 | steps | S806 reason 04: module not found; CSV003I accompanies it | SUPPORTED | CODES S806 pp.498-499; MSG4 CSV003I p.1819; RB p.395 | the books speak of LINK/XCTL/ATTACH/LOAD, the EXEC link is from the Redbook sample | SRC-001 added to sources |
| b-06-C15 | teaches | S806 means the program named on EXEC was not found | PARTIAL | CODES pp.498-499 | S806 has reasons 04, 08, 0C, 10, 14, 18, 1C, 2C | **fixed**: "S806 reason 04" |
| b-06-C16 | steps | After an abend a later step that does not specify EVEN or ONLY is not executed (IEF272I) | PARTIAL | JCLREF COND p.327; MSG8 IEF272I p.172 | "normally bypasses"; not when IF tests ABEND, or recovery intercepts | *fixed*: qualified |
| b-06-C17 | teaches | Later steps are not executed after an abend | PARTIAL | as C16 | | *fixed* |
| b-06-C18 | step | The simulator's IEF450I layout differs from the IBM template | SIMULATOR-ONLY (labelled) | MSG8 p.258; DFSORT-MSG p.151 | | kept |
| b-06-C19 | steps, spec | The abend, CSV003I and S806 are read in JESYSMSG | UNVERIFIED (partly contradicted) | RB p.395; JCLUG p.21 | the Redbook sample shows them in the job log | **fixed**: "in the job's system messages"; placement labelled simulated |
| b-06-C20 | steps | Displayed IEF142I and IEF272I text | SUPPORTED (layout) | MSG8 pp.99, 172 | simulator prints a hyphen and a leading zero | disclosed |
| b-06-C21 | spec | `$HASP395 USER01R ENDED - RC=0016`; abend form `ENDED - ABEND=S806` | SUPPORTED | JES2MSG pp.296-297 | | none |
| b-06-C22 | step fix | `SORT FIELDS=(1,3,CH,A)` is the valid form | SUPPORTED | DFSORT-AG SORT statement FIELDS p.422 | | none |
| b-06-C23 | steps | An abend is an abnormal end of the step, not a code the program chose | SUPPORTED | MSG8 IEF450I p.258, IEF142I p.99 | | none |

**Could not verify (b-05, b-06):** that OLD writes from the beginning; the real placement of IEF450I and CSV003I (job log or JESYSMSG); whether a real DFSORT run of the corrected RCJOB ends RC 0; the exact ICE message for a misspelt FIELDS; that a real non-SMS NEW,KEEP leaves the data set uncataloged; register URLs for SRC-018 to SRC-028 (document codes only).

## b-03-jcl-anatomy

Sources (printed page = PDF page minus offset, from page footers): SRC-003 MVS JCL Reference SA23-1385-70 (updated 2026-09-21, offset 46) · SRC-018 MVS JCL User's Guide SA23-1386-70 (offset 22) · SRC-019 System Messages Vol 8 SA38-0675-70 (offset 12) · SRC-021 JES2 Messages (offset 14) · SRC-015 TSO/E Command Reference (offset 26) · SRC-016 TSO/E Messages SA32-0970-70 (offset 12) · SRC-017 TSO/E User's Guide SA32-0971-70 (offset 18) · SRC-012 ISPF Edit and Edit Macros (offset 32) · SRC-013 ISPF UG Vol I (offset 28) · SRC-014 ISPF UG Vol II (offset 38) · SRC-023 SDSF User's Guide SC27-9028-70 (offset 52). PDFs: `https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/<id>_v3r2.pdf`.

| ID | Where | Claim | Verdict | Source | Quote / note | Resolution |
|---|---|---|---|---|---|---|
| b-03-C01 | step open | A JCL statement is one or more 80-byte records, like punched-card images | SUPPORTED | SRC-003 p.13 | "one or more 80-byte records. Each record is comparable to an 80-column punched-card image" | none |
| b-03-C02 | step open | A statement has up to five fields: identifier, name, operation, parameters, comments | SUPPORTED | SRC-003 p.13 | | none |
| b-03-C03 | step open | The JOB statement marks the start of a job | SUPPORTED | SRC-003 JOB p.389 | | none |
| b-03-C04 | step open | EXEC names the program a step runs and marks the start of the step | PARTIAL | SRC-003 EXEC p.313 | can name a procedure | *fixed*: "(or procedure)" |
| b-03-C05 | step open | A DD statement describes a data set a step uses | SUPPORTED | SRC-003 DD p.75 | | none |
| b-03-C06 | step open | IEFBR14 needs no data | SUPPORTED | SRC-018 p.10 | "It does not actually process any data" | none |
| b-03-C07 | step open, teaches | A null statement `//` marks the end of the job | PARTIAL | SRC-003 p.459 | optional; the next JOB statement or end of input also ends a job | *fixed* |
| b-03-C08 | teaches | A job is JOB, EXEC and DD statements | PARTIAL | SRC-003 Table 8 p.14 | many other statement types exist | *fixed*: "a simple job is..." |
| b-03-C09 | step cols | The identifier `//` is in columns 1-2 | SUPPORTED | SRC-003 p.13 | | none |
| b-03-C10 | step cols | A name starts in column 3, 1-8 characters, then a blank | SUPPORTED | SRC-003 p.13 | | none |
| b-03-C11 | step cols | Operation and parameters follow the name, in free form | SUPPORTED | SRC-003 pp.13-14 | | none |
| b-03-C12 | step cols, teaches | Nothing is coded past column 71; columns 73-80 are ignored | PARTIAL | SRC-003 p.15 | comment statements may run to column 80; column 72 is the continuation indicator | *fixed* |
| b-03-C13 | step fix | To continue, stop after a complete parameter and its comma, at or before column 71 | SUPPORTED | SRC-003 p.16 | | none |
| b-03-C14 | step fix | The next record starts `//` with a blank in column 3 | SUPPORTED | SRC-003 p.17 | | none |
| b-03-C15 | teaches | A trailing comma means the next record must continue the statement | PARTIAL | SRC-003 p.17; SRC-019 IEFC621I p.532 | a comma inside apostrophes is not a continuation | *fixed*: "a comma ending the last operand" |
| b-03-C16 | step fix, limitation | IBM continues the operand in columns 4-16; the simulator accepts any column after 3 | SUPPORTED | SRC-003 p.17 | | kept |
| b-03-C17 | step read, teaches | IEFC621I = EXPECTED CONTINUATION NOT RECEIVED | SUPPORTED | SRC-019 IEFC621I pp.531-532 | template matches the displayed text | none |
| b-03-C18 | step read | STMT NO. is the statement number in the JESJCL listing | PARTIAL | SRC-019 IEF686I note p.343; SRC-018 Fig 2 p.13 | the `STMT NO. MESSAGE` header text is in no extract | labelled simulated |
| b-03-C19 | step read | Comments and continuation records are not numbered | PARTIAL | SRC-018 Fig 2 p.13 | continuation part supported (JOB spans 6 records under number 1); comment part has no sample | comment part labelled simulated |
| b-03-C20 | step read | A JCL error means no step ran | SUPPORTED | SRC-019 IEFC452I p.521 | "no steps will be processed" | none (converter errors) |
| b-03-C21 | step submit | `TSO SUBMIT JCL(BROKEN)` submits `{HLQ}.JCL(BROKEN)` | **NOT-SUPPORTED as real TSO** | SRC-017 pp.121-122; SRC-015 p.273 | real TSO adds the `CNTL` qualifier: `JCL(JOB1)` means `userid.JCL.CNTL(JOB1)` | **fixed**: the lesson now states the simulator prefixes only the userid and does not add `.CNTL` |
| b-03-C22 | step submit | The job is accepted as submitted but will not run | SUPPORTED | SRC-016 IKJ56250I p.544; SRC-019 IEFC452I | | none |
| b-03-C23 | step read | `?` lists a job's data sets; `S` on JESYSMSG displays it | SUPPORTED | SRC-023 pp.343-344; SRC-018 p.21 | | none |
| b-03-C24 | step read | IEFC621I and the statement number appear in JESYSMSG | INFERRED / UNVERIFIED | SRC-019 IEFC621I ("job log"); SRC-003 p.3; SRC-018 p.21 | no extract says which spool data set holds converter messages | **fixed**: "in the job's messages"; flagged for expert confirmation |
| b-03-C25 | step read | The `STMT NO. MESSAGE` header and layout | UNVERIFIED | none | | labelled simulated |
| b-03-C26 | step read | `=S` reaches SDSF and `ST` is the status panel | SIMULATOR-ONLY | SRC-024: option S is installation-specific | | labelled |
| b-03-C27 | step cols | `COLS` displays a columns ruler | SUPPORTED | SRC-012 COLS p.206 | | none |
| b-03-C28 | step rerun | SUBMIT typed in Edit submits the text being edited | SUPPORTED | SRC-012 SUBMIT pp.283-284 | | none |
| b-03-C29 | step rerun | The job ends CC 0000 / the JCL-error job shows JCL ERROR | SUPPORTED | SRC-023 p.306; SRC-019 IEF142I p.99 | | none |
| b-03-C30 | step save | PF3 saves the corrected member | PARTIAL | SRC-012 pp.10-11 | only when AUTOSAVE is on (the simulator default) | *fixed* |
| b-03-C31 | spec | JESMSGLG shows `IEFC452I ... JOB NOT RUN - JCL ERROR` | PARTIAL | SRC-019 IEFC452I pp.520-521 | text matches; JESMSGLG placement unverified | spec labelled |
| b-03-C32 | spec | IEFC630I and IEFC019I exist | SUPPORTED | SRC-019 | | none |
| b-03-C33 | spec | A continuation not starting `//` plus a blank in column 3 fails | SUPPORTED | SRC-003 p.17 | | none |
| b-03-C34 | spec | A JOB statement ending in a comma then `//STEP1 EXEC` gives IEFC621I on statement 1 | SUPPORTED | SRC-003 p.17; SRC-019 IEFC621I | | none |

Displayed-text differences from the IBM templates (cosmetic, disclosed): the JESJCL statement number is left-aligned (IBM right-justifies); IEF403I/IEF404I omit `- TIME=hh.mm.ss`; IEF373I-376I use `2026/10/15` where the template is `yyyyddd.hhmm`; `$HASP100` omits the programmer name; the simulator rejects a `//*` comment after a trailing comma where IBM allows column 3 blank or asterisk.

## b-04-build-a-job

| ID | Where | Claim | Verdict | Source | Quote / note | Resolution |
|---|---|---|---|---|---|---|
| b-04-C01 | step job | The JOB statement marks the start of a job | SUPPORTED | SRC-003 p.389 | | none |
| b-04-C02 | step job | A job name is 1-8 characters starting in column 3 | SUPPORTED | SRC-003 p.389 | | none |
| b-04-C03 | step job | Userid plus one letter keeps your jobs easy to find in SDSF | INFERRED | SRC-015 SUBMIT JOBCHAR p.271; SRC-024 GROUP PREFIX | the SDSF PREFIX default shows all jobs | *fixed*: "so TSO STATUS and SDSF filters can find them" |
| b-04-C04 | step exec | EXEC names the program and marks the beginning of the step | PARTIAL | SRC-003 p.313 | or procedure | *fixed* |
| b-04-C05 | step exec, teaches | IEFBR14 processes no data; the job exists for the allocation work around the step | SUPPORTED | SRC-018 p.10, p.86 | p.86 supports the allocation and disposition half | spec cites p.86 |
| b-04-C06 | step dd | DSN names the data set | SUPPORTED | SRC-003 DSNAME p.164 | | none |
| b-04-C07 | step dd | DISP gives status and what to do afterwards | SUPPORTED | SRC-003 p.147 | | none |
| b-04-C08 | step dd | (NEW,CATLG,DELETE) = new, cataloged at normal end, deleted at abnormal end | PARTIAL | SRC-003 pp.148, 150-152; SRC-018 p.116 | on SMS DASD the catalog entry is made at allocation | **fixed**: "kept and cataloged if the step ends normally, deleted if it ends abnormally" |
| b-04-C09 | spec | An omitted status is NEW | SUPPORTED | SRC-003 p.153 | spec cited p.147-148 | citation corrected |
| b-04-C10 | spec | Omitting DISP means NEW and deleted at normal end | SUPPORTED | SRC-003 p.153 | | none |
| b-04-C11 | step dd | SPACE requests room on a direct access volume | SUPPORTED | SRC-003 p.251 | | none |
| b-04-C12 | step dd | SPACE=(TRK,(1,1)) is one track, one more if needed | PARTIAL | SRC-003 p.253 | each time more is needed | *fixed* |
| b-04-C13 | step dd, teaches | UNIT picks the device group | PARTIAL | SRC-003 UNIT pp.278-280 | SYSDA is installation-defined; ignored for SMS-managed DASD | **fixed**: stated |
| b-04-C14 | step dd | DCB completes the record description; RECFM and LRECL can be coded alone | SUPPORTED | SRC-003 DCB pp.126-127 | a data class can supply them under SMS | *fixed*: noted |
| b-04-C15 | spec | DCB completes data set information "when the program does not supply it" | PARTIAL | SRC-003 p.126 | | spec reworded |
| b-04-C16 | step dd | FB means fixed blocked, 80 bytes | INFERRED | SRC-003 RECFM/LRECL | not opened; standard meaning | kept |
| b-04-C17 | step null | The null statement ends the job; columns 3-72 must be blank | SUPPORTED | SRC-003 p.459 | | none |
| b-04-C18 | step dd | Continue with a comma and a record starting `//` plus a blank | SUPPORTED | SRC-003 pp.16-17 | | none |
| b-04-C19 | step submit, spec | Submitting a NEW job twice fails with a duplicate-name message | PARTIAL | SRC-003 p.149; SRC-019 IGD17101I p.1548 | documented for SMS-managed data sets | *fixed*: qualified |
| b-04-C20 | step open | A nonexistent member opens with empty input lines marked `''''''` | SUPPORTED | SRC-012 pp.7-8 | | none |
| b-04-C21 | step open | Unused input lines disappear after you type on the first and press Enter | PARTIAL | SRC-012 I command p.162 | documented for `I`-inserted lines, not the initial quote lines | **fixed**: labelled simulated |
| b-04-C22 | step open | `I` adds lines after the line | SUPPORTED | SRC-012 pp.10, 162 | | none |
| b-04-C23 | step verify | PF3 saves and leaves | PARTIAL | SRC-012 pp.10-11 | AUTOSAVE | *fixed* |
| b-04-C24 | step verify | Option 3.4 lists the data set as PS, FB, 80 | PARTIAL | SRC-014 pp.130-136 | Attributes view only (Fig 88 p.136) | **fixed**: how to switch views |
| b-04-C25 | spec | JESYSMSG shows `IGD101I ... ALLOCATED` | PARTIAL | SRC-019 IGD101I p.1384 | template carries `VOLSER NOS= volid`; the simulator omits it | disclosed |
| b-04-C26 | spec | `IEF285I dsname CATALOGED` plus `VOL SER NOS=` | SUPPORTED | SRC-019 p.184 | | none |
| b-04-C27 | spec | A new data set is cataloged at allocation, as for SMS-managed data sets | SUPPORTED | SRC-018 p.116 | "The system catalogs new permanent system-managed DASD data sets at allocation." | none |
| b-04-C28 | spec | STORCLAS, DATACLAS, MGMTCLAS, LABEL, FREE, DSNTYPE are valid DD keywords the simulator ignores | INFERRED | SRC-003 | not opened by this examiner; the fidelity examiner confirmed they are valid keywords | see simulator fidelity |
| b-04-C29 | step submit | The job ends CC 0000 with IEF142I COND CODE 0000 | SUPPORTED | SRC-019 p.99 | | none |
| b-04-C30 | JCL, spec | Both lesson jobs omit MSGCLASS but tell the learner to read output in SDSF | PARTIAL | SRC-003 MSGCLASS p.417; SRC-018 p.11 | the default MSGCLASS is installation-specific | **fixed**: `MSGCLASS=X` added to the lesson jobs |

**Could not verify (b-03, b-04):** the `STMT NO. MESSAGE` header text; whether IEFC621I/IEFC452I land in JESYSMSG or JESMSGLG; whether comment statements are unnumbered in JESJCL; `IRR010I`, `ICH70001I` and the JES2 job-log banner (RACF message books are not in the extracts); `$HASP395 ... ENDED - JCL ERROR` (the template lists only plain, `RC=` and `ABEND=`); option `S` for SDSF on the ISPF menu; SDSF Operation and Customization printed page numbers.

## b-01-zos-big-picture (including the three check questions)

Sources (printed page = PDF page minus offset, from page footers/headers): RB = Redbook SG24-6366-02 (SRC-001, March 2011, z/OS 1.x era, tier 2; offset 24; https://www.redbooks.ibm.com/abstracts/sg246366.htm) · UG = TSO/E User's Guide SA32-0971-70 (SRC-017, offset 18) · CR = TSO/E Command Reference SA32-0975-70 (SRC-015, offset 26) · MSG = TSO/E Messages SA32-0970-70 (SRC-016, offset 12) · I1/I2 = ISPF User's Guide Vol I/II SC19-3627-70 / SC19-3628-70 (SRC-013/014, offsets 28/38) · ED = ISPF Edit and Edit Macros SC19-3621-70 (SRC-012, offset 32; https://www.ibm.com/docs/en/SSLTBW_3.2.0/com.ibm.zos.v3r2.f54em00/submit.htm) · SD = SDSF User's Guide SC27-9028-70 (SRC-023, offset 52; https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/isfa600_v3r2.pdf) · SO = SDSF Operation and Customization SA23-2274-70 (SRC-024, offset 60) · JU = JCL User's Guide (SRC-018, offset 22). Register URLs are book-level only (TSO/E https://www.ibm.com/docs/en/zos/3.2.0?topic=zos-tsoe; ISPF https://www.ibm.com/docs/en/zos/3.2.0?topic=ispf; SDSF https://www.ibm.com/docs/en/zos/3.2.0?topic=sdsf). The JES2 Initialization and Tuning Guide (hasa300) used for one page is only a CANDIDATE in the register.

| ID | Where | Claim | Verdict | Source | Quote / note | Resolution |
|---|---|---|---|---|---|---|
| b-01-C01 | teaches, step tso | TSO/E gives a user an interactive session with z/OS | SUPPORTED | RB 4.2 p.166; UG p.1 | "allows users to create an interactive session with the z/OS system" | none |
| b-01-C02 | step tso | ...and a basic command prompt | SUPPORTED | RB 4.2 p.166, 4.2.2 p.169; UG p.8 | the native prompt is READY | none |
| b-01-C03 | step tso, spec | TSO/E has "a single-user logon" | PARTIAL | RB p.166 | verbatim from the Redbook but misleading; the same page says tens of thousands concurrently | **fixed**: "each user ID its own session" |
| b-01-C04 | step tso | Most people reach TSO through ISPF's menus | SUPPORTED | RB p.166 | | none |
| b-01-C05 | step tso | "the commands underneath are still TSO commands" | PARTIAL | I2 ch.8 p.353; ED SUBMIT p.284 | over-general; ISPF has its own commands | **fixed** |
| b-01-C06 | step tso, Challenge | LISTDS is a TSO command showing a data set's attributes | SUPPORTED | CR p.7, p.175; RB p.169 | | none |
| b-01-C07 | step tso | Option 6 is the ISPF Command Shell: "This is TSO: a command typed at its basic prompt" | PARTIAL | I2 pp.351, 353; RB 4.2.2 p.169 | the Command Shell is an ISPF panel on real z/OS; the command is TSO, the prompt is ISPF's | **fixed**: "LISTDS is a TSO command: you type it in the Command Shell, which hands it to TSO/E" |
| b-01-C08 | step tso | "In this simulator the Command Shell is an ISPF panel" | PARTIAL | I2 pp.351, 353 | wrongly implies real z/OS differs | **fixed**: removed; the simulator's real difference (no READY prompt) stated |
| b-01-C09 | teaches | ISPF is the full-panel application on top of TSO | PARTIAL | RB 4.3 p.172; I1 p.1-2; UG p.8-9 | "on top of" is the lesson's phrase; ISPF is started from a TSO session | **fixed**: "runs in your TSO/E session" |
| b-01-C10 | step ispf | ISPF is keyboard-driven with an editor, a browser and utilities | SUPPORTED | RB 4.3 p.172; I1 p.1 | | none |
| b-01-C11 | teaches, step jes | JES receives jobs, schedules them, controls their output | SUPPORTED | RB 7.2 p.275 | "to receive jobs ..., to schedule them for processing by z/OS, and to control their output processing" | "output processing" restored |
| b-01-C12 | step jes | One way a job reaches JES is from ISPF with SUBMIT | SUPPORTED | RB p.275; ED p.284 | | none |
| b-01-C13 | step jes | The message reads `JOB name(JOBnnnnn) SUBMITTED` | SUPPORTED | MSG IKJ56250I p.544 | | none |
| b-01-C14 | step jes | That is the system accepting the job: JES now has it | SUPPORTED | CR EDIT-SUBMIT p.121; RB p.287 | | none |
| b-01-C15 | step check-jes hint | "Which piece said JOB ... SUBMITTED?" implies JES said it | **NOT-SUPPORTED** | CR p.121; MSG p.544 | the message is TSO/E's SUBMIT command (IKJ prefix); JES assigns the job number | **fixed**: lesson, hint, lesson 24 text and the SUBMIT glossary entry now say the SUBMIT command reports it and JES gave the number |
| b-01-C16 | step jes | A real job waits in a queue until it is selected to run | SUPPORTED | RB p.275; JG p.73 | | spec wording widened |
| b-01-C17 | step jes | Here it runs at once | SIMULATOR-ONLY | none | | none |
| b-01-C18 | step sdsf | SDSF = System Display and Search Facility | SUPPORTED | RB 6.8 p.257 | | none |
| b-01-C19 | teaches, step sdsf | SDSF displays output held in the JES spool area; you can inspect and delete | SUPPORTED | RB p.257; SD p.42 | SDSF shows more than spool data (log, devices) | none |
| b-01-C20 | step sdsf | You reach SDSF from the ISPF menu | SUPPORTED | SD ch.1 p.1 | | none |
| b-01-C21 | step sdsf, spec | "it reads JES, not ISPF" | INFERRED | SD p.2; SO p.447, p.532 | SDSF also starts from TSO READY and runs as an ISPF dialog | **fixed**: "SDSF is not part of ISPF; you can start it from the ISPF menu or from TSO; the data comes from JES" |
| b-01-C22 | step sdsf | ST is the status panel | SUPPORTED | SD p.301, p.34; RB p.258 | | none |
| b-01-C23 | step output | S next to a job browses its output | SUPPORTED | SD p.305, pp.34-35 | `?` lists the data sets | none |
| b-01-C24 | step output | "your session (TSO/E) used ISPF to edit a job, JES ran and kept it, and SDSF showed what JES kept" | **PARTIAL / "ran" NOT-SUPPORTED** | RB 7.2 p.276 | an initiator runs the job; JES queues it and keeps its output | **fixed** |
| b-01-C25 | step check-session | "You typed LISTDS at the basic prompt of your TSO/E session" | PARTIAL | I2 p.351; I1 p.2 | | explanation removed (see below) |
| b-01-C26 | step check-jes | SUBMIT handed the job to JES; JES holds, schedules and controls output | SUPPORTED | CR p.121; RB p.275, p.287 | | explanation removed |
| b-01-C27 | step check-sdsf | SDSF reads what JES holds on the spool | SUPPORTED | RB p.257; SD p.42 | | explanation removed |
| b-01-C28 | question role-session | keyed TSO/E; distractors JES, SDSF, ISPF | SUPPORTED, but ambiguous as first written | RB p.166, 169; I2 pp.351, 353 | ISPF accepts TSO commands and the prompt used is ISPF's | **fixed**: stem now "Which piece gives each user ID a logon session on z/OS, the session that ISPF runs inside?"; hint reworded |
| b-01-C29 | question role-jes | keyed JES | SUPPORTED | RB p.275 | "controls its output" alone overlaps SDSF | **fixed**: "controls its output processing" |
| b-01-C30 | question role-sdsf | keyed SDSF | SUPPORTED in the trace only | RB p.257; SD p.42; CR OUTPUT p.210; I2 option 3.8 p.171 | TSO/E OUTPUT and ISPF Outlist can also display held output | **fixed**: "In this trace, ..."; distractor "the editor" replaced by "ISPF Edit" |
| b-01-C31 | Challenge | trace and three answers | SIMULATOR-ONLY (task) | n/a | | none |
| b-01-C32 | description | "the four pieces you use every day" | INFERRED | RB p.166 | | *fixed*: "meet in everyday z/OS work" |
| b-01-C33 | spec | An OS is a collection of programs that manage the internal workings of a computer | SUPPORTED | RB 3.1-3.2 p.92 | | none |
| b-01-C34 | spec | At the native prompt you type commands such as LISTDS | SUPPORTED | RB 4.2.2 p.169 | | none |
| b-01-C35 | spec | Expected results | SIMULATOR-ONLY | n/a | | none |

The three check steps no longer carry an explanation, because the "Why?" text printed the answer before the learner chose (found in the browser run).

**Could not verify (b-01):** the `$HASP100`/`$HASP165` job-log lines for acceptance by JES2; the simulator's LISTDS output format against real output; whether a real SDSF `S` on ST shows combined output or the data set list; that `=S`/PF3 navigation matches a real system (treated as simulator key instructions); HTML topic pages (only local PDF text read); how fine a TSO/E/ISPF/SDSF distinction a beginner needs (expert review).
