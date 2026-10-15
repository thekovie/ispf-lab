/**
 * Challenge outcome checks (ADR 0016, D3).
 *
 * Each check is written from the lesson's *objective*, not from its Learn steps. It looks at the events since the
 * Challenge started (`ctx.history`) and, where the objective is about a result, at the catalog. It accepts every
 * legitimate route to the outcome (menu path, `3.4` or `=3.4`; Edit from an entry panel or a member list; ...) and
 * it must reject the cheap shortcuts recorded by the Phase 0 and M0 probes (tests/tutorial/challenge.test.ts).
 *
 * Lessons that are not listed here keep their own `challenge` (L14, L28) or fall back to their last step guarded
 * by the completion guard (L1, L4, L8, L11, L12, L26, L27). Pure TypeScript: events and state only.
 */
import type { SimEvent } from "@/engine/types";
import type { Validator } from "./types";
import { allOf, anyOf, is, noEditSession, memberSatisfies, onScreen, sawAll, sawAllThen, sawInOrder, sawTimes } from "./validators";
import { typesLibIsRight, typesSeqIsRight } from "./lessons/module11";

export interface Challenge {
  task: string;
  validator: Validator;
}

const cmd = (re: RegExp) => is("COMMAND_ENTERED", (e) => re.test(e.command.trim()));

/** A member (or any member when omitted) of {HLQ}.<tail> was opened in one of the modes. */
const opened = (tail: string, member: string | undefined, modes: string[]) =>
  is("MEMBER_OPENED", (e, ctx) => e.dsn === `${ctx.hlq}.${tail}` && (!member || e.member === member) && modes.includes(e.mode));

/** The Data Set List Utility was opened by at least two different routes: menu (3 then 4), typed 3.4, or jump. */
const dslistByTwoRoutes: Validator = ({ history = [] }) => {
  const routes = new Set<string>();
  history.forEach((e, i) => {
    if (e.type !== "SCREEN_OPENED" || e.screen !== "DSLIST_SEARCH") return;
    let jump = false;
    let from: string | undefined;
    for (let j = i - 1; j >= 0 && history[j].type !== "COMMAND_ENTERED"; j--) {
      const p = history[j];
      if (p.type === "JUMP_EXECUTED") jump = true;
      if (p.type === "OPTION_SELECTED" && from === undefined) from = p.from;
    }
    routes.add(jump ? "jump" : from === "UTILITY_SELECTION" ? "menu" : "typed");
  });
  return routes.size >= 2;
};

/** A command that was brought back with RETRIEVE was later entered again. */
const retrievedCommandRerun: Validator = ({ history = [] }) =>
  history.some(
    (e, i) =>
      e.type === "COMMAND_RETRIEVED" &&
      history.slice(i + 1).some((n) => n.type === "COMMAND_ENTERED" && n.command.trim().toUpperCase() === e.command.trim().toUpperCase()),
  );

type Submitted = Extract<SimEvent, { type: "JOB_SUBMITTED" }>;

/** `<userid>H` was submitted, the job finished with CC 0000, and its output was browsed after ST was opened. */
const helloJobBrowsed: Validator = ({ history = [], hlq }) => {
  const at = history.findIndex((e) => e.type === "JOB_SUBMITTED" && e.jobName === `${hlq}H`);
  if (at < 0) return false;
  const jobId = (history[at] as Submitted).jobId;
  const after = history.slice(at);
  return (
    after.some((e) => e.type === "JOB_COMPLETED" && e.jobId === jobId && e.status === "OUTPUT" && e.maxRc === 0) &&
    after.some((e) => e.type === "JOB_STATUS_OPENED") &&
    after.some((e) => e.type === "JOB_OUTPUT_OPENED" && e.jobId === jobId)
  );
};

