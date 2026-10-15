/**
 * M3 lessons 29-36. Lesson specs: docs/curriculum/lessons/<id>.md; claim-level evidence: docs/curriculum/m3-evidence-matrix.md.
 * Review status of every lesson here: draft (a second-pass AI source examination and the author's checks; independent
 * source, fidelity and expert review pending). `draft` hides them from learners (ADR 0018). Their display order and the
 * module each sits in are set in ./index.ts and below; ids and numbers never change.
 */
import { dispStatus, parseJcl, type DdStatement } from "@/jes/jcl";
import { answered, editorClosed, editorOpen, eventIs, memberSatisfies, onScreen } from "../validators";
import type { Lesson, LessonContext, Question, Validator } from "../types";

// The module each lesson is listed under (display grouping only; see ADR 0018).
const EDITOR = "The editor";
const DATASETS = "Data sets";
const BATCH = "Batch jobs and SDSF";

/** The Scroll amount currently held by the open edit session. */
const scrollIs =
  (amount: string): Validator =>
  ({ state }) =>
    state.editor?.scrollAmount.toUpperCase() === amount;

const SCROLL_LINES = Array.from({ length: 60 }, (_, i) => `PRACTICE LINE ${String(i + 1).padStart(3, "0")} OF 060`);

export const lessonA01: Lesson = {
  id: "a-01-panel-fields-scroll",
  number: 29,
  module: EDITOR,
  draft: true,
  title: "Panel fields and the Scroll amount",
  description: "Find the Scroll field on an Edit panel, change it, and see the difference between the field and a one-time amount.",
  objective: "Open {HLQ}.DATA(SCROLL) in Edit, scroll a page, set the Scroll field to HALF and scroll half a page, then use DOWN 3 once without changing the field.",
  teaches: [
    "The Scroll ===> field holds the scroll amount; type over it to change it",
    "PAGE is a full page of the visible data, HALF is half of it, a number is that many lines",
    "An amount given with the scroll command (DOWN 3) is one-time and leaves the field alone",
    "MAX goes to the limit of the data in the direction you scroll, for one scroll only",
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
        "The member has 60 numbered lines, more than one screen. Next to Command ===> there is a short input field marked Scroll ===> . (Here it is on line 2; real ISPF puts the command line at the bottom by default.) Many ISPF panels carry one; it says how far each scroll command moves the data.",
      hint: "2, Enter, {HLQ}.DATA(SCROLL), Enter.",
      validator: editorOpen("{HLQ}.DATA", "SCROLL", "EDIT"),
      highlightField: "scroll",
    },
    {
      id: "page",
      instruction: "The Scroll field starts at PAGE here (the simulator's starting value). Press PF8 (Down): the data moves down one full page.",
      explanation: "PAGE means a full page of the visible data. Watch the line numbers: the first line shown is now one screen further on.",
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

/** Check questions for b-01 (ADR 0018): recall of the four roles, asked after the trace. Wrong answers are mistakes. */
const B01_QUESTIONS: Question[] = [
  { id: "role-session", prompt: "Which piece gives each user ID a logon session on z/OS, the session that ISPF runs inside?", options: ["JES", "TSO/E", "SDSF", "ISPF"], correct: 1 },
  { id: "role-jes", prompt: "Which piece received the submitted job, schedules it for processing and controls its output processing?", options: ["ISPF", "SDSF", "JES", "TSO/E"], correct: 2 },
  { id: "role-sdsf", prompt: "In this trace, which piece did you use to display the job's output held on the spool?", options: ["SDSF", "TSO/E", "JES", "ISPF Edit"], correct: 0 },
];

export const lessonB01: Lesson = {
  id: "b-01-zos-big-picture",
  number: 30,
  module: BATCH,
  draft: true,
  title: "The big picture: TSO/E, ISPF, JES and SDSF",
  description: "Follow one job through four pieces you meet in everyday z/OS work: a TSO/E session, ISPF, JES and SDSF.",
  objective:
    "Run a TSO command at the ISPF Command Shell, edit and submit {HLQ}.JCL(HELLO) from ISPF, then read that job's output in SDSF - and say which piece you were using at each step.",
  teaches: [
    "TSO/E gives each user ID an interactive session with z/OS and a basic command prompt",
    "ISPF is a full-panel application that runs in your TSO/E session, with an editor and utilities",
    "JES receives submitted jobs, schedules them and controls their output",
    "SDSF shows what JES holds on the spool",
  ],
  sources: ["SRC-001", "SRC-013", "SRC-014", "SRC-015", "SRC-016", "SRC-017", "SRC-023", "SRC-024"],
  questions: B01_QUESTIONS,
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" }, resetJobs: true, resetMembers: [{ dsn: "{HLQ}.JCL", member: "HELLO" }] },
  steps: [
    {
      id: "tso",
      instruction: "Open option 6, the ISPF Command Shell, and enter LISTDS '{HLQ}.JCL'. LISTDS is a TSO command: you type it in the Command Shell, which hands it to TSO/E.",
      explanation:
        "TSO/E gives each user ID its own interactive session with z/OS and a basic command prompt (native TSO shows a READY prompt; the simulator has none). Most people reach TSO through ISPF's menus. TSO commands such as LISTDS are run by TSO/E even when you type them in ISPF; ISPF also has commands of its own. LISTDS shows a data set and its attributes.",
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
      instruction: "Type SUBMIT on the command line and press Enter. The message says JOB {HLQ}H(JOBnnnnn) SUBMITTED: the SUBMIT command reports it, and JES has given the job its number.",
      explanation:
        "The job entry subsystem (JES) receives jobs into the operating system, schedules them for processing and controls their output processing. One way a job reaches JES is from ISPF with SUBMIT. On a real system the job then waits in a queue until it is selected to run; here it runs at once.",
      hint: "SUBMIT, Enter.",
      validator: eventIs("JOB_SUBMITTED", (e) => e.from === "EDIT"),
    },
    {
      id: "sdsf",
      instruction: "Press PF3 to leave the editor, jump to SDSF with =S, and open ST (status).",
      explanation: "SDSF is the System Display and Search Facility. It displays output held in the JES spool area, so you can inspect it and delete what you do not need. SDSF is not part of ISPF: you can start it from the ISPF menu or from TSO, and the job and output data it shows comes from JES.",
      hint: "F3, =S, Enter, ST, Enter.",
      validator: eventIs("JOB_STATUS_OPENED"),
    },
    {
      id: "output",
      instruction: "Type S next to {HLQ}H and press Enter to browse its output.",
      explanation: "That is the end of the trace: you worked in a TSO/E session, edited the job in ISPF, JES queued it and kept its output on the spool (an initiator ran the job), and SDSF showed what JES kept. Next lessons open each piece up.",
      hint: "S in the NP column of {HLQ}H, Enter.",
      validator: eventIs("JOB_OUTPUT_OPENED"),
    },
    {
      id: "leave",
      instruction: "Press PF3 to return to the status panel.",
      hint: "F3.",
      validator: onScreen("SDSF_STATUS"),
    },
    {
      id: "check-session",
      instruction: "Answer the question in the Check box.",
      hint: "Which piece do you log on to, with your user ID?",
      validator: answered("role-session"),
      questionId: "role-session",
    },
    {
      id: "check-jes",
      instruction: "Answer the question in the Check box.",
      hint: "Which piece gave the job its JOBnnnnn number and queues it?",
      validator: answered("role-jes"),
      questionId: "role-jes",
    },
    {
      id: "check-sdsf",
      instruction: "Answer the question in the Check box.",
      hint: "Which piece did you reach with =S?",
      validator: answered("role-sdsf"),
      questionId: "role-sdsf",
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
  module: DATASETS,
  draft: true,
  title: "Sequential data sets, PDS and PDSE",
  description: "Create a sequential data set and a library, see how the directory makes the difference, and read the attributes.",
  objective:
    "Allocate {HLQ}.TYPES.SEQ (sequential, FB, LRECL 80) and {HLQ}.TYPES.LIB (a library, FB, LRECL 80, with directory blocks), compare them in the data set list and in Data Set Information, and see that only the library has members.",
  teaches: [
    "A sequential data set (DSORG PS) holds records in order",
    "A PDS (DSORG PO) is a library of named members with a directory",
    "A PDSE is a library with a different internal format and a directory that grows by itself",
    "RECFM FB and LRECL 80 are the conventional choice for JCL (80-byte card images) and widely used for source",
  ],
  requires: ["l06-allocating"],
  sources: ["SRC-001", "SRC-014"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" }, removeDatasets: ["{HLQ}.TYPES.SEQ", "{HLQ}.TYPES.LIB"] },
  steps: [
    {
      id: "seq",
      instruction: "Open the Data Set Utility (3.2) and allocate {HLQ}.TYPES.SEQ with option A: Record format FB, Record length 80 and Directory blocks 0.",
      explanation:
        "Traditional z/OS data sets are made of records, not a stream of bytes: records are fixed or variable length (or undefined), and in the editor each line is a record. FB means fixed-length records grouped in blocks, commonly used for fixed-length records such as JCL. In option 3.2, when Data set name type is left blank, a directory block count of zero gives a sequential data set: records in order (organization PS). (With name type LIBRARY, real ISPF allocates a PDSE even for zero directory blocks.)",
      hint: "3.2, A, Other Data Set Name {HLQ}.TYPES.SEQ, Enter; FB, 80, directory blocks 0, Enter.",
      validator: (ctx) => eventIs("DATASET_ALLOCATED", (e, c) => e.dsn === `${c.hlq}.TYPES.SEQ`)(ctx) && typesSeqIsRight(ctx),
      highlightField: "dirblocks",
    },
    {
      id: "lib",
      instruction: "Allocate {HLQ}.TYPES.LIB the same way, but with Directory blocks 5. FB, LRECL 80.",
      explanation:
        "A partitioned data set (PDS) is a collection of sequential data sets called members, each with a name of up to eight characters. It also has a directory with one entry per member, which is what the directory blocks reserve. Its organization is PO. Creating and editing libraries like this is a primary use of ISPF.",
      hint: "3.2, A, {HLQ}.TYPES.LIB, Enter; FB, 80, directory blocks 5, Enter.",
      validator: (ctx) => eventIs("DATASET_ALLOCATED", (e, c) => e.dsn === `${c.hlq}.TYPES.LIB`)(ctx) && typesLibIsRight(ctx),
      highlightField: "dirblocks",
    },
    {
      id: "compare",
      instruction: "List {HLQ}.TYPES in the Data Set List Utility (3.4). Compare the two rows: PS for one, PO for the other.",
      explanation:
        "Real ISPF shows organization (Dsorg), record format and record length in the Attributes view of this list (reached with the LEFT and RIGHT commands); the simulator shows them in one combined view. A PDSE has a directory and members too, but a different internal format, and its Dsorg reads PO-E where a PDS reads PO. Its directory grows automatically and it reuses the space of deleted members, so it never needs compressing. (This simulator cannot create a PDSE: the Data set name type field gives an ordinary PDS for LIBRARY and for PDS.)",
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
        "Data Set Information shows organization PO for a library, with its directory blocks and member count (on managed volumes the panel also has a Data set name type field, PDS for a PDS). A real PDSE shows the name type LIBRARY and NOLIMIT for the directory blocks, because its directory has no fixed size. (For a library, S, the short form, leaves the directory blocks and member count out, so use I.)",
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
const BROKEN_JCL = ["//{HLQ}B  JOB (ACCT),'FIX ME',CLASS=A,MSGCLASS=X,", "//STEP1    EXEC PGM=IEFBR14", "//"];

/** The text now in the editor parses as JCL with no converter errors (the parser is the checker, not a text match). */
const editorJclIsClean: Validator = ({ state }) => !!state.editor && parseJcl(state.editor.lines.map((l) => l.text)).errors.length === 0;
const brokenJob = (e: { jobName: string }, ctx: LessonContext) => e.jobName === `${ctx.hlq}B`;

export const lessonB03: Lesson = {
  id: "b-03-jcl-anatomy",
  number: 32,
  module: BATCH,
  draft: true,
  title: "Reading a job: JOB, EXEC, DD and continuation",
  description: "Read a small job statement by statement, learn where the fields go, then find and fix a missing continuation.",
  objective: "Read {HLQ}.JCL(HELLO), show the column ruler, then find out why {HLQ}.JCL(BROKEN) ends with a JCL error and fix it so it runs to CC 0000.",
  teaches: [
    "A simple job is a JOB statement, EXEC steps with their DD statements, and an optional null statement (//) that ends it",
    "Columns 1-2 hold //, the name starts in column 3, fields are not coded past column 71 (column 72 is the continuation indicator)",
    "A comma ending the last operand means the next record must continue the statement (// then a blank)",
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
        "A JCL statement is made of 80-byte records, like punched-card images, with up to five fields: identifier, name, operation, parameters and comments. The JOB statement marks the start of a job. An EXEC statement names the program (or procedure) a step runs and marks the beginning of each step. A DD statement (HELLO has none; IEFBR14 needs no data) describes a data set a step uses. A null statement, just //, ends the job (it is optional: the next JOB statement or the end of the input also ends a job).",
      hint: "2, Enter, {HLQ}.JCL(HELLO), Enter.",
      validator: editorOpen("{HLQ}.JCL", "HELLO", "EDIT"),
    },
    {
      id: "cols",
      instruction: "Type COLS on the command line. The ruler shows the columns: // sits in columns 1-2.",
      explanation:
        "The identifier field is // in columns 1 and 2. A name, if there is one, starts in column 3 (1 to 8 characters, the first one a letter or national character) and is followed by a blank; then come the operation (JOB, EXEC, DD) and its parameters. Do not code fields past column 71 (only comment statements may run on); column 72 is the continuation indicator and columns 73-80 are ignored.",
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
      explanation:
        "The job is accepted, but the system will not run it. (Real TSO adds the descriptive qualifier CNTL to an unquoted data set name, so JCL(BROKEN) there would mean userid.JCL.CNTL(BROKEN); this simulator adds only your userid, so it finds {HLQ}.JCL(BROKEN).)",
      hint: "F3 to the menu, then TSO SUBMIT JCL(BROKEN), Enter.",
      validator: eventIs("JCL_ERROR_GENERATED", (e, ctx) => brokenJob(e, ctx)),
    },
    {
      id: "read",
      instruction: "Open SDSF (=S, ST), type ? next to {HLQ}B, then S next to JESYSMSG. Read the line under STMT NO. MESSAGE.",
      explanation:
        "IEFC621I EXPECTED CONTINUATION NOT RECEIVED: a comma ended the last operand on a line, but the next record was not a continuation. STMT NO. is the statement number that precedes the message; the simulator numbers statements as its JESJCL listing does (comments and continuation records are not numbered), and the layout of this log is the simulator's. The system found this error while it was converting the job, so no step ran.",
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
      instruction: "Press PF3 to save the corrected member (PF3 saves because AUTOSAVE is on, as it is by default here).",
      hint: "F3.",
      validator: (ctx) => editorClosed(ctx) && memberSatisfies("{HLQ}.JCL", "BROKEN", (records) => parseJcl(records).errors.length === 0)(ctx),
    },
  ],
};

/** A DD parameter, whether coded on its own (RECFM=FB) or inside DCB=(RECFM=FB,...). */
const ddAttr = (dd: DdStatement, key: string): string | undefined => dd.params[key]?.toUpperCase() ?? new RegExp(`${key}=([A-Z0-9]+)`).exec((dd.params.DCB ?? "").toUpperCase())?.[1];

/** The edited JCL has a DD that creates {HLQ}.BUILD.DATA as FB, LRECL 80 with a space request. */
export const buildDdIsRight = (jcl: string[], hlq: string): boolean =>
  parseJcl(jcl).steps.some((st) =>
    st.dds.some((dd) => dd.params.DSN?.toUpperCase() === `${hlq}.BUILD.DATA` && dispStatus(dd.params) === "NEW" && !!dd.params.SPACE && ddAttr(dd, "RECFM") === "FB" && ddAttr(dd, "LRECL") === "80"),
  );
const editorText = (ctx: LessonContext) => ctx.state.editor?.lines.map((l) => l.text) ?? [];
const newdsOpen = editorOpen("{HLQ}.JCL", "NEWDS", "EDIT");
const buildState: Validator = ({ state, hlq }) => {
  const ds = state.catalog.datasets[`${hlq}.BUILD.DATA`];
  return !!ds && ds.datasetType === "PS" && ds.recfm === "FB" && ds.lrecl === 80;
};
export { buildState as buildDatasetIsRight };

export const lessonB04: Lesson = {
  id: "b-04-build-a-job",
  number: 33,
  module: BATCH,
  draft: true,
  title: "Build a job from scratch",
  description: "Write a JOB, an EXEC for IEFBR14 and a DD that creates a data set, submit it, and confirm the data set exists.",
  objective: "In a new member {HLQ}.JCL(NEWDS) write a job named {HLQ}N that runs IEFBR14 and creates {HLQ}.BUILD.DATA (FB, LRECL 80), submit it, and find the data set in the data set list.",
  teaches: [
    "A job is built statement by statement: JOB, EXEC PGM=, DD",
    "DSN names the data set; DISP says its status and what happens to it afterwards",
    "SPACE and UNIT ask for room; DCB (or RECFM and LRECL) describe the records",
    "IEFBR14 does no work: the allocation does",
  ],
  requires: ["b-03-jcl-anatomy"],
  sources: ["SRC-003", "SRC-018"],
  startingState: {
    screen: { id: "PRIMARY_OPTION_MENU" },
    resetJobs: true,
    removeDatasets: ["{HLQ}.BUILD.DATA"],
    removeMembers: [{ dsn: "{HLQ}.JCL", member: "NEWDS" }],
  },
  steps: [
    {
      id: "open",
      instruction: "Open the new member {HLQ}.JCL(NEWDS) in Edit (option 2). It does not exist yet, so the editor offers a few empty input lines, marked ''''''. Type on the first one and press Enter: in this simulator the unused input lines disappear once you have typed data. To add more lines later, type I over a line number and press Enter, then type on the new line.",
      hint: "2, Enter, {HLQ}.JCL(NEWDS), Enter.",
      validator: newdsOpen,
    },
    {
      id: "job",
      instruction: "Type the JOB statement on the first input line and press Enter: //{HLQ}N JOB (ACCT),'NEW DATA SET',CLASS=A,MSGCLASS=X  (the name starts in column 3).",
      explanation: "The JOB statement marks the start of a job and tells the system how to process it. The job name starts in column 3 and is 1 to 8 characters; using your userid plus one letter lets TSO STATUS and SDSF filters on your userid find your jobs. MSGCLASS=X keeps the job's messages on the spool so you can read them in SDSF (the default message class is set by the installation).",
      hint: "Type //{HLQ}N JOB (ACCT),'NEW DATA SET',CLASS=A,MSGCLASS=X on the first input line, Enter.",
      validator: (ctx) => newdsOpen(ctx) && parseJcl(editorText(ctx)).jobName === `${ctx.hlq}N`,
    },
    {
      id: "exec",
      instruction: "Add //STEP1 EXEC PGM=IEFBR14 on the next line.",
      explanation: "An EXEC statement names the program (or procedure) the step runs and marks the beginning of the step. IEFBR14 does not process any data: the job exists for the allocation work the system does around the step.",
      hint: "I after the JOB line, Enter, then //STEP1    EXEC PGM=IEFBR14",
      validator: (ctx) => newdsOpen(ctx) && parseJcl(editorText(ctx)).steps.some((st) => st.program === "IEFBR14"),
    },
    {
      id: "dd",
      instruction:
        "Add a DD that creates {HLQ}.BUILD.DATA: DSN={HLQ}.BUILD.DATA, DISP=(NEW,CATLG,DELETE), SPACE=(TRK,(1,1)), UNIT=SYSDA and DCB=(RECFM=FB,LRECL=80). Continue across records: end a record with a comma and start the next one with // and a blank.",
      explanation:
        "DSN names the data set. DISP=(NEW,CATLG,DELETE): the data set is new, kept and cataloged if the step ends normally, and deleted if it ends abnormally. SPACE requests room on a direct access volume (one track, and one more each time it needs more). UNIT asks for a device or a group of devices; names such as SYSDA are set by the installation and are ignored for SMS-managed disk, which is what the simulator shows. DCB completes the record description: fixed blocked records of 80 bytes.",
      hint: "//NEWDD    DD  DSN={HLQ}.BUILD.DATA,DISP=(NEW,CATLG,DELETE),  then //             SPACE=(TRK,(1,1)),UNIT=SYSDA,  then //             DCB=(RECFM=FB,LRECL=80)",
      validator: (ctx) => newdsOpen(ctx) && buildDdIsRight(editorText(ctx), ctx.hlq),
    },
    {
      id: "null",
      instruction: "End the job with the null statement: a line containing only //.",
      explanation: "The null statement marks the end of the job. Columns 3 to 72 must be blank.",
      hint: "I after the last line, Enter, then //",
      validator: (ctx) => {
        const lines = editorText(ctx).map((l) => l.trimEnd()).filter((l) => l !== "");
        return newdsOpen(ctx) && lines[lines.length - 1] === "//" && parseJcl(lines).errors.length === 0;
      },
    },
    {
      id: "submit",
      instruction: "Type SUBMIT. The job runs and ends CC 0000.",
      explanation: "Submitting a job whose DD is NEW a second time fails on an SMS-managed volume: the data set already exists, and the system reports a duplicate name.",
      hint: "SUBMIT, Enter.",
      validator: eventIs("JOB_COMPLETED", (e, ctx) => e.jobName === `${ctx.hlq}N` && e.status === "OUTPUT" && e.maxRc === 0),
    },
    {
      id: "verify",
      instruction: "Press PF3 to save and leave (PF3 saves because AUTOSAVE is on), then list {HLQ}.BUILD in the Data Set List Utility (=3.4). The new data set is there: PS, FB, 80.",
      explanation: "Real ISPF shows Dsorg, Recfm and Lrecl in the Attributes view of the list (LEFT and RIGHT switch views); the simulator shows them in one view.",
      hint: "F3, =3.4, Enter, {HLQ}.BUILD, Enter.",
      validator: eventIs("DATASET_SEARCHED", (e, ctx) => e.results > 0 && `${ctx.hlq}.BUILD.DATA`.startsWith(e.level.toUpperCase().replace(/[.*%]+$/, ""))),
    },
  ],
};

const outJob = (letter: string, title: string, sysut1: string, disp: string) => [
  `//{HLQ}${letter}  JOB (ACCT),'${title}',CLASS=A,MSGCLASS=X`,
  "//STEP1    EXEC PGM=IEBGENER",
  "//SYSPRINT DD  SYSOUT=*",
  "//SYSIN    DD  DUMMY",
  "//SYSUT1   DD  *",
  sysut1,
  "/*",
  `//SYSUT2   DD  DSN={HLQ}.DISP.OUT,DISP=${disp},`,
  "//             SPACE=(TRK,(1,1)),DCB=(RECFM=FB,LRECL=80)",
  "//",
];
const DISPNEW_JCL = outJob("D", "DISP NEW", "FIRST RECORD", "(NEW,CATLG)");
const DISPMOD_JCL = outJob("M", "DISP MOD", "SECOND RECORD", "MOD");
const DISPDEL_JCL = ["//{HLQ}X  JOB (ACCT),'DISP DELETE',CLASS=A,MSGCLASS=X", "//STEP1    EXEC PGM=IEFBR14", "//OUT      DD  DSN={HLQ}.DISP.OUT,DISP=(OLD,DELETE)", "//"];
/** No DISP at all: the DD is NEW and the normal disposition defaults to DELETE for a new data set. */
const KEEPIT_JCL = ["//{HLQ}K  JOB (ACCT),'KEEP IT',CLASS=A,MSGCLASS=X", "//STEP1    EXEC PGM=IEFBR14", "//OUT      DD  DSN={HLQ}.DISP.KEEP,", "//             SPACE=(TRK,(1,1)),UNIT=SYSDA,", "//             DCB=(RECFM=FB,LRECL=80)", "//"];

/** DISP=(status,normal,abnormal) of a DD as written, upper-cased; missing parts are "". */
const dispParts = (params: Record<string, string>): string[] => {
  const d = (params.DISP ?? "").toUpperCase();
  const inner = d.startsWith("(") ? d.slice(1, -1) : d;
  const [status = "", normal = "", abnormal = ""] = inner.split(",").map((p) => p.trim());
  return [status, normal, abnormal];
};
/** The editor text has a DD for {HLQ}.DISP.KEEP that creates it (NEW) and keeps it (CATLG or KEEP) when the step ends normally. */
const keepDdKeeps = (jcl: string[], hlq: string): boolean =>
  parseJcl(jcl).steps.some((st) =>
    st.dds.some((dd) => {
      const [status, normal] = dispParts(dd.params);
      return dd.params.DSN?.toUpperCase() === `${hlq}.DISP.KEEP` && status === "NEW" && (normal === "CATLG" || normal === "KEEP");
    }),
  );
export const dispKeepExists: Validator = ({ state, hlq }) => !!state.catalog.datasets[`${hlq}.DISP.KEEP`];
const jobOk = (letter: string) => eventIs("JOB_COMPLETED", (e, ctx: LessonContext) => e.jobName === `${ctx.hlq}${letter}` && e.status === "OUTPUT" && e.maxRc === 0);
const dispOut = (ctx: LessonContext) => ctx.state.catalog.datasets[`${ctx.hlq}.DISP.OUT`];

export const lessonB05: Lesson = {
  id: "b-05-disp",
  number: 34,
  module: BATCH,
  draft: true,
  title: "Disposition: what happens to a data set after the step",
  description: "Run four small jobs, watch the data set they create, extend and delete, and fix a job that throws its own output away.",
  objective: "Run DISPNEW, DISPMOD and DISPDEL and say what each did to {HLQ}.DISP.OUT, then fix {HLQ}.JCL(KEEPIT) so {HLQ}.DISP.KEEP survives the job.",
  teaches: [
    "DISP=(status,normal,abnormal): what the data set is and what happens to it afterwards",
    "No DISP means NEW, and a new data set defaults to DELETE at the end of the step",
    "MOD adds records to the end of an existing sequential data set; if the system cannot find the data set it assumes it is being created",
    "IEF285I says what was done with each data set: CATALOGED, KEPT, DELETED and others",
  ],
  requires: ["b-04-build-a-job"],
  sources: ["SRC-003", "SRC-019", "SRC-018", "SRC-001"],
  startingState: {
    screen: { id: "PRIMARY_OPTION_MENU" },
    resetJobs: true,
    removeDatasets: ["{HLQ}.DISP.OUT", "{HLQ}.DISP.KEEP"],
    createMembers: [
      { dsn: "{HLQ}.JCL", member: "DISPNEW", records: DISPNEW_JCL },
      { dsn: "{HLQ}.JCL", member: "DISPMOD", records: DISPMOD_JCL },
      { dsn: "{HLQ}.JCL", member: "DISPDEL", records: DISPDEL_JCL },
      { dsn: "{HLQ}.JCL", member: "KEEPIT", records: KEEPIT_JCL },
    ],
  },
  steps: [
    {
      id: "new",
      instruction: "Submit DISPNEW: TSO SUBMIT JCL(DISPNEW) on the Option line. It copies one record into {HLQ}.DISP.OUT with DISP=(NEW,CATLG).",
      explanation: "DISP describes the status of a data set (here NEW: this job creates it) and what happens to it afterwards. CATLG puts an entry for it in the catalog and keeps it.",
      hint: "TSO SUBMIT JCL(DISPNEW), Enter.",
      validator: (ctx) => jobOk("D")(ctx) && dispOut(ctx)?.records?.length === 1,
    },
    {
      id: "read",
      instruction: "Open SDSF (=S, ST), put ? next to {HLQ}D and S next to JESYSMSG. Find the IEF285I line for {HLQ}.DISP.OUT: CATALOGED.",
      explanation: "IEF285I reports the disposition of each data set after the step. Common words include CATALOGED, KEPT and DELETED. (KEPT means this request took no action; a data set removed by the TSO DELETE command can also show KEPT.)",
      hint: "=S, ST, ? on {HLQ}D, S on JESYSMSG.",
      validator: eventIs("JOB_OUTPUT_OPENED", (e) => e.ddname === "JESYSMSG"),
    },
    {
      id: "mod",
      instruction: "Press PF3 back to the menu and submit DISPMOD. Its SYSUT2 is DISP=MOD on the data set that now exists.",
      explanation: "MOD adds records to the end of an existing sequential data set. (If the system finds no volume information for the data set, in the catalog or passed from an earlier step, it assumes the data set is being created in this step.)",
      hint: "F3 until the menu, then TSO SUBMIT JCL(DISPMOD).",
      validator: (ctx) => jobOk("M")(ctx) && dispOut(ctx)?.records?.length === 2,
    },
    {
      id: "browse",
      instruction: "List {HLQ}.DISP in the Data Set List Utility (=3.4) and type B next to {HLQ}.DISP.OUT: two records, FIRST then SECOND.",
      hint: "=3.4, {HLQ}.DISP, Enter, B on {HLQ}.DISP.OUT.",
      validator: eventIs("MEMBER_OPENED", (e, ctx) => e.dsn === `${ctx.hlq}.DISP.OUT`),
    },
    {
      id: "del",
      instruction: "Press PF3 until the menu and submit DISPDEL. Its DD says DISP=(OLD,DELETE).",
      explanation: "DELETE removes the data set and its catalog entry when the step ends normally (here the system found the data set through the catalog; an existing data set whose retention period has not passed is kept). The job ends CC 0000 and the data set is gone.",
      hint: "F3 until the menu, TSO SUBMIT JCL(DISPDEL).",
      validator: (ctx) => jobOk("X")(ctx) && !dispOut(ctx),
    },
    {
      id: "gone",
      instruction: "Now submit KEEPIT. It ends CC 0000. Then check with =3.4 and level {HLQ}.DISP: {HLQ}.DISP.KEEP is not there, so the list finds nothing (that message is expected and not counted against you).",
      explanation: "KEEPIT's DD has no DISP at all. The status defaults to NEW, and for a new data set the normal disposition defaults to DELETE. A CC 0000 job can still have thrown its output away.",
      hint: "TSO SUBMIT JCL(KEEPIT), then =3.4 with level {HLQ}.DISP.",
      validator: (ctx) => eventIs("DATASET_SEARCHED", (e, c) => e.level.toUpperCase().startsWith(`${c.hlq}.DISP`) && e.results === 0)(ctx) && !ctx.state.catalog.datasets[`${ctx.hlq}.DISP.KEEP`] && !dispOut(ctx),
      expectsError: true,
    },
    {
      id: "fix",
      instruction: "Edit {HLQ}.JCL(KEEPIT). On the OUT DD statement add DISP=(NEW,CATLG), after DSN={HLQ}.DISP.KEEP and before the continuation.",
      explanation: "Add the disposition you want: NEW, because the job creates the data set, and CATLG, so it is kept and cataloged. The comma after DISP=(NEW,CATLG) continues the statement onto the SPACE record. (NEW,KEEP also works here: on SMS-managed disk KEEP implies CATLG.)",
      hint: "2, {HLQ}.JCL(KEEPIT); overtype the //OUT line: //OUT      DD  DSN={HLQ}.DISP.KEEP,DISP=(NEW,CATLG),",
      validator: (ctx) => editorOpen("{HLQ}.JCL", "KEEPIT", "EDIT")(ctx) && keepDdKeeps(editorText(ctx), ctx.hlq),
    },
    {
      id: "rerun",
      instruction: "Type SUBMIT. This time the data set survives.",
      hint: "SUBMIT, Enter.",
      validator: (ctx) => jobOk("K")(ctx) && dispKeepExists(ctx),
    },
    {
      id: "save",
      instruction: "Press PF3 to save the corrected member.",
      hint: "F3.",
      validator: (ctx) => editorClosed(ctx) && memberSatisfies("{HLQ}.JCL", "KEEPIT", (records) => keepDdKeeps(records, ctx.hlq))(ctx),
    },
  ],
};

const rcJob = (letter: string, title: string) => [
  `//{HLQ}${letter}  JOB (ACCT),'${title}',CLASS=A,MSGCLASS=X`,
  "//STEP1    EXEC PGM=IEFBR14",
  "//STEP2    EXEC PGM=SORT",
  "//SYSOUT   DD  SYSOUT=*",
  "//SORTIN   DD  DUMMY",
  "//SORTOUT  DD  SYSOUT=*",
  "//SYSIN    DD  *",
  "  SORT FIELDS=(1,3,CH A)",
  "/*",
  "//STEP3    EXEC PGM=IEFBR14",
  "//",
];
const RCJOB_JCL = rcJob("R", "RETURN CODES");
const ABENDJOB_JCL = ["//{HLQ}A  JOB (ACCT),'ABEND',CLASS=A,MSGCLASS=X", "//STEP1    EXEC PGM=IEFBR14", "//STEP2    EXEC PGM=NOPROG", "//STEP3    EXEC PGM=IEFBR14", "//"];

/** The in-stream SYSIN of some step holds a well-formed SORT control statement. */
const sortControlIsValid = (jcl: string[]): boolean =>
  parseJcl(jcl).steps.some((st) => st.dds.some((dd) => dd.ddname === "SYSIN" && (dd.instream ?? []).some((l) => /^\s*SORT\s+FIELDS=\(\d+,\d+,CH,[AD]\)\s*$/i.test(l))));
export { sortControlIsValid };
/** The job whose output was opened belongs to {HLQ}<letter>. */
const outputOfJob = (letter: string) => (e: { jobId: string }, ctx: LessonContext) => ctx.state.jes.jobs.find((j) => j.id === e.jobId)?.jobName === `${ctx.hlq}${letter}`;
export { outputOfJob };

export const lessonB06: Lesson = {
  id: "b-06-multistep-rc",
  number: 35,
  module: BATCH,
  draft: true,
  title: "Multi-step jobs: return codes and abends",
  description: "Read the condition code of every step, see that a nonzero return code does not stop a job, and compare it with an abend.",
  objective: "Run RCJOB and read why it ends with a high return code although all three steps ran, fix it to end CC 0000, then run ABENDJOB and see how an abend differs.",
  teaches: [
    "IEF142I gives the condition code of each step that completes normally; by default the job's highest code is its Max-RC",
    "A nonzero return code does not stop later steps unless COND or IF says so",
    "An abend ends the step abnormally; later steps are normally not executed (IEF272I)",
    "S806 reason 04 means the system could not find the program named on EXEC",
  ],
  requires: ["b-05-disp"],
  sources: ["SRC-019", "SRC-003", "SRC-020", "SRC-027", "SRC-028", "SRC-001", "SRC-021", "SRC-022", "SRC-023"],
  startingState: {
    screen: { id: "PRIMARY_OPTION_MENU" },
    resetJobs: true,
    createMembers: [
      { dsn: "{HLQ}.JCL", member: "RCJOB", records: RCJOB_JCL },
      { dsn: "{HLQ}.JCL", member: "ABENDJOB", records: ABENDJOB_JCL },
    ],
  },
  steps: [
    {
      id: "run",
      instruction: "Submit RCJOB: TSO SUBMIT JCL(RCJOB). It has three steps: IEFBR14, SORT, IEFBR14.",
      explanation: "A job can have several steps; each EXEC starts one. Each step ends with a return code, which the program leaves in register 15. By default the job as a whole is described by its highest code.",
      hint: "TSO SUBMIT JCL(RCJOB), Enter.",
      validator: eventIs("JOB_COMPLETED", (e, ctx) => e.jobName === `${ctx.hlq}R` && e.status === "OUTPUT" && e.maxRc === 16),
    },
    {
      id: "read",
      instruction: "Open SDSF (=S, ST): {HLQ}R shows CC 0016. Put ? next to it and S next to JESYSMSG. Count the IEF142I lines and read the code on each.",
      explanation:
        "IEF142I is issued when a step completes processing normally; it gives the step's condition code. You should see 0000, 0016, 0000: STEP3 ran even though STEP2 ended 0016. A nonzero code is information for the next step or for you; without COND or IF, the system does not stop. (The SORT messages are in the SYSOUT data set of the job.)",
      hint: "=S, ST, ? on {HLQ}R, S on JESYSMSG.",
      validator: eventIs("JOB_OUTPUT_OPENED", (e, ctx) => e.ddname === "JESYSMSG" && outputOfJob("R")(e, ctx)),
    },
    {
      id: "fix",
      instruction: "Press PF3 to the menu and edit {HLQ}.JCL(RCJOB). The in-stream control statement SORT FIELDS=(1,3,CH A) is missing a comma; make it SORT FIELDS=(1,3,CH,A).",
      explanation:
        "DFSORT prints ICE007A SYNTAX ERROR for a control statement with an error in syntax; a missing comma is one of its documented causes. That is a critical error: the sort ends unsuccessfully and DFSORT terminates with return code 16 (an installation option can make it abend instead). The job still ran every step.",
      hint: "F3 to the menu, =2, {HLQ}.JCL(RCJOB); put a comma between CH and A, Enter.",
      validator: (ctx) => editorOpen("{HLQ}.JCL", "RCJOB", "EDIT")(ctx) && sortControlIsValid(editorText(ctx)),
    },
    {
      id: "rerun",
      instruction: "Type SUBMIT. Every step ends 0000.",
      explanation: "In this simulator the sort of an empty input (SORTIN DUMMY) ends 0000. A real DFSORT run may need record attributes for a DUMMY input and may end with a different code, so treat the 0000 as the simulator's result.",
      hint: "SUBMIT, Enter.",
      validator: eventIs("JOB_COMPLETED", (e, ctx) => e.jobName === `${ctx.hlq}R` && e.status === "OUTPUT" && e.maxRc === 0),
    },
    {
      id: "save",
      instruction: "Press PF3 to save the corrected member.",
      hint: "F3.",
      validator: (ctx) => editorClosed(ctx) && memberSatisfies("{HLQ}.JCL", "RCJOB", sortControlIsValid)(ctx),
    },
    {
      id: "abend",
      instruction: "Press PF3 to the menu and submit ABENDJOB. Its second step names a program that does not exist.",
      explanation: "An abend is an abnormal end of a step, not a return code the program chose. Here the system cannot find the program named on EXEC: abend S806 reason 04 (module not found), with CSV003I REQUESTED MODULE ... NOT FOUND.",
      hint: "F3 until the menu, TSO SUBMIT JCL(ABENDJOB).",
      validator: eventIs("JOB_COMPLETED", (e, ctx) => e.jobName === `${ctx.hlq}A` && e.abend === "S806"),
    },
    {
      id: "compare",
      instruction: "In SDSF open JESYSMSG of {HLQ}A. Find the abend for STEP2 and what happened to STEP3.",
      explanation:
        "After an abend, a later step that does not specify EVEN or ONLY is normally not executed: IEF272I STEP WAS NOT EXECUTED (unless an IF/THEN test of the abend or recovery says otherwise). That is the difference from a return code. (The simulator's abend message layout differs from IBM's IEF450I template and omits IEF472I, and real systems may show these messages in the job log rather than JESYSMSG; it models only S806.)",
      hint: "=S, ST, ? on {HLQ}A, S on JESYSMSG.",
      validator: eventIs("JOB_OUTPUT_OPENED", (e, ctx) => e.ddname === "JESYSMSG" && outputOfJob("A")(e, ctx)),
    },
  ],
};

const FIXJCL_JCL = ["//{HLQ}J  JOB (ACCT),'FIX ME 1',CLASS=A,MSGCLASS=X", "//STEP1    EXEC PGM=IEFBR14", "//OUT      DD  DSN={HLQ}.TRB.DATA,DIPS=(NEW,CATLG),", "//             SPACE=(TRK,(1,1)),DCB=(RECFM=FB,LRECL=80)", "//"];
const FIXDSN_JCL = ["//{HLQ}Q  JOB (ACCT),'FIX ME 2',CLASS=A,MSGCLASS=X", "//STEP1    EXEC PGM=IEFBR14", "//OUT      DD  DSN={HLQ}.NOTES.TXTT,DISP=SHR", "//"];
const FIXPGM_JCL = ["//{HLQ}Z  JOB (ACCT),'FIX ME 3',CLASS=A,MSGCLASS=X", "//STEP1    EXEC PGM=IEFBR41", "//STEP2    EXEC PGM=IEFBR14", "//"];

const trbRead = (letter: string) => eventIs("JOB_OUTPUT_OPENED", (e, ctx: LessonContext) => e.ddname === "JESYSMSG" && outputOfJob(letter)(e, ctx));
const trbFixed = (letter: string) => eventIs("JOB_COMPLETED", (e, ctx: LessonContext) => e.jobName === `${ctx.hlq}${letter}` && e.status === "OUTPUT" && e.maxRc === 0 && !e.abend);
/** A run of {HLQ}<letter> that did not end CC 0000 (JCL error, abend or a nonzero code). */
export const trbFailed = (e: { jobName: string; status: string; maxRc?: number; abend?: string }, hlq: string, letter: string) =>
  e.jobName === `${hlq}${letter}` && (e.status !== "OUTPUT" || e.maxRc !== 0 || !!e.abend);

export const lessonB10: Lesson = {
  id: "b-10-job-troubleshooting",
  number: 36,
  module: BATCH,
  draft: true,
  title: "Batch troubleshooting: classify the failure, then fix it",
  description: "Four jobs, four different faults: a converter (syntax) error, an allocation error, an abend and a bad return code. Read the messages, say which it is, fix it.",
  objective: "For FIXJCL, FIXDSN, FIXPGM and FIXRC: let the job fail, read its JESYSMSG to classify the failure by its message, fix the one fault and run it to CC 0000.",
  teaches: [
    "A suggested order: the SDSF Max-RC (CC, ABEND or JCL ERROR), then JESYSMSG, then the step's own output",
    "A converter (syntax) error is found before any step runs; IEFC630I says a keyword is not valid",
    "IEF212I names the DD that could not be allocated, not the data set; it and a converter error both show JCL ERROR, so classify by the message id",
    "S806 reason 04 is a module not found (here the program on EXEC); a nonzero return code is not a failure of the job by itself",
  ],
  requires: ["b-06-multistep-rc"],
  sources: ["SRC-019", "SRC-020", "SRC-018", "SRC-027", "SRC-028", "SRC-003", "SRC-021", "SRC-023", "SRC-024"],
  startingState: {
    screen: { id: "PRIMARY_OPTION_MENU" },
    resetJobs: true,
    removeDatasets: ["{HLQ}.TRB.DATA"],
    createMembers: [
      { dsn: "{HLQ}.JCL", member: "FIXJCL", records: FIXJCL_JCL },
      { dsn: "{HLQ}.JCL", member: "FIXDSN", records: FIXDSN_JCL },
      { dsn: "{HLQ}.JCL", member: "FIXPGM", records: FIXPGM_JCL },
      { dsn: "{HLQ}.JCL", member: "FIXRC", records: rcJob("W", "FIX ME 4") },
    ],
  },
  steps: [
    {
      id: "jcl-read",
      instruction: "Submit FIXJCL (TSO SUBMIT JCL(FIXJCL)), open SDSF (=S, ST), look at the status, then open JESYSMSG of {HLQ}J. What kind of failure is it?",
      explanation:
        "The status says JCL ERROR and no step ran: the system found the problem while converting the job. IEFC630I UNIDENTIFIED KEYWORD says a keyword is not valid on that statement; the statement number points at the DD. (The layout of this log is the simulator's; the real message adds where in the statement it found the problem.) A misspelt keyword is a classic.",
      hint: "TSO SUBMIT JCL(FIXJCL); =S, ST, ? on {HLQ}J, S on JESYSMSG.",
      validator: trbRead("J"),
    },
    {
      id: "jcl-fix",
      instruction: "Edit FIXJCL, correct the keyword, and SUBMIT until the job ends CC 0000. PF3 to save.",
      hint: "DIPS should be DISP. F3 to the menu, =2, {HLQ}.JCL(FIXJCL), overtype, SUBMIT.",
      validator: trbFixed("J"),
    },
    {
      id: "dsn-read",
      instruction: "Now FIXDSN: submit it, check the status in SDSF, and open JESYSMSG of {HLQ}Q.",
      explanation:
        "This also shows JCL ERROR in SDSF, but the messages tell the two apart: the converter had no complaint (no IEFC message), and IEF212I from allocation says a DD could not be allocated: DATA SET NOT FOUND. It names the job, the step and the DD, not the data set. Read the DD statement to see the name. IBM files both under JCL ERROR, so the message id is what classifies the failure.",
      hint: "TSO SUBMIT JCL(FIXDSN); =S, ST, ? on {HLQ}Q, S on JESYSMSG.",
      validator: trbRead("Q"),
    },
    {
      id: "dsn-fix",
      instruction: "Fix the data set name on the OUT DD (look for the stray character) and run FIXDSN to CC 0000.",
      hint: "{HLQ}.NOTES.TXTT should be {HLQ}.NOTES.TXT.",
      validator: trbFixed("Q"),
    },
    {
      id: "pgm-read",
      instruction: "Next FIXPGM: submit it, look at the SDSF status, and read JESYSMSG of {HLQ}Z.",
      explanation:
        "The status shows an ABEND, not a code. The first step abended with S806 reason 04: the system could not find the program named on EXEC (CSV003I REQUESTED MODULE ... NOT FOUND). The second step was normally not executed (IEF272I). That is the difference from a return code. (The abend message layout is the simulator's; see lesson 35.)",
      hint: "TSO SUBMIT JCL(FIXPGM); =S, ST, ? on {HLQ}Z, S on JESYSMSG.",
      validator: trbRead("Z"),
    },
    {
      id: "pgm-fix",
      instruction: "Correct the program name on STEP1 and run FIXPGM to CC 0000.",
      hint: "IEFBR41 should be IEFBR14.",
      validator: trbFixed("Z"),
    },
    {
      id: "rc-read",
      instruction: "Last, FIXRC: submit it, look at the status, and read JESYSMSG of {HLQ}W.",
      explanation:
        "All three steps ran and IEF142I gives each normally completed step's code; the highest, 0016, is the job's CC. The cause is in the SORT step's own output (ICE007A SYNTAX ERROR), not in JESYSMSG. A nonzero code is not a failure of the job by itself; here it points at a real problem.",
      hint: "TSO SUBMIT JCL(FIXRC); =S, ST, ? on {HLQ}W, S on JESYSMSG.",
      validator: trbRead("W"),
    },
    {
      id: "rc-fix",
      instruction: "Find the SYSOUT of the SORT step (use ? and open SYSOUT), see ICE007A, correct the control statement in FIXRC and run it to CC 0000.",
      hint: "SORT FIELDS=(1,3,CH A) is missing the comma between CH and A.",
      validator: trbFixed("W"),
    },
  ],
};
