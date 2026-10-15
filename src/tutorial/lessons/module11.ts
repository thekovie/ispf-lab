/**
 * Module 11 - Foundations (M3). Lesson specs: docs/curriculum/lessons/<id>.md. Review status of every lesson here: draft
 * (author-checked against the sources named in the spec; independent source, fidelity and expert review pending).
 */
import { parseJcl } from "@/jes/jcl";
import { editorClosed, editorOpen, eventIs, memberSatisfies, onScreen } from "../validators";
import type { Lesson, LessonContext, Validator } from "../types";

const MODULE = "Foundations";

/** The Scroll amount currently held by the open edit session. */
const scrollIs =
  (amount: string): Validator =>
  ({ state }) =>
    state.editor?.scrollAmount.toUpperCase() === amount;

const SCROLL_LINES = Array.from({ length: 60 }, (_, i) => `PRACTICE LINE ${String(i + 1).padStart(3, "0")} OF 060`);

export const lessonA01: Lesson = {
  id: "a-01-panel-fields-scroll",
  number: 29,
  module: MODULE,
  title: "Panel fields and the Scroll amount",
  description: "Find the Scroll field on an Edit panel, change it, and see the difference between the field and a one-time amount.",
  objective: "Open {HLQ}.DATA(SCROLL) in Edit, scroll a page, set the Scroll field to HALF and scroll half a page, then use DOWN 3 once without changing the field.",
  teaches: [
    "The Scroll ===> field holds the scroll amount; type over it to change it",
    "PAGE is a full screen, HALF is half a screen, a number is that many lines",
    "An amount given with the scroll command (DOWN 3) is one-time and leaves the field alone",
    "MAX goes to the end of the data, once",
  ],
  requires: ["l01-meet-ispf"],
  sources: ["SRC-013"],
  startingState: {
    screen: { id: "PRIMARY_OPTION_MENU" },
    resetSettings: ["scrollDefault"],
    createMembers: [{ dsn: "{HLQ}.DATA", member: "SCROLL", records: SCROLL_LINES }],
  },
  steps: [
    {
      id: "open",
      instruction: "Open {HLQ}.DATA(SCROLL) in Edit: option 2, then {HLQ}.DATA(SCROLL) in Other Data Set Name.",
      explanation:
        "The member has 60 numbered lines, more than one screen. On line 2, after Command ===>, there is a short input field marked Scroll ===> . Many ISPF panels carry one; it says how far each scroll key moves the data.",
      hint: "2, Enter, {HLQ}.DATA(SCROLL), Enter.",
      validator: editorOpen("{HLQ}.DATA", "SCROLL", "EDIT"),
      highlightField: "scroll",
    },
    {
      id: "page",
      instruction: "The Scroll field shows PAGE. Press PF8 (Down): the data moves down one full page.",
      explanation: "PAGE means the full height of the scrollable area. Watch the line numbers: the first line shown is now one screen further on.",
      hint: "F8.",
      validator: eventIs("EDITOR_SCROLLED", (e) => e.amount === "PAGE"),
    },
    {
      id: "half",
      instruction: "Type HALF over PAGE in the Scroll ===> field, then press PF8. This time the data moves half a page.",
      explanation:
        "The Scroll field is an ordinary input field: typing over it changes the amount until you change it again. HALF is half the height of the scrollable area. A number would move that many lines.",
      hint: "Tab to Scroll ===> , type HALF, press F8.",
      validator: eventIs("EDITOR_SCROLLED", (e) => e.amount === "HALF"),
      highlightField: "scroll",
    },
    {
      id: "once",
      instruction: "Type DOWN 3 on the Command ===> line and press Enter. The data moves 3 lines, and the Scroll field still says HALF.",
      explanation:
        "An amount typed with the scroll command is a temporary, one-time override: it is used once and the field is not touched. That is the difference between the field (a standing setting) and the command (this one move).",
      hint: "DOWN 3, Enter.",
      validator: (ctx) => eventIs("EDITOR_SCROLLED", (e) => e.amount === "3")(ctx) && scrollIs("HALF")(ctx),
      highlightField: "command",
    },
    {
      id: "max",
      instruction: "Type DOWN MAX and press Enter. The last page of data shows, and the field still says HALF.",
      explanation:
        "MAX goes to the limit of the data in the direction you scroll, and it applies only to that scroll. (Real ISPF keeps separate saved amounts for Browse, for Edit and View, and for member lists; this simulator keeps one per edit session, and only the Edit panel's field can be changed. DATA and CSR also scroll a full page here, and the 'number, then the scroll key' form is not supported.)",
      hint: "DOWN MAX, Enter.",
      validator: eventIs("EDITOR_SCROLLED", (e) => e.amount === "MAX"),
    },
    {
      id: "leave",
      instruction: "Press PF3 to leave the member. You changed nothing, so there is nothing to save.",
      hint: "F3.",
      validator: editorClosed,
    },
  ],
};