/** A TSO command, then HELLO submitted from ISPF (editor or member list), then that same job's output opened in SDSF. */
const traceHelloJob: Validator = ({ history = [], hlq }) => {
  const tso = history.findIndex((e) => e.type === "TSO_COMMAND_ENTERED");
  if (tso < 0) return false;
  const at = history.findIndex((e, i) => i > tso && e.type === "JOB_SUBMITTED" && e.jobName === `${hlq}H` && e.from !== "TSO_COMMAND");
  if (at < 0) return false;
  const jobId = (history[at] as Submitted).jobId;
  return history.slice(at).some((e) => e.type === "JOB_OUTPUT_OPENED" && e.jobId === jobId);
};

/** Information was shown for this data set: Data Set Information (any form when `anyForm`, else the full panel) or LISTDS. */
const shown = (tail: "SEQ" | "LIB", anyForm: boolean) =>
  anyOf(
    sawAll(is("DATASET_INFO_VIEWED", (e, ctx) => e.dsn === `${ctx.hlq}.TYPES.${tail}` && (anyForm || !e.short))),
    sawAll(is("TSO_COMMAND_ENTERED", (e, ctx) => /^(TSO\s+)?LISTDS\b/i.test(e.command.trim()) && e.command.toUpperCase().includes(`${ctx.hlq}.TYPES.${tail}`))),
  );

