# Verified sources registry (Phase 0, Deliverable 3)

Part of the [Phase 0 audit](phase-0-audit.md). Verification date: **2026-10-14**. Baseline commit: `e97a91b842cc1c525c9694adf3533695bf57f82c`.

This file is the registry. The raw, claim-level evidence (quotes of at most 25 words, book page, verdict per repo claim) lives in the evidence appendices and is cited here and in the lesson audit by section:

| Appendix | Covers |
|---|---|
| [EV-A](evidence/EV-A-ispf-tso.md) | ISPF Edit, Browse, User's Guide, utilities 3.x, TSO/E commands and messages, Redbook chapters |
| [EV-B](evidence/EV-B-jcl-jes-messages.md) | JCL (DISP, COND, IF, DD, in-stream data), system and JES2 messages, abends, JES2/SDSF formats, IEFBR14/IEBGENER/DFSORT/IDCAMS |
| [EV-C](evidence/EV-C-sdsf-registry.md) | SRC-001 to SRC-011 landing-page verification, the repo's own resource links, SDSF User's Guide claims |

## 1. Status vocabulary and method

| Status | Meaning |
|---|---|
| **VERIFIED (topic)** | The exact topic or section was read and quoted. Release and page are recorded. |
| **VERIFIED (landing)** | The page resolves and is the intended manual index or abstract. It does not by itself support any technical claim. |
| **CANDIDATE** | Identified as relevant, not yet read. Not usable to justify lesson content. |
| **UNRESOLVED** | Could not be fetched, or the document does not address the claim. |
| **MISMATCH** | Resolves, but the content differs from the intended material. |

How the evidence was gathered, and its limits:

