# b-02-dataset-types — Sequential data sets, PDS and PDSE, and their attributes

Track / module:           B z/OS and batch / Foundations
Number and stable ID:     lesson 31, `b-02-dataset-types` (never changes)
Audience and difficulty:  beginner
Lesson type:              interactive
Prerequisites:            `l06-allocating` (declared in `requires`; advice only). Leaves behind: `{HLQ}.TYPES.SEQ` and `{HLQ}.TYPES.LIB`, both removed on every start
Estimated time:           15 minutes
Review status:            **draft** — claims checked against the sources below by the author only. Source review, fidelity review and expert review pending

## Learning objectives
1. Tell a sequential data set (DSORG PS) from a partitioned data set (PDS, DSORG PO) and say what the directory is for.
2. Say how a PDSE differs from a PDS, and where ISPF shows the difference.
3. Choose and read the attributes RECFM, LRECL and directory blocks when allocating.

## Terminology
Sequential data set (PS); partitioned data set (PDS, PO); member; directory; PDSE (library); RECFM; LRECL; DSORG.

## Conceptual explanation (original wording; sources in brackets)
- Traditional z/OS data sets are record oriented. There is no end-of-line character: each record is fixed or variable length, and in ISPF Edit each line is a record. [SRC-001 printed p.211, 5.8]
- RECFM F means fixed length records and FB fixed blocked; FB is the common choice for fixed-length records. V and VB are variable. [SRC-001 p.211-212, 5.8]
- A sequential data set holds records in physical order and is processed in sequence; its organization is PS. [SRC-001 p.215, 5.9.1]
- A PDS is a collection of sequential data sets called members, each with a name of up to eight characters, plus a directory with an entry per member. Its organization is PO. ISPF is used mostly to create and edit PDSs. [SRC-001 p.215-216, 5.9.2]
- A PDSE has a directory and members like a PDS, but a different internal format: its directory grows automatically and space from deleted members is reused without compressing. [SRC-001 p.217-218, 5.9.3]
- On the ISPF Allocate panel the directory blocks value is zero for a sequential data set. [SRC-001 Figure 4-5, p.172]
- In Data Set Information a PDSE shows "Data set name type" LIBRARY and "Maximum dir. blocks" NOLIMIT, where a PDS shows PDS and a block count. [SRC-014 UG2 printed p.94]

## Worked example
`{HLQ}.TYPES.SEQ`: FB, 80, 0 directory blocks, so DSORG PS: one stream of records. `{HLQ}.TYPES.LIB`: FB, 80, 5 directory blocks, so DSORG PO: a library that holds members. Both appear in the 3.4 list with PS and PO in the organization column.

## Guided activity
1. Allocate `{HLQ}.TYPES.SEQ` with 3.2 option A: FB, LRECL 80, 0 directory blocks.
2. Allocate `{HLQ}.TYPES.LIB`: FB, LRECL 80, 5 directory blocks.
3. List level `{HLQ}.TYPES` in 3.4 and compare PS with PO.
4. `I` on the library: organization PO, name type PDS, directory blocks and member count.
5. `I` on the sequential data set: organization PS, no directory.
6. At the Command Shell run `LISTDS '{HLQ}.TYPES.LIB'`: the DSORG column reads PO.
7. Try to open `{HLQ}.TYPES.SEQ(ONE)`: a sequential data set has no members. (Instructed error; not counted.)

## Independent challenge
"Create `{HLQ}.TYPES.SEQ` as a sequential data set and `{HLQ}.TYPES.LIB` as a library with directory blocks, both FB and LRECL 80, then show the information for each (option I in 3.4, or LISTDS)."

## Common mistakes
- Giving a library zero directory blocks: it becomes sequential (the simulator allocates a PS).
- Expecting `LIBRARY` in the name-type field to give a PDSE: the simulator makes an ordinary PDS.
- Allocating again with the same name: `DATA SET ALREADY EXISTS` (delete with 3.2 option D first).

## Expected results
3.4 shows `USER01.TYPES.LIB  PO  FB  80` and `USER01.TYPES.SEQ  PS  FB  80`. The step 7 message is the simulator's `DATA SET IS NOT PARTITIONED`.

## Simulator limitations (shown to the learner)
- A PDSE cannot be created or shown: the Data set name type field accepts LIBRARY or PDS but both give an ordinary PDS. A real PDSE shows LIBRARY and NOLIMIT directory blocks.
- Real ISPF decides PDS versus PDSE from the name type or the system defaults; here the directory blocks decide only between PS and PO.
- The exact message for step 7 is the simulator's wording (SIMULATED), not a verified ISPF message.
- Space, volume and utilization figures are simulated.

## References
SRC-001 *Introduction to the New Mainframe: z/OS Basics* SG24-6366-02 (2011): printed p.172 (Figure 4-5), p.211-212 (5.8), p.215-218 (5.9.1-5.9.3). SRC-014 *z/OS ISPF User's Guide Vol II* SC19-3628-70: Data Set Information, printed p.94. SRC-015 TSO/E Command Reference (LISTDS) was not re-read; the lesson relies on the SRC-001 p.169 LISTDS example for the output columns. All checked against the PDF text on 2026-10-15.

## Validation design
- State: data set type, RECFM, LRECL and directory blocks of both data sets (step 1, 2 and Challenge).
- Events: `DATASET_SEARCHED` (compare), `DATASET_INFO_VIEWED` (full information for the library; any for the sequential one), `TSO_COMMAND_ENTERED` LISTDS (Learn step 6; an alternative to I in the Challenge), `MESSAGE_SHOWN` `DATA SET IS NOT PARTITIONED` (step 7).
- False positives considered: allocating with other attributes (state check fails); short information `S` for the library (it omits the directory blocks, so it does not count); listing a different level (level must cover both); stale data sets (removed on start).
- Alternatives accepted: any level that covers both names; `I` or `LISTDS` for the sequential data set; `LISTDS` with the full name, quoted or not (a short unquoted dotted name is not prefixed by the simulator, GAP-20, so it does not count).
- Challenge false at the start; leftovers cannot satisfy it because both names are removed first.

## Starting state and reset
`removeDatasets` `{HLQ}.TYPES.SEQ` and `{HLQ}.TYPES.LIB`, screen Primary Option Menu.
