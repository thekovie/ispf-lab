/**
 * Module 11 - Foundations (M3). Lesson specs: docs/curriculum/lessons/<id>.md. Review status of every lesson here: draft
 * (author-checked against the sources named in the spec; independent source, fidelity and expert review pending).
 */
import { editorClosed, editorOpen, eventIs, onScreen } from "../validators";
import type { Lesson, Validator } from "../types";

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