export const lessonB01: Lesson = {
  id: "b-01-zos-big-picture",
  number: 30,
  module: MODULE,
  title: "The big picture: TSO/E, ISPF, JES and SDSF",
  description: "Follow one job through the four pieces you use every day: a TSO/E session, ISPF, JES and SDSF.",
  objective:
    "Run a TSO command at the ISPF Command Shell, edit and submit {HLQ}.JCL(HELLO) from ISPF, then read that job's output in SDSF - and say which piece you were using at each step.",
  teaches: [
    "TSO/E gives you an interactive session with z/OS and a basic command prompt",
    "ISPF is the full-panel application on top of it, with an editor and utilities",
    "JES receives submitted jobs, schedules them and controls their output",
    "SDSF shows what JES holds on the spool",
  ],
  sources: ["SRC-001"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" }, resetJobs: true, resetMembers: [{ dsn: "{HLQ}.JCL", member: "HELLO" }] },
  steps: [
    {
      id: "tso",
      instruction: "Open option 6, the ISPF Command Shell, and enter LISTDS '{HLQ}.JCL'. This is TSO: a command typed at its basic prompt.",
      explanation:
        "TSO/E gives a user an interactive session with z/OS, with a single-user logon and a basic command prompt. Most people reach it through ISPF's menus, but the commands underneath are still TSO commands. LISTDS shows a data set and its attributes. (In this simulator the Command Shell is an ISPF panel that runs the TSO command for you.)",
      hint: "6, Enter, then LISTDS '{HLQ}.JCL', Enter.",
      validator: eventIs("TSO_COMMAND_ENTERED", (e) => /^(TSO\s+)?LISTDS\b/i.test(e.command.trim())),
    },
    {
      id: "ispf",
      instruction: "Press PF3 to return to the menu, then open {HLQ}.JCL(HELLO) in Edit (option 2). This is ISPF.",
      explanation:
        "ISPF is a full-panel application you drive from the keyboard. It includes a text editor and browser, and utilities for finding and listing data sets. HELLO is a small JCL job: a JOB statement and one step.",
      hint: "F3, then 2, Enter, {HLQ}.JCL(HELLO), Enter.",
      validator: editorOpen("{HLQ}.JCL", "HELLO", "EDIT"),
    },
    {
      id: "jes",
      instruction: "Type SUBMIT on the command line and press Enter. The message says JOB {HLQ}H(JOBnnnnn) SUBMITTED. That is the system accepting the job: JES now has it.",
      explanation:
        "The job entry subsystem (JES) receives jobs into the operating system, schedules them for processing and controls their output. One way a job reaches JES is from ISPF with SUBMIT. On a real system the job then waits in a queue until it is selected to run; here it runs at once.",
      hint: "SUBMIT, Enter.",
      validator: eventIs("JOB_SUBMITTED", (e) => e.from === "EDIT"),
    },
    {
      id: "sdsf",
      instruction: "Press PF3 to leave the editor, jump to SDSF with =S, and open ST (status).",
      explanation: "SDSF is the System Display and Search Facility. It displays output held in the JES spool area, so you can inspect it and delete what you do not need. You reach it from the ISPF menu, but it reads JES, not ISPF.",
      hint: "F3, =S, Enter, ST, Enter.",
      validator: eventIs("JOB_STATUS_OPENED"),
    },
    {
      id: "output",
      instruction: "Type S next to {HLQ}H and press Enter to browse its output.",
      explanation: "That is the end of the trace: your session (TSO/E) used ISPF to edit a job, JES ran and kept it, and SDSF showed what JES kept. Next lessons open each piece up.",
      hint: "S in the NP column of {HLQ}H, Enter.",
      validator: eventIs("JOB_OUTPUT_OPENED"),
    },
    {
      id: "leave",
      instruction: "Press PF3 to return to the status panel.",
      hint: "F3.",
      validator: onScreen("SDSF_STATUS"),
    },
  ],
};

/** Attributes of {HLQ}.TYPES.<tail> as the catalog holds them now (state, so a stale data set cannot pass by accident). */
const typesDataset = (ctx: LessonContext, tail: "SEQ" | "LIB") => ctx.state.catalog.datasets[`${ctx.hlq}.TYPES.${tail}`];
const isFb80 = (ds: { recfm: string; lrecl: number }) => ds.recfm === "FB" && ds.lrecl === 80;
export const typesSeqIsRight: Validator = (ctx) => {
  const ds = typesDataset(ctx, "SEQ");
  return !!ds && ds.datasetType === "PS" && isFb80(ds);
};
export const typesLibIsRight: Validator = (ctx) => {
  const ds = typesDataset(ctx, "LIB");
  return !!ds && ds.datasetType === "PDS" && isFb80(ds) && ds.dirBlocks >= 1;
};

export const lessonB02: Lesson = {
  id: "b-02-dataset-types",
  number: 31,
  module: MODULE,
  title: "Sequential data sets, PDS and PDSE",
  description: "Create a sequential data set and a library, see how the directory makes the difference, and read the attributes.",
  objective:
    "Allocate {HLQ}.TYPES.SEQ (sequential, FB, LRECL 80) and {HLQ}.TYPES.LIB (a library, FB, LRECL 80, with directory blocks), compare them in the data set list and in Data Set Information, and see that only the library has members.",
  teaches: [
    "A sequential data set (DSORG PS) is one stream of records",
    "A PDS (DSORG PO) is a library of named members with a directory",
    "A PDSE is a library with a different internal format and a directory that grows by itself",
    "RECFM FB and LRECL 80 are the usual choice for source and JCL",
  ],
  requires: ["l06-allocating"],
  sources: ["SRC-001", "SRC-014"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" }, removeDatasets: ["{HLQ}.TYPES.SEQ", "{HLQ}.TYPES.LIB"] },
  steps: [
    {
      id: "seq",
      instruction: "Open the Data Set Utility (3.2) and allocate {HLQ}.TYPES.SEQ with option A: Record format FB, Record length 80 and Directory blocks 0.",
      explanation:
        "Traditional z/OS data sets are made of records, not a stream of bytes: every record is fixed or variable length, and in the editor each line is a record. FB means fixed-length records grouped in blocks, the usual choice for fixed-length text such as source and JCL. A directory block count of zero means a sequential data set: records in order, one after another (organization PS).",
      hint: "3.2, A, Other Data Set Name {HLQ}.TYPES.SEQ, Enter; FB, 80, directory blocks 0, Enter.",
      validator: (ctx) => eventIs("DATASET_ALLOCATED", (e, c) => e.dsn === `${c.hlq}.TYPES.SEQ`)(ctx) && typesSeqIsRight(ctx),
      highlightField: "dirblocks",
    },
    {
      id: "lib",
      instruction: "Allocate {HLQ}.TYPES.LIB the same way, but with Directory blocks 5. FB, LRECL 80.",
      explanation:
        "A partitioned data set (PDS) is a collection of sequential data sets called members, each with a name of up to eight characters. It also has a directory with one entry per member, which is what the directory blocks reserve. Its organization is PO. Most of what you edit in ISPF lives in libraries like this.",
      hint: "3.2, A, {HLQ}.TYPES.LIB, Enter; FB, 80, directory blocks 5, Enter.",
      validator: (ctx) => eventIs("DATASET_ALLOCATED", (e, c) => e.dsn === `${c.hlq}.TYPES.LIB`)(ctx) && typesLibIsRight(ctx),
      highlightField: "dirblocks",
    },
    {
      id: "compare",
      instruction: "List {HLQ}.TYPES in the Data Set List Utility (3.4). Compare the two rows: PS for one, PO for the other.",
      explanation:
        "The list shows organization (PS or PO), record format and record length for each data set. A PDSE would look like a PDS here: it has a directory and members too, but a different internal format. Its directory grows automatically and it reuses the space of deleted members, so it never needs compressing. (This simulator cannot create a PDSE: the Data set name type field gives an ordinary PDS for LIBRARY and for PDS.)",
      hint: "=3.4, {HLQ}.TYPES, Enter.",
      validator: eventIs("DATASET_SEARCHED", (e, ctx) => {
        const level = e.level.toUpperCase().replace(/[.*%]+$/, "");
        return e.results >= 2 && `${ctx.hlq}.TYPES.SEQ`.startsWith(level) && `${ctx.hlq}.TYPES.LIB`.startsWith(level);
      }),
      highlightField: "level",
    },
    {
      id: "info-lib",
      instruction: "Type I next to {HLQ}.TYPES.LIB and press Enter. Read Organization, Data set name type, and the directory blocks and number of members.",
      explanation:
        "Data Set Information shows organization PO and name type PDS for a library, with its directory blocks and member count. A real PDSE shows the name type LIBRARY and NOLIMIT for the directory blocks, because its directory has no fixed size. (S, the short form, leaves the directory blocks and member count out, so use I.)",
      hint: "I in the command column of {HLQ}.TYPES.LIB, Enter.",
      validator: eventIs("DATASET_INFO_VIEWED", (e, ctx) => e.dsn === `${ctx.hlq}.TYPES.LIB` && !e.short),
      highlightField: "cmd:{HLQ}.TYPES.LIB",
    },
    {
      id: "info-seq",
      instruction: "Press PF3, then type I next to {HLQ}.TYPES.SEQ. Organization is PS and there is no directory.",
      hint: "F3, then I on {HLQ}.TYPES.SEQ, Enter.",
      validator: eventIs("DATASET_INFO_VIEWED", (e, ctx) => e.dsn === `${ctx.hlq}.TYPES.SEQ`),
      highlightField: "cmd:{HLQ}.TYPES.SEQ",
    },
    {
      id: "listds",
      instruction: "Jump to the ISPF Command Shell (=6) and enter LISTDS '{HLQ}.TYPES.LIB'. The DSORG column reads PO.",
      explanation: "LISTDS is a TSO command (lesson 30). It prints the record format, record length, block size and organization of a data set, so you can check attributes without leaving the command prompt.",
      hint: "=6, Enter, then LISTDS '{HLQ}.TYPES.LIB', Enter.",
      validator: eventIs("TSO_COMMAND_ENTERED", (e, ctx) => /^(TSO\s+)?LISTDS\b/i.test(e.command.trim()) && e.command.toUpperCase().includes(`${ctx.hlq}.TYPES.LIB`)),
    },
    {
      id: "member",
      instruction: "Now try to open {HLQ}.TYPES.SEQ(ONE) in Edit (=2). Only a library has members, so the simulator refuses.",
      explanation:
        "A member name only makes sense for a partitioned data set. The refusal is on purpose and is not counted against you. (The message wording, DATA SET IS NOT PARTITIONED, is the simulator's own; it is not a verified ISPF message.)",
      hint: "=2, then {HLQ}.TYPES.SEQ(ONE) in Other Data Set Name, Enter.",
      validator: eventIs("MESSAGE_SHOWN", (e) => e.text === "DATA SET IS NOT PARTITIONED"),
      expectsError: true,
    },
  ],
};

/** The JOB statement ends with a comma, so the next statement is not the continuation the system waits for (IEFC621I). */
const BROKEN_JCL = ["//{HLQ}B  JOB (ACCT),'FIX ME',CLASS=A,", "//STEP1    EXEC PGM=IEFBR14", "//"];

/** The text now in the editor parses as JCL with no converter errors (the parser is the checker, not a text match). */
const editorJclIsClean: Validator = ({ state }) => !!state.editor && parseJcl(state.editor.lines.map((l) => l.text)).errors.length === 0;
const brokenJob = (e: { jobName: string }, ctx: LessonContext) => e.jobName === `${ctx.hlq}B`;

export const lessonB03: Lesson = {
  id: "b-03-jcl-anatomy",
  number: 32,
  module: MODULE,
  title: "Reading a job: JOB, EXEC, DD and continuation",
  description: "Read a small job statement by statement, learn where the fields go, then find and fix a missing continuation.",
  objective: "Read {HLQ}.JCL(HELLO), show the column ruler, then find out why {HLQ}.JCL(BROKEN) ends with a JCL error and fix it so it runs to CC 0000.",
  teaches: [
    "A job is JOB, EXEC and DD statements; a null statement (//) ends it",
    "Columns 1-2 hold //, the name starts in column 3, nothing is coded past column 71",
    "A trailing comma means the next record must continue the statement (// then a blank)",
    "IEFC621I names a missing continuation; STMT NO. is the statement number in the JESJCL listing",
  ],
  requires: ["b-02-dataset-types"],
  sources: ["SRC-003", "SRC-019"],
  startingState: {
    screen: { id: "PRIMARY_OPTION_MENU" },
    resetJobs: true,
    resetMembers: [{ dsn: "{HLQ}.JCL", member: "HELLO" }],
    createMembers: [{ dsn: "{HLQ}.JCL", member: "BROKEN", records: BROKEN_JCL }],
  },
  steps: [
    {
      id: "open",
      instruction: "Open {HLQ}.JCL(HELLO) in Edit (option 2) and read it: a JOB statement, an EXEC statement, and a lone // at the end.",
      explanation:
        "A JCL statement is made of 80-byte records, like punched-card images, with up to five fields: identifier, name, operation, parameters and comments. The JOB statement marks the start of a job. An EXEC statement names the program a step runs and marks the beginning of each step. A DD statement (HELLO has none; IEFBR14 needs no data) describes a data set a step uses. A null statement, just //, marks the end of the job.",
      hint: "2, Enter, {HLQ}.JCL(HELLO), Enter.",
      validator: editorOpen("{HLQ}.JCL", "HELLO", "EDIT"),
    },
    {
      id: "cols",
      instruction: "Type COLS on the command line. The ruler shows the columns: // sits in columns 1-2.",
      explanation:
        "The identifier field is // in columns 1 and 2. A name, if there is one, starts in column 3 (1 to 8 characters, the first one a letter or national character) and is followed by a blank; then come the operation (JOB, EXEC, DD) and its parameters. Do not code anything past column 71: columns 73-80 are ignored.",
      hint: "COLS, Enter.",
      validator: eventIs("COLS_DISPLAYED"),
    },
    {
      id: "leave",
      instruction: "Press PF3 to leave HELLO (nothing changed).",
      hint: "F3.",
      validator: editorClosed,
    },
    {
      id: "submit",
      instruction: "Go to the menu and submit the other member: TSO SUBMIT JCL(BROKEN) on the Option line. It will be accepted as submitted, but it will not run.",
      hint: "F3 to the menu, then TSO SUBMIT JCL(BROKEN), Enter.",
      validator: eventIs("JCL_ERROR_GENERATED", (e, ctx) => brokenJob(e, ctx)),
    },
    {
      id: "read",
      instruction: "Open SDSF (=S, ST), type ? next to {HLQ}B, then S next to JESYSMSG. Read the line under STMT NO. MESSAGE.",
      explanation:
        "IEFC621I EXPECTED CONTINUATION NOT RECEIVED: a comma ended the last operand on a line, but the next record was not a continuation. STMT NO. is the statement number as numbered in the JESJCL listing (comments and continuation records are not numbered). A JCL error means no step ran.",
      hint: "=S, ST, ? on {HLQ}B, S on JESYSMSG.",
      validator: eventIs("JOB_OUTPUT_OPENED", (e) => e.ddname === "JESYSMSG"),
    },
    {
      id: "fix",
      instruction: "Edit {HLQ}.JCL(BROKEN) and fix statement 1: take the comma off the end of the JOB statement (or continue it properly with a record that starts // and a blank).",
      explanation:
        "To continue a statement, stop after a complete parameter and its comma, at or before column 71, and begin the next record with // and a blank in column 3. Here nothing was meant to continue, so the comma is simply a mistake. (This simulator accepts continued text from any column after column 3; IBM allows columns 4-16.)",
      hint: "F3 out of SDSF, =2, {HLQ}.JCL(BROKEN); overtype the end of the JOB statement; Enter.",
      validator: (ctx) => editorOpen("{HLQ}.JCL", "BROKEN", "EDIT")(ctx) && editorJclIsClean(ctx),
    },
    {
      id: "rerun",
      instruction: "Type SUBMIT. This time the job runs and ends CC 0000.",
      hint: "SUBMIT, Enter.",
      validator: eventIs("JOB_COMPLETED", (e, ctx) => brokenJob(e, ctx) && e.status === "OUTPUT" && e.maxRc === 0),
    },
    {
      id: "save",
      instruction: "Press PF3 to save the corrected member.",
      hint: "F3.",
      validator: (ctx) => editorClosed(ctx) && memberSatisfies("{HLQ}.JCL", "BROKEN", (records) => parseJcl(records).errors.length === 0)(ctx),
    },
  ],
};