- IBM Docs landing pages were fetched with WebFetch (one `ETIMEDOUT`, succeeded on retry).
- The IBM Docs HTML topic pages for z/OS 3.2 were mostly not retrievable as individual topics (the `?topic=` slug pages return an index summary only; the SDSF User's Guide HTML table of contents returned 404). The z/OS 3.2 **PDF** editions were therefore downloaded (`https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/<book-id>_v3r2.pdf`, HTTP 200), text-extracted locally, and quoted from that text. Citations use **printed page numbers, accurate to about one page**, because the footer sits at the page end.
- Per-topic HTML URLs were fetched and read where available: Edit `SUBMIT` for z/OS 3.2 and 2.5, and the JCL Reference DISP/COND/IF/DD topics for z/OS 3.1. The 3.1 HTML matched the 3.2 PDF text.
- No citation, section number, publication detail or message text in this package comes from memory. Where the documents are silent the row says so.
- Release used: **z/OS 3.2** unless a row says otherwise. Older material (Redbook, 2011) is Tier 2 and used for concepts only.
- Source tiers follow the brief: Tier 1 IBM product documentation, Tier 2 Redbooks and IBM learning material, Tier 3 third-party.

## 2. Initial registry (SRC-001 to SRC-011)

All eleven resolve to the intended material. A landing page does not verify a claim; claim-level evidence is in section 4.

| ID | Publisher / exact title | Release, doc no., edition | Canonical URL | Direct / topic URL (verified) | Status | Caveats |
|---|---|---|---|---|---|---|
| SRC-001 | IBM Redbooks. *Introduction to the New Mainframe: z/OS Basics* | SG24-6366-02, published 2011-03-29, updated 2012-01-05. PDF title page says Third Edition (March 2011). z/OS 1.x era | https://www.redbooks.ibm.com/abstracts/sg246366.htm | PDF https://www.redbooks.ibm.com/redbooks/pdfs/sg246366.pdf. Ch.4 *TSO/E, ISPF, and UNIX* (4.3 ISPF overview, p.172-188); Ch.5 *Working with data sets* (p.203-236); Ch.6 *Using JCL and SDSF* (6.8 *Understanding SDSF*, p.257); Ch.7 *Batch processing and the job entry subsystem* | VERIFIED (topic) for chapters; Tier 2 | Old release. The brief's "chapter 4 Working with data sets" mixes chapters: ISPF is ch.4, data sets are ch.5. Silent on Edit SUBMIT, UNDO, option 0 scroll, split-screen limit, Dsname Level rules |
| SRC-002 | IBM. *z/OS ISPF* manual index (10 manuals) | z/OS 3.2 | https://www.ibm.com/docs/en/zos/3.2.0?topic=ispf | Edit and Edit Macros abstract https://www.ibm.com/docs/SSLTBW_3.2.0/com.ibm.zos.v3r2.f54em00/abstract.htm; Vol I abstract `.../com.ibm.zos.v3r2.f54ug00/abstract.htm`; per-topic: see SRC-012 to SRC-014 | VERIFIED (landing) + topic via SRC-012-014 | Index lists last-updated per book |
| SRC-003 | IBM. *MVS JCL Reference* | z/OS 3.2, SA23-1385-70 | https://www.ibm.com/docs/en/zos/3.2.0?topic=mvs-zos-jcl-reference | PDF https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/ieab600_v3r2.pdf; 3.1 HTML `https://www.ibm.com/docs/en/SSLTBW_3.1.0/com.ibm.zos.v3r1.ieab600/` pages `iea3b6_Defaults12.htm` (DISP), `xexcond.htm` (EXEC COND), `ifuse.htm` (IF/THEN/ELSE), `ddst.htm` (DD index), `xddaster.htm`, `xdddata.htm`, `xdddlm.htm` | VERIFIED (topic) | Release is 3.2 for PDF, 3.1 for the HTML pages quoted |
| SRC-004 | IBM. *SDSF* (two books) | z/OS 3.2: SDSF User's Guide SC27-9028-70 (updated 2026-07-27); SDSF Operation and Customization SA23-2274-70 | https://www.ibm.com/docs/en/zos/3.2.0?topic=sdsf | User's Guide PDF https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/isfa600_v3r2.pdf; O&C PDF `.../isfa500_v3r2.pdf` | VERIFIED (topic) via SRC-023/024 | HTML TOC returned 404; topics cited by printed page |
| SRC-005 | IBM. *z/OS TSO/E* library (14 books) | z/OS 3.2, SA32-09xx-70 | https://www.ibm.com/docs/en/zos/3.2.0?topic=zos-tsoe | see SRC-015 to SRC-017 | VERIFIED (landing) + topic via SRC-015-017 | |
| SRC-006 | IBM. *TSO/E REXX Reference* | z/OS 3.2, SA32-0972-70 | https://www.ibm.com/docs/en/zos/3.2.0?topic=tsoe-zos-rexx-reference | PDF `ikja300_v3r2.pdf` | VERIFIED (landing) | No REXX lesson exists yet; topic-level evidence is deferred to Phase 4 |
| SRC-007 | IBM. *z/OS DFSMS* library (35 books) | z/OS 3.2 | https://www.ibm.com/docs/en/zos/3.2.0?topic=zos-dfsms | see SRC-025, SRC-026 | VERIFIED (landing) + topic via SRC-025-026 | |
| SRC-008 | IBM. *Message directory* (z/OS MVS System Messages front matter) | z/OS 3.2; the fetched page names no parent book and gives no doc number | https://www.ibm.com/docs/en/zos/3.2.0?topic=i-message-directory | Book attribution via SRC-019 | VERIFIED (landing) | Book tie is from the front matter content, not from the fetched page |
| SRC-009 | IBM. *z/OS Communications Server IP Configuration Guide* | z/OS 3.2, SC27-3650-70 | https://www.ibm.com/docs/en/zos/3.2.0?topic=server-zos-communications-ip-configuration-guide | PDF `halz002_v3r2.pdf` (1550 pp) | VERIFIED (landing) | Doc number is from the PDF cover. Diagnostic-command references (Netstat, Ping, Traceroute) not yet located: **gap** for Phase 5 |
| SRC-010 | IBM. *z/OS Security Server RACF* library (11 books) | z/OS 3.2, SA23-2287 to 2298-70, GA32-0885/0886-70 | https://www.ibm.com/docs/en/zos/3.2.0?topic=zos-security-server-racf | none read | VERIFIED (landing) | Topic evidence deferred to Phase 5 |
| SRC-011 | IBM. *Using ISPF to edit a z/OS UNIX file* | z/OS 3.2; the page shows neither release nor book. Book is *z/OS UNIX System Services User's Guide* SA23-2279-70, printed p.219 | https://www.ibm.com/docs/en/zos/3.2.0?topic=files-using-ispf-edit-zos-unix-file | PDF `bpxa400_v3r2.pdf` | VERIFIED (topic matches) | Parent book identified from the PDF TOC, not the fetched web page |

## 3. Additional sources discovered (z/OS 3.2 unless stated)

Base for PDFs: `https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/<id>_v3r2.pdf`.

| ID | Book | Doc no. / id | Used for | Status |
|---|---|---|---|---|
| SRC-012 | ISPF Edit and Edit Macros | SC19-3621-70 (`f54em00`, updated 2026-06-22). HTML SUBMIT page https://www.ibm.com/docs/en/SSLTBW_3.2.0/com.ibm.zos.v3r2.f54em00/submit.htm | Edit primary and line commands, profile, SUBMIT | VERIFIED (topic) |
| SRC-013 | ISPF User's Guide Vol I | SC19-3627-70 (`f54ug00`). Abstract `.../com.ibm.zos.v3r2.f54ug00/abstract.htm` | Navigation, function keys, split screen, jump, RETURN, RETRIEVE, command stacking, HELP | VERIFIED (topic) |
| SRC-014 | ISPF User's Guide Vol II | SC19-3628-70 (`f54u200`, updated 2026-04-27) | Option 0 Settings, Browse, utilities 3.1 to 3.4 | VERIFIED (topic). Option 0, 3.x and Browse are in **Vol II**, not Vol I |
| SRC-015 | TSO/E Command Reference | SA32-0975-70 (`ikjc500`) | SUBMIT, LISTDS, LISTCAT, DELETE, RENAME, TIME | VERIFIED (topic) |
| SRC-016 | TSO/E Messages | SA32-0970-70 (`ikjm100`) | IKJ messages (**not** in the ISPF Messages and Codes book) | VERIFIED (topic) |
| SRC-017 | TSO/E User's Guide | SA32-0971-70 (`ikjc200`) | Data set naming, prefix, descriptive qualifiers | VERIFIED (topic) |
| SRC-018 | MVS JCL User's Guide | SA23-1386-70 (`ieab500`) | JESMSGLG/JESJCL/JESYSMSG samples, trailing `/*`, IEFBR14 | VERIFIED (topic) |
| SRC-019 | MVS System Messages Vol 1/4/6/7/8 | SA38-0668/0671/0673/0674/0675-70 (`ieam100/400/600/700/800`) | IEF*, IEFC*, IGD*, CSV*, IEA*, IEC*, IEB*, IDC* messages | VERIFIED (topic) |
| SRC-020 | MVS System Codes | SA38-0665-70 (`ieah700`) | S806, S0C7, S013, S222, S322, S722, S913, SB37, SD37 | VERIFIED (topic) |
| SRC-021 | JES2 Messages | SA32-0989-70 (`hasa100`) | $HASP100, $HASP165, $HASP373, $HASP395 | VERIFIED (topic) |
| SRC-022 | JES2 Initialization and Tuning Reference | SA32-0992-70 (`hasa400`) | JOBDEF RANGE, job id format | VERIFIED (topic) |
| SRC-023 | SDSF User's Guide | SC27-9028-70 (`isfa600`) | Panels, action characters, PREFIX/OWNER, JDS panel | VERIFIED (topic) |
| SRC-024 | SDSF Operation and Customization | SA23-2274-70 (`isfa500`) | ISFPARMS defaults, invoking SDSF from ISPF | VERIFIED (topic) |
| SRC-025 | DFSMSdfp Utilities | SC23-6864-70 (`idau100`) | IEBGENER | VERIFIED (topic) |
| SRC-026 | DFSMS Access Method Services Commands | SC23-6846-70 (`idai200`) | IDCAMS LISTCAT, DELETE | VERIFIED (topic) |
| SRC-027 | DFSORT Application Programming Guide | SC23-6878-70 (`icea100`) | SORT FIELDS, format codes, collating sequence | VERIFIED (topic) |
| SRC-028 | DFSORT Messages, Codes and Diagnosis Guide | SC23-6879-70 (`icem100`) | ICE messages | VERIFIED (topic) |
| SRC-029 | TSO/E REXX User's Guide | SA32-0982-70 (`ikjc300`) | Phase 4 REXX curriculum | CANDIDATE (cover only) |
| SRC-030 | JES2 Commands; JES2 Initialization and Tuning Guide | SA32-0990-70 (`hasa200`); SA32-0991-70 (`hasa300`) | Phase 4 operations curriculum | CANDIDATE (cover only) |
| SRC-031 | ISPF Messages and Codes | SC19-3622-70 (`f54mc00`) | ISPF message IDs (the simulator has none) | CANDIDATE: not read; needed before ISPF message IDs are added |

## 4. Claim-level findings index (what the evidence says about the repo)

Verdict key: **C** contradicts the repo claim or behaviour; **P** partial or imprecise; **S** supports; **N** documentation does not address it; **U** unresolved. Quotes and pages are in the evidence file section named.

### 4.1 Edit and navigation (EV-A)

| Topic | Verdict | Finding | Evidence |
|---|---|---|---|
| Edit `SUBMIT` submits the on-disk copy; unsaved changes are not submitted | **C** (no IBM support for Edit) | IBM: it "submits the member or data set you are editing", with label and X/NX range operands that only make sense on the edit buffer. Text is silent on unsaved changes. The on-disk wording exists only for **Browse** SUBMIT ("will submit the updated data set, not the copy being browsed", Vol II p.80) | EV-A §1 |
| "No undo in classic ISPF Edit" (`explain.ts:197`) | **C** | UNDO and SETUNDO exist. UNDO is reset by SAVE and no longer needs RECOVERY | EV-A §2 |
| `RECOVERY` "journals your keystrokes" | **P** | Records an audit trail of interactions; creates a recovery data set per change | EV-A §2 |
| "CAPS OFF restores the default"; docs "Defaults: CAPS OFF, NUMBER OFF" | **C** | The editor sets CAPS from the data; example default profile has CAPS, STATS, NUMBER, AUTOSAVE, NOTE on. New profile default is NUMBER ON for standard sequence fields | EV-A §2 |
| Primary `BNDS` shows an editable `=BNDS>` line; BOUNDS is in the `=PROF>` lines | **C** | Primary BOUNDS with no operands resets to default; the line command displays the line. Profile display has five `=PROF>` lines then `=TABS>`, `=MASK>`, `=BNDS>`, `=COLS>`; `=BNDS>` only when non-default | EV-A §2 |
| AUTOSAVE "default on most systems" | **P** | No universal default; ON in the example profile, site-configurable | EV-A §2 |
| FIND/CHANGE "quotes only when the string has blanks" | **P** | Also for commas and keyword-like strings | EV-A §2 |
| Edit status line shows MODIFIED | **C** (undocumented) | No such indicator documented. Documented: `==CHG>` flags and `DATA CHANGED-SAVE/CANCEL` | EV-A §4 |
| Typed `I00001` leftover digits stripped | **P** | Digits are a count only when typed or cursor-delimited; ambiguous digits are ignored | EV-A §3 |
| Line commands I D R C M A B X S F L UC LC TS ( ) < > and block forms | **S** | | EV-A §3 |
| RESET, FLIP, LOCATE, COLS, STATS, HEX, CANCEL, END, SAVE, EXCLUDE | **S** | | EV-A §2 |
| Browse has no prefix area | **S** | Sample figure shows `Line`/`Col` counters, no line-number field | EV-A §4 |
| SAVE of an empty new member | **U** | Not addressed | EV-A §4 |
| "ISPF never pops up dialog boxes" | **C** | Option 0 has "Long message in pop-up"; pop-ups are used throughout | EV-A §5 |
| Option 0 "Default scroll amount" | **C** | Not an option 0 field; Scroll is a per-panel field stored in the user profile. Valid: nnnn, CSR, DATA, HALF, MAX, PAGE | EV-A §5 |
| Typed `3.4` needs two PF3 | **C** (by implication) | IBM calls typing two selections a bypass of the second menu; the PF3 count is not stated outright | EV-A §5 |
| Up to 8 split screens | **P** | 8 is the shipped default; maximum 32 (3290 vertical split 4) | EV-A §5 |
| PF1 shows a longer message | **P** | First HELP shows the long message; a second HELP opens the tutorial | EV-A §5 |
| `X` on the option line "does the same" as leaving a split | **P** | Ends ISPF (or only the active screen if split), applying log/list defaults | EV-A §5 |
| PF12 = Cancel/Retrieve | **P** | CUA F12 is Cancel everywhere; RETRIEVE has no CUA default key. PF4/F16 Return | EV-A §5 |
| `;` stacking, `=` jump, RETURN, RETRIEVE | **S** | | EV-A §5 |
| Dsname Level is a "name prefix" | **P** | Qualifier-based; z/OS 3.2 "Include Additional Qualifiers" off gives exact matches only | EV-A §6 |
| Directory blocks > 0 gives a PDS | **S** with caveat | LIBRARY type overrides a zero value; blank directory gives a sequential data set | EV-A §6 |
| "ISPF statistics are the audit trail operators rely on" | **P** (overstated) | IBM: numbers "can be useful in controlling library members"; mod level increments on first change | EV-A §6 |
| 3.1/3.2/3.3 option sets; `G` reset stats; `I` member info; 3.4 line commands | **S** | Many more real options exist | EV-A §6 |
| PDSE alias claims | **U** | No repo claim text located | EV-A §6 |

### 4.2 TSO/E (EV-A §7)

| Topic | Verdict | Finding |
|---|---|---|
| `SUBMIT`, `LISTDS`, `LISTCAT`, `DELETE`, `RENAME`, `TIME` exist | **S** | SRC-015 |
| `SUBMIT *` valid | **S** | Not available in EDIT mode |
| Unquoted names get the prefix | **S** | Quotes suppress prefix and descriptive qualifier |
| Default `CNTL` qualifier for SUBMIT | **U** | Not stated anywhere; CNTL appears only as the conventional JCL type |
| IKJ56250I, IKJ58503I, IKJ56500I, IKJ56709I | **S** | SRC-016 |
| IKJ56228I wording | **P** | Real text "CANNOT BE ACCESSED" |
| IKJ56650I field order | **P** | Real: TIME, CPU, SERVICE, SESSION, then date |

### 4.3 JCL, JES, messages, utilities (EV-B)

| Topic | Verdict | Finding | Evidence |
|---|---|---|---|
| DISP defaults (NEW; DELETE for NEW else KEEP; abnormal = normal) | **S** | | EV-B §1.1 |
| `DISP=MOD` on a missing data set | **C** | Treated as new, not an error | EV-B §1.1 |
| `DISP=MOD` appends | **C** | Repo replaces all records | EV-B §1.1 |
| PASS / UNCATLG | **C** | Not modelled; UNCATLG removes the entry and keeps the data set (ignored for SMS-managed) | EV-B §1.1 |
| KEEP implies CATLG | **P** | Only for new SMS-managed data sets | EV-B §1.1 |
| COND is evaluated (true = bypass step); JOB COND bypasses remaining steps; EVEN/ONLY | **C** | Repo parses but never evaluates | EV-B §1.2 |
| IF/THEN/ELSE/ENDIF valid, evaluated at execution time, nesting 15 | **C** | Repo rejects as IEFC605I | EV-B §1.2 |
| Flush after abend / allocation error | **S** | | EV-B §1.2 |
| RECFM/LRECL/BLKSIZE/DSORG as top-level DD keywords | **S** | Alternate DCB syntax. (An earlier suspicion that this was wrong was **refuted**.) | EV-B §1.3 |
| DSNTYPE, STORCLAS, DATACLAS, MGMTCLAS, LABEL, FREE, DLM, REFDD, LIKE rejected as unidentified | **C** | All valid; DD has 75 parameters, repo knows 13 | EV-B §1.3 |
| DD * ends at `/*` or `//` | **S** | | EV-B §1.4 |
| DD DATA ends at `//` | **C** | Only `/*` or the DLM ends it | EV-B §1.4 |
| DLM | **C** | Unsupported in repo | EV-B §1.4 |
| Trailing `/*` after last step | **C** (likely) | JCL User's Guide shows "/* (optional) denotes the end of the job" | EV-B §1.4 |
| Null statement `//` ends the job; columns 1-71 operand, 73-80 ignored; continuation | **S** | Repo treats column 72 as text (minor) | EV-B §1.4 |
| Procedure not found | **C** (timing) | Converter error; job not run. Repo detects it mid-run after earlier steps | EV-B §1.4 |
| Temporary data sets `&&X`, referbacks `*.S.D`, concatenation | **C** | Unsupported; `&&X` surfaces as a misleading IEF212I | EV-B §1.4 |
| IEFC606I | **C** | **Does not exist** in z/OS 3.2 Vol 8 (nearest IEFC019I, IEFC020I, IEFC607I) | EV-B §2.1 |
| IEFC605I/612I/621I/630I/662I/452I base texts | **S** | Invented variants ("JOB STATEMENT NAME FIELD MISSING", "NO JOB STATEMENT") are not real; real missing jobname is IEFC635I | EV-B §2.1 |
| IEF212I "names the data set" | **C** | Names job, step and DD, not the data set | EV-B §2.2 |
| IEF374I contains `RC=` | **C** | No return code in the real text (it is in IEF142I); carries CPU/SRB/VIRT/EXT | EV-B §2.2 |
| IEF237I DUMMY shows `JES2` | **C** | Should be `DMY`; data sets show a device number, not a volser | EV-B §2.2 |
| IEF142I, IEF272I, IEF236I, IEF285I, CSV003I, CSV028I | **S** | | EV-B §2.2-2.3 |
| IEF376I, IEF403I, IEF404I, IGD101I, IGD17101I, IEA995I, IEC130I, IDC3203I, IDC3003I | **P** | Layout/field differences (see appendix). IEA995I only issued with a dump DD | EV-B §2.2-2.5 |
| IEF450I template | **P** | Real `ABEND {Scde\|Ucde} REASON=xxxxxxxx` vs repo `ABEND=S806 U0000 REASON=00000004`; flagged for review | EV-B §2.2 |
| IEB351I used as "not found" | **C** | Permanent I/O error with RC 12 | EV-B §2.5 |
| $HASP100, $HASP373 | **S** / **P** | Consistent shape; see appendix | EV-B §2.4 |
| $HASP395 `ENDED - JCL ERROR` | **C** | Not a documented $HASP395 form; JES2 uses $HASP165 for JCL errors | EV-B §2.4 |
| ICE000I product number | **C** | 5655-ZOS, not 5650-ZOS | EV-B §2.6 |
| ICE026A | **C** | **Does not exist**; use ICE056A for a missing DD | EV-B §2.6 |
| ICE007A / ICE201I / ICE054I / ICE055I / ICE052I | **P** / **S** | | EV-B §2.6 |
| S806-04 with CSV003I | **S** | The only abend the simulator produces. S0C7, S013, S222, S322, S722, S913, SB37, SD37 documented, not simulated | EV-B §3 |
| Job id after 99999 | **P** | Format becomes `J0NNNNNN` only when the installation JOBDEF RANGE upper limit exceeds 99,999 | EV-B §4 |
| JESMSGLG line prefix | **C** | Real lines carry `hh.mm.ss JOBnnnnn`; repo uses a date and no job id | EV-B §4 |
| Job states INPUT/ACTIVE/OUTPUT | **P** | SDSF queues: INPUT, CONVERSION, SETUP, EXECUTION, PRINT, OUTPUT, PURGE; there is no ACTIVE queue | EV-B §4 |
| JCL-error job appears in SDSF O | **U** | Output exists on the output queue; O vs H depends on MSGCLASS | EV-B §4, EV-C f2 |
| IEFBR14 | **S** | | EV-B §5 |
| IEBGENER DDs, RC 12; DCB inheritance SYSUT1 to SYSUT2 | **S** / **N** | Repo does not model inheritance | EV-B §5 |
| IEBGENER SYSPRINT texts ("n RECORDS COPIED…") | **U** | Not found in the 3.2 documents | EV-B §5 |
| SORT FIELDS=(p,m,f,s), COPY | **S** | Repo ignores the format code | EV-B §5 |
| DFSORT collation | **C** | EBCDIC by default: lowercase < uppercase < digits. Repo uses JS string order | EV-B §5 |
| LISTCAT output | **P** | Real: `LISTING FROM CATALOG -- name` header; `IN-CAT` only with ALL | EV-B §5 |
| IDCAMS DELETE messages | **S** | | EV-B §2.5 |

### 4.4 SDSF (EV-C Part 2, SRC-023)

| Topic | Verdict | Finding |
|---|---|---|
| H, I, DA, PR, INIT are real separate panels | **C** (repo aliases H/I; DA/PR/INIT "not available") | The 3.2 main panel is a tabular list, not the old numbered menu |
| ST columns | **P** | `NP JOBNAME JobID Owner Prty Queue C Pos SAff ASys Status` per the guide; Max-RC is real; "Date" is not a column title (real: Rd-Date, End-Date); Prty 15 / Queue PRINT is not a documented default |
| Actions `S ? P C A H =` exist | **S** | `P` cancels the job and purges its output |
| `SE` same as `SJ` | **C** | `SE` = ISPF Edit of output data sets; `SJ` = ISPF Edit of the job's JCL |
| `X` as browse | **C** | `X` = Print |
| SJ saving "writes back the member" | **C** | "You can change and resubmit the JCL from the display; changes you make to the data are not saved" |
| PREFIX/OWNER bare name matches by `startsWith` | **C** | Without a trailing generic character it is an exact match |
| Default prefix `*`, owner = userid | **P** | IBM default for both is NONE (all jobs); USERID is a site option; only H is limited to your own jobs by default |
| SORT, FILTER, ARRANGE, SELECT, DEST, SYSID, FIND exist | **S** | Repo supports a subset |
| Job Data Set panel columns and DSIDs | **S** | JESMSGLG 2, JESJCL 3, JESYSMSG 4 in IBM's example |
| LOG | **P** | Real = SYSLOG/OPERLOG console log; repo's per-job summary is a simplification |
| Reaching SDSF from ISPF | **P** | `S` and `TSO SDSF`/`TSO ISF` documented; option 13.14 supplied; bare `SDSF` needs a command-table entry; `SD` and `=M.5` are undocumented in 3.2 |

## 5. The repo's own resource links (`src/content/resources.ts`, `docs/08-resources.md`)

| id | Result (EV-C Part 1) | Tier | Action needed |
|---|---|---|---|
| redbook (`sg246366.pdf`) | OK | 2 | none |
| ispf-users-guide (`f54ug00_v3r1.pdf`) | OK, pinned to z/OS 3.1 | 1 | Point to 3.2 (`f54ug00_v3r2.pdf`, SC19-3627-70). Option 0, 3.x and Browse are in **Vol II** (`f54u200`); add it |
| ispf-edit (`informatik.uni-leipzig.de/.../ISPFedit.pdf`) | OK but it is z/OS 1.8, SC34-4820-05, Sixth Edition, September 2006, on a university host | 3 | Replace with IBM `f54em00_v3r2.pdf` (SC19-3621-70) |
| share-lab (`share.confex.com/.../Session9692/...`) | **UNRESOLVED**: host does not resolve. A search suggests Session**9693** | 3 | Remove or replace; do not guess a URL |
| mainframemaster-menu, mainframemaster-32, mainframestechhelp, lspf | OK | 3 | Keep as supplementary only |
| `docs/08-resources.md` names `.../ispf-allocate-datasets`, absent from `resources.ts` | drift | 3 | Re-sync the two lists |

## 6. Gaps and unresolved items

1. Per-topic **HTML** deep links for z/OS 3.2 could not be obtained for most topics; citations are PDF book + printed page (see section 1). A contributor with browser access should add stable `?topic=` deep links.
2. Not verified: IEBGENER SYSPRINT text; whether `//*` comments may appear between continuation lines; O vs H visibility of JCL-error jobs; the default JES2 JOBDEF RANGE (the extracted table said 1-9999; check on a live system); SAVE of an empty new member; default `CNTL` qualifier for SUBMIT; `LISTCAT LEVEL()` operand text; PDSE alias behaviour; the PF3 count after a typed `3.4`; the Option 0 panel figure (an image, so only field descriptions were checked).
3. SRC-009 (Communications Server) diagnostic-command references, SRC-010 RACF topics, SRC-006 REXX topics, JES2 commands, and ISPF Messages and Codes are landing-level only. They must be read before any lesson that depends on them (Phases 4-5).
4. IEF450I and several message layouts were compared with the book template only; real-system confirmation is advisable before copying exact text into the simulator.
5. Expert review recommended for: Edit `SUBMIT` unsaved-buffer behaviour (the documentation is silent), SDSF `SJ`/`SE` write-back, JESMSGLG layout, and DFSORT message text.

## 7. Lesson and course mapping

See section 8 (added after the lesson audit), and the per-lesson "Verified reference IDs" field in [existing-lessons-audit.md](existing-lessons-audit.md).

## 8. Lesson and course mapping (which sources support which lessons)

Track A = ISPF fundamentals (L1 to L23). Track B/C = batch and operations (L24 to L28, then the proposed lessons in the [curriculum roadmap](curriculum-roadmap.md)). Source IDs are from sections 2 and 3; claim-level verdicts are in section 4 and in each lesson section of [existing-lessons-audit.md](existing-lessons-audit.md).

| Lessons | Subject | Primary sources (topic-level) | Supporting / context |
|---|---|---|---|
| L1-L2 | Orientation, navigation, `3.4` path, PF keys, pop-ups | SRC-013 (function keys, option selection, jump, HELP) | SRC-014 (Settings long-message pop-up), SRC-001 ch.4 |
| L3 | Option 0, TSO commands | SRC-014 (Settings field list), SRC-015 (LISTCAT, LISTDS, TIME), SRC-016, SRC-017 | SRC-001 ch.4 |
| L4-L6 | DSLIST level, data set attributes, allocation | SRC-014 (3.2, 3.4: Dsname Level, directory blocks, DSORG) | SRC-001 ch.5, SRC-017 |
| L7-L11 | Browse, Edit, line commands, copy/move, FIND/CHANGE | SRC-012 (line and primary commands, profile, SAVE/CANCEL/END), SRC-014 (Browse) | SRC-001 ch.4.3 |
| L12-L13 | Member list, 3.3 Move/Copy | SRC-013 and SRC-014 (member list commands, 3.1, 3.3) | |
| L14 | Capstone (JCL edit) | SRC-003 / SRC-018 (statements, continuation, null statement), SRC-012 | |
| L15-L17 | Split screen, SWAP, jump, RETURN, RETRIEVE, `;` stacking | SRC-013 | |
| L18-L21 | COLS, BOUNDS, profiles, UNDO, RECOVERY, EXCLUDE, FLIP | SRC-012 | |
| L22-L23 | DSLIST SORT/FIND/EXCLUDE, member statistics | SRC-014 (3.4, 3.1 member list, Reset ISPF Statistics), SRC-012 (statistics, STATS) | |
| L24 | First job (SUBMIT, job id) | SRC-012 (SUBMIT), SRC-015 (SUBMIT), SRC-016 (IKJ56250I), SRC-018 | SRC-022 (job id format) |
| L25 | SDSF status | SRC-023 (ST, actions, PREFIX/OWNER, entry), SRC-024 | SRC-021 ($HASP messages), SRC-001 ch.6.8 |
| L26 | Job output data sets | SRC-018 (JESMSGLG/JESJCL/JESYSMSG), SRC-023 (JDS panel), SRC-025 (IEBGENER), SRC-027 (SORT) | SRC-028, SRC-019, SRC-015, SRC-017 |
| L27 | JCL error | SRC-019 (IEF212I, IEF272I, IEFC messages), SRC-023 (SJ), SRC-003 (DISP) | SRC-021 |
| L28 | Day-One challenge | as L27, plus SRC-025 | |
| Proposed Track B | JCL, DISP, COND, abends | SRC-003, SRC-018, SRC-019, SRC-020, SRC-025-027 | SRC-001 ch.5-7 |
| Proposed Track C | TSO commands, JES lifecycle, SDSF, messages | SRC-015-017, SRC-021, SRC-022, SRC-023-024, SRC-019 | SRC-026 |
| Proposed Track D | REXX | SRC-006, SRC-029 (landing only: **pending**) | |
| Proposed Track E/F | Specialised, advanced | SRC-009, SRC-010, SRC-011, SRC-030 (mostly landing only: **pending**) | |

## 9. M3 second-pass examination (2026-10-16)

A second-pass AI source examination re-read every cited passage for lessons 29-36 against the local text extracts and recorded each claim in
[m3-evidence-matrix.md](m3-evidence-matrix.md) (release, section, printed page, quote, verdict). **This is not an independent review** and no row
below changes a register status to VERIFIED on its own authority. What the examination added to the register:

| Item | Result |
|---|---|
| Printed-page offsets (printed = PDF minus) | ISPF UG Vol I 28, Vol II 38, Edit and Edit Macros 32, TSO/E Command Reference 26, TSO/E Messages 12, TSO/E User's Guide 18, JCL Reference 46, JCL User's Guide 22, System Messages Vol 8 12 / Vol 4 16 / Vol 6 16, System Codes 14, JES2 Messages 14, JES2 Init and Tuning Reference 20, SDSF User's Guide 52, SDSF Operation and Customization 60, DFSORT Application Programming Guide 28, DFSORT Messages 14, Redbook 24 |
| Corrections to the first M3 evidence | DISP defaults are on JCL Reference p.153 (not p.147-152); IEFC630I text locates the error and does not echo the keyword (System Messages Vol 8 pp.541-542); ICE007A is documented for unbalanced parenthesis, missing comma, embedded blank and invalid format type, not for a misspelt keyword (DFSORT Messages p.18); a PDSE shows PO-E in the 3.4 list (ISPF UG Vol II p.140); zero directory blocks gives a PS only when Data set name type is blank (UG Vol II pp.107-108); MAX typed in the Scroll field is one-time (ISPF UG Vol I pp.17, 60); the TSO SUBMIT command, not JES, issues IKJ56250I (TSO/E Command Reference p.121, Messages p.544); an initiator, not JES, runs the job (Redbook p.276) |
| Register gaps found | no per-topic HTML URL for ISPF UG Vol I/II, TSO/E books, System Messages/Codes, JES2 books, DFSORT books (book-level only); the JES2 Initialization and Tuning Guide (`hasa300`) is only a CANDIDATE in SRC-030; SRC-018 to SRC-028 carry a document code and no URL |
| Still UNVERIFIED (expert needed) | which spool data set holds IEFC converter messages and the `STMT NO. MESSAGE` header; real placement of CSV003I/IEF450I (job log or JESYSMSG); the real ICE message for an unknown SORT keyword; whether a real DFSORT run with `SORTIN DD DUMMY` ends RC 0; real ISPF text for several simulator-only messages; the real initial Edit Scroll value |