export const CHALLENGES: Record<string, Challenge> = {
  "b-03-jcl-anatomy": {
    task: "Make {HLQ}.JCL(BROKEN) run to CC 0000. It has to fail with a JCL error first, then a later run of the same job has to end CC 0000.",
    validator: allOf(
      sawInOrder(
        is("JCL_ERROR_GENERATED", (e, ctx) => e.jobName === `${ctx.hlq}B`),
        is("JOB_COMPLETED", (e, ctx) => e.jobName === `${ctx.hlq}B` && e.status === "OUTPUT" && e.maxRc === 0),
      ),
      noEditSession,
    ),
  },
  "b-02-dataset-types": {
    task: "Create {HLQ}.TYPES.SEQ as a sequential data set and {HLQ}.TYPES.LIB as a library with directory blocks, both FB and LRECL 80, then show the information for each (option I in the data set list, or LISTDS).",
    validator: allOf(typesSeqIsRight, typesLibIsRight, shown("SEQ", true), shown("LIB", false)),
  },
  "b-01-zos-big-picture": {
    task: "Run any TSO command at the ISPF Command Shell, submit {HLQ}.JCL(HELLO) from ISPF, and open that job's output in SDSF.",
    validator: traceHelloJob,
  },
  "a-01-panel-fields-scroll": {
    task: "Open {HLQ}.DATA(SCROLL) in Edit. Set the Scroll field to HALF and scroll down with it, then jump to the last page with a one-time MAX, leaving the field at HALF.",
    validator: allOf(
      sawInOrder(opened("DATA", "SCROLL", ["EDIT"]), is("EDITOR_SCROLLED", (e) => e.amount === "HALF"), is("EDITOR_SCROLLED", (e) => e.amount === "MAX")),
      ({ state }) => state.editor?.scrollAmount.toUpperCase() === "HALF",
    ),
  },
  "l02-navigating": {
    task: "Open the Data Set List Utility (3.4) by two different routes, then return to the Primary Option Menu.",
    validator: allOf(dslistByTwoRoutes, onScreen("PRIMARY_OPTION_MENU")),
  },
  "l03-settings-tso": {
    task: "Change a setting in option 0, then list your catalog entries with LISTCAT LEVEL({HLQ}).",
    validator: sawAll(
      is("SETTING_CHANGED"),
      is("TSO_COMMAND_ENTERED", (e, ctx) => /^LISTCAT\b/i.test(e.command.trim()) && e.command.toUpperCase().includes(ctx.hlq)),
    ),
  },
  "l05-data-sets-and-members": {
    task: "View the data set information for {HLQ}.JCL and display its member list.",
    validator: sawAll(
      is("DATASET_INFO_VIEWED", (e, ctx) => e.dsn === `${ctx.hlq}.JCL`),
      is("SCREEN_OPENED", (e, ctx) => e.frame.id === "MEMBER_LIST" && e.frame.dsn === `${ctx.hlq}.JCL`),
    ),
  },
  "l06-allocating": {
    task: "Create {HLQ}.TEST.JCL as a PDS (FB, LRECL 80, 10 directory blocks) and find it in the data set list.",
    validator: allOf(
      sawAll(
        is("DATASET_ALLOCATED", (e, ctx) => e.dsn === `${ctx.hlq}.TEST.JCL`),
        is("DATASET_SEARCHED", (e, ctx) => e.results > 0 && `${ctx.hlq}.TEST.JCL`.startsWith(e.level.toUpperCase().replace(/\*+$/, ""))),
      ),
      ({ state, hlq }) => {
        const ds = state.catalog.datasets[`${hlq}.TEST.JCL`];
        return !!ds && ds.datasetType === "PDS" && ds.recfm === "FB" && ds.lrecl === 80 && ds.dirBlocks >= 10;
      },
    ),
  },
  "l07-browse-vs-edit": {
    task: "Browse {HLQ}.JCL(HELLO), then open the same member in Edit.",
    validator: sawInOrder(opened("JCL", "HELLO", ["BROWSE"]), opened("JCL", "HELLO", ["EDIT"])),
  },
  "l09-line-commands": {
    task: "In {HLQ}.JCL(HELLO) insert a comment record, delete a record, repeat a record, and save the member.",
    validator: allOf(
      sawAllThen([is("EDITOR_LINE_INSERTED"), is("EDITOR_LINE_DELETED"), is("EDITOR_LINE_REPEATED")], is("MEMBER_SAVED", (e, ctx) => e.dsn === `${ctx.hlq}.JCL` && e.member === "HELLO")),
      memberSatisfies("{HLQ}.JCL", "HELLO", (records) => records.some((r) => r.startsWith("//*"))),
    ),
  },
  "l10-copy-move": {
    task: "In {HLQ}.JCL(SORTJOB) copy a record after another, copy one before another, move a block, then leave without saving.",
    validator: sawAllThen(
      [is("EDITOR_LINES_COPIED", (e) => e.dest === "A"), is("EDITOR_LINES_COPIED", (e) => e.dest === "B"), is("EDITOR_LINES_MOVED")],
      is("EDIT_CANCELLED", (e, ctx) => e.dsn === `${ctx.hlq}.JCL` && e.member === "SORTJOB"),
    ),
  },
  "l13-copy-across": {
    task: "Copy members into {HLQ}.TEST.JCL (two copies), then delete {HLQ}.TEST.JCL.",
    validator: allOf(
      sawTimes(2, is("MEMBER_COPIED", (e, ctx) => e.to.dsn === `${ctx.hlq}.TEST.JCL`)),
      sawAll(is("DATASET_DELETED", (e, ctx) => e.dsn === `${ctx.hlq}.TEST.JCL`)),
      ({ state, hlq }) => !state.catalog.datasets[`${hlq}.TEST.JCL`],
    ),
  },
  "l15-split-screen": {
    task: "Edit {HLQ}.JCL(HELLO) in one screen, view COPYJOB in a second screen, swap between them, then end the second screen.",
    validator: allOf(
      sawAll(opened("JCL", "HELLO", ["EDIT"]), opened("JCL", "COPYJOB", ["VIEW", "BROWSE"])),
      sawInOrder(is("SCREEN_SPLIT"), is("SCREEN_SWAPPED"), is("SCREEN_CLOSED")),
      ({ state }) => state.screens.length <= 1,
    ),
  },
  "l16-jump-return": {
    task: "Jump to Edit with =2, open {HLQ}.JCL(HELLO), jump to 3.4 from inside the editor, then RETURN.",
    validator: sawInOrder(
      is("JUMP_EXECUTED", (e) => e.path === "2"),
      opened("JCL", "HELLO", ["EDIT"]),
      is("JUMP_EXECUTED", (e) => e.path === "3.4" && e.from === "EDIT"),
      is("RETURN_EXECUTED"),
    ),
  },
  "l17-retrieve-multi": {
    task: "In the data set list exclude two data sets with one Enter, RESET, then retrieve an earlier command and run it again.",
    validator: allOf(
      sawInOrder(is("LIST_COMMANDS_PROCESSED", (e) => e.count >= 2), is("LIST_RESET")),
      retrievedCommandRerun,
    ),
  },
  "l18-cols-bounds": {
    task: "In {HLQ}.COBOL(HELLO) show a column ruler, set BOUNDS 8 72, FIND DIVISION, then RESET.",
    validator: allOf(
      sawAll(opened("COBOL", "HELLO", ["EDIT"]), is("COLS_DISPLAYED")),
      sawInOrder(cmd(/^(BOUNDS|BOUND|BNDS|BND)\s+8\s+72$/i), is("BOUNDS_CHANGED"), is("EDITOR_FIND", (e) => /DIVISION/i.test(e.text)), cmd(/^RES(ET)?$/i)),
    ),
  },
  "l19-profiles": {
    task: "Turn CAPS ON for the JCL profile, show that it persists in another JCL member, then turn it OFF again.",
    validator: allOf(
      sawInOrder(opened("JCL", undefined, ["EDIT"]), cmd(/^PROF(ILE)?$/i), cmd(/^CAPS\s+ON$/i), opened("JCL", "COPYJOB", ["EDIT"]), cmd(/^CAPS\s+OFF$/i)),
      ({ state }) => (state.editor ? state.editor.profile.caps : state.editProfiles.JCL?.caps) === false,
    ),
  },
  "l20-undo-recovery": {
    task: "In {HLQ}.JCL(HELLO) delete a line, UNDO it, turn RECOVERY ON, then CANCEL.",
    validator: allOf(
      sawInOrder(is("EDITOR_LINE_DELETED"), is("UNDO_EXECUTED")),
      sawAllThen([cmd(/^RECOVERY\s+ON$/i)], is("EDIT_CANCELLED")),
    ),
  },
  "l21-exclude-flip": {
    task: "In {HLQ}.COBOL(HELLO) exclude every line containing DIVISION, FLIP the display, then RESET.",
    validator: sawInOrder(cmd(/^(X|EX|EXC|EXCLUDE)\s+.*DIVISION/i), is("EDITOR_LINES_EXCLUDED"), cmd(/^FLIP$/i), cmd(/^RES(ET)?$/i)),
  },
  "l22-dslist-advanced": {
    task: "In the data set list for {HLQ}: sort by LRECL descending, find COBOL, exclude LOADLIB, show short information for {HLQ}.JCL, then RESET.",
    validator: sawAllThen(
      [
        is("LIST_SORTED", (e) => e.field.toUpperCase() === "LRECL"),
        is("LIST_FIND", (e) => e.found),
        is("LIST_LINES_EXCLUDED", (e) => e.count >= 1),
        is("DATASET_INFO_VIEWED", (e, ctx) => e.dsn === `${ctx.hlq}.JCL` && e.short === true),
      ],
      is("LIST_RESET"),
    ),
  },
  "l23-member-info": {
    task: "On the member list of {HLQ}.JCL show HELLO's statistics, reset them, and show them again.",
    validator: sawInOrder(
      is("MEMBER_INFO_VIEWED", (e, ctx) => e.dsn === `${ctx.hlq}.JCL` && e.member === "HELLO"),
      is("MEMBER_STATS_RESET", (e, ctx) => e.dsn === `${ctx.hlq}.JCL` && e.member === "HELLO"),
      is("MEMBER_INFO_VIEWED", (e, ctx) => e.dsn === `${ctx.hlq}.JCL` && e.member === "HELLO"),
    ),
  },
  "l24-submit": {
    task: "Open {HLQ}.JCL(HELLO) in Edit and submit it.",
    validator: sawInOrder(opened("JCL", "HELLO", ["EDIT"]), is("JOB_SUBMITTED", (e, ctx) => e.from === "EDIT" && e.jobName === `${ctx.hlq}H`)),
  },
  "l25-sdsf-status": {
    task: "Submit {HLQ}.JCL(HELLO), find the job in SDSF status with Max-RC CC 0000, and browse its output.",
    validator: helloJobBrowsed,
  },
};
