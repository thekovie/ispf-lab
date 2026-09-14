/**
 * SDSF (SIMULATED): primary menu, ST / O job panels, job data set (?) panel, purge confirmation.
 * Reference: docs/10-jes-sdsf.md; IBM z/OS SDSF User's Guide (ST, O panels, ? and S action characters).
 * Every title carries "(SIMULATED)" — this is an educational stand-in, not SDSF.
 */
import { tokenize } from "@/parsers/editorPrimaryCommand";
import { maxRcText } from "@/jes/submit";
import type { Job } from "@/jes/types";
import { blank, dim, f, label, menuRow, optionRow, padRow, t, titleRow } from "../rows";
import { browseJobOutput, findJob, purge } from "../jesActions";
import { collectListCommands, resumeListCommands, runListCommands } from "../listCommands";
import { fail, pop, push, replace } from "../navigation";
import { openRef } from "../open";
import type { Row, ScreenFrame, ScreenHandler, SimEvent, SimulatorState, StepResult } from "../types";

type MenuFrame = Extract<ScreenFrame, { id: "SDSF_MENU" }>;
type StatusFrame = Extract<ScreenFrame, { id: "SDSF_STATUS" }>;
type JobDsFrame = Extract<ScreenFrame, { id: "SDSF_JOB_DS" }>;
type PurgeFrame = Extract<ScreenFrame, { id: "CONFIRM_PURGE" }>;

const PAGE = 14;
const SIM = "(SIMULATED)";

export function statusFrame(state: SimulatorState, queue: "ST" | "O"): StatusFrame {
  return { id: "SDSF_STATUS", queue, top: 0, owner: state.userid, prefix: "*" };
}

/** SDSF LOG: the accumulated JES messages, opened in Browse. */
function openLog(state: SimulatorState): StepResult {
  const records = state.jes.log.length ? state.jes.log : ["(no messages yet - submit a job first)"];
  const pseudo: Job = { id: "SYSLOG", number: 0, jobName: "SYSLOG", owner: "SYSTEM", class: "", msgclass: "", submittedOn: state.today, sequence: 0, status: "OUTPUT", steps: [], outputs: [{ ddname: "LOG", records }], jcl: [] };
  return browseJobOutput(state, pseudo, "LOG");
}

/** The ST/O/LOG commands are accepted on every SDSF panel. */
function sdsfCommand(state: SimulatorState, verb: string): StepResult | null {
  switch (verb) {
    case "ST":
    case "O":
    case "H":
    case "I": {
      const queue = verb === "ST" || verb === "I" ? "ST" : "O";
      const note = verb === "H" || verb === "I" ? { short: `${verb} SHOWN AS ${queue}`, long: "Held and input queues are not simulated; jobs here run to completion at once.", severity: "info" as const } : undefined;
      if (state.screen.id === "SDSF_STATUS") return replace(state, statusFrame(state, queue), note);
      const r = push(state, statusFrame(state, queue), [{ type: "JOB_STATUS_OPENED", queue: verb }]);
      return note ? { state: { ...r.state, message: note }, events: r.events } : r;
    }
    case "LOG":
      return openLog(state);
    case "DA":
    case "PR":
    case "INIT":
      return fail(state, "OPTION NOT AVAILABLE IN THIS TRAINING MODULE", "Active users, printers and initiators are not simulated.");
    default:
      return null;
  }
}

export const sdsfMenuScreen: ScreenHandler<MenuFrame> = {
  help: [
    "SDSF (System Display and Search Facility) shows what JES is doing with your",
    "jobs. In this simulator jobs run to completion the moment you SUBMIT them,",
    "so ST (status) and O (output) are the panels that matter. Type ST and press",
    "Enter, then use ? on a job to list its spool data sets and S to browse one.",
    "The real SDSF option letter varies by site: S, SD or M.5 are common.",
  ],
  render(state) {
    const msg = state.message;
    return {
      title: `SDSF ${SIM}`,
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "End" },
      ],
      fields: ["option"],
      focus: "option",
      message: msg,
      rows: [
        titleRow(`SDSF PRIMARY OPTION MENU ${SIM}`, msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        optionRow("option", state.fieldValues.option ?? ""),
        blank,
        menuRow("DA", "Active users", "(not simulated)"),
        menuRow("I", "Input queue", "shown as ST"),
        menuRow("O", "Output queue", "jobs that produced output"),
        menuRow("H", "Held output queue", "shown as O"),
        menuRow("ST", "Status of jobs", "every job you submitted"),
        blank,
        menuRow("LOG", "System log", "JES messages of this session"),
        menuRow("END", "Exit SDSF", ""),
        blank,
        padRow("  Educational simulation of SDSF. Not SDSF; not affiliated with IBM.", "dim"),
        padRow(`  Jobs on the spool: ${state.jes.jobs.length}   Owner filter: ${state.userid}`, "dim"),
      ],
    };
  },
  onEnter(state, _frame, fields) {
    const raw = (fields.option ?? "").trim();
    if (!raw) return { state: { ...state, message: undefined }, events: [] };
    const verb = tokenize(raw)[0].toUpperCase();
    const entered: SimEvent = { type: "COMMAND_ENTERED", screen: "SDSF_MENU", command: raw.toUpperCase() };
    let r = sdsfCommand(state, verb);
    if (!r) {
      if (verb === "END" || verb === "EXIT" || verb === "X") r = pop(state);
      else if (verb === "HELP") r = push(state, { id: "HELP", topic: "SDSF_MENU" });
      else if (verb === "EXPLAIN") r = { state: { ...state, fieldValues: {} }, events: [{ type: "EXPLAIN_REQUESTED", term: tokenize(raw).slice(1).join(" ") }] };
      else r = fail({ ...state, fieldValues: { option: raw } }, "INVALID OPTION", "SDSF options here: ST, O, LOG, END.");
    }
    return { state: r.state, events: [entered, ...r.events] };
  },
  onPf(state, _frame, key) {
    return key === 3 ? pop(state) : null;
  },
};

function matches(job: Job, frame: StatusFrame): boolean {
  const owner = frame.owner === "*" || job.owner === frame.owner;
  const prefix = frame.prefix === "*" || job.jobName.startsWith(frame.prefix.replace(/\*$/, ""));
  const queue = frame.queue === "ST" || job.status === "OUTPUT";
  return owner && prefix && queue;
}

export function listedJobs(state: SimulatorState, frame: StatusFrame): Job[] {
  const jobs = state.jes.jobs.filter((j) => matches(j, frame));
  const key = (j: Job) => (frame.sort === "JOBNAME" ? j.jobName : frame.sort === "STATUS" ? maxRcText(j) : j.id);
  return frame.sort ? [...jobs].sort((a, b) => key(a).localeCompare(key(b)) || a.number - b.number) : jobs;
}

function jobRow(job: Job, value: string): Row {
  return [
    f(`cmd:${job.id}`, 2, value),
    t(" "),
    t(job.jobName.padEnd(8), "white"),
    t(" "),
    t(job.id.padEnd(8), "green"),
    t(" "),
    t(job.owner.padEnd(8), "green"),
    t("   15 "),
    t("PRINT ", "green"),
    t(" "),
    t(job.class.padEnd(1), "green"),
    t("  "),
    t(String(job.sequence).padStart(4), "green"),
    t("   "),
    t(maxRcText(job).padEnd(10), job.status === "JCL_ERROR" || job.abend ? "yellow" : "green"),
    t("  "),
    t(job.submittedOn, "green"),
  ];
}

export const sdsfStatusScreen: ScreenHandler<StatusFrame> = {
  help: [
    "ST lists every job you submitted; O only those with output. Columns: NP (the",
    "action column), JOBNAME, JobID, Owner, Prty, Queue, C(lass), Pos, Max-RC",
    "(CC 0000 = ended with condition code 0, JCL ERROR = never ran, ABEND Sxxx =",
    "abnormal end). Actions: S browse all output, ? list the spool data sets,",
    "P purge, SJ edit the JCL that was submitted, = repeat the last action.",
    "Commands: OWNER userid|*, PREFIX name*|*, SORT JOBNAME|JOBID|STATUS, ST, O, LOG.",
  ],
  render(state, frame) {
    const jobs = listedJobs(state, frame);
    const top = Math.min(frame.top, Math.max(0, jobs.length - 1));
    const page = jobs.slice(top, top + PAGE);
    const msg = state.message;
    const title = frame.queue === "ST" ? "SDSF STATUS DISPLAY ALL CLASSES" : "SDSF OUTPUT ALL CLASSES ALL FORMS";
    const rows: Row[] = [
      titleRow(`${title} ${SIM}`, msg?.short ?? `LINE ${jobs.length ? top + 1 : 0}-${Math.min(jobs.length, top + PAGE)} (${jobs.length})`, msg ? (msg.severity === "error" ? "red" : "yellow") : "white"),
      [label("COMMAND INPUT ===> "), f("command", 43, state.fieldValues.command ?? ""), label("  SCROLL ===> "), t("PAGE", "green")],
      [t(`PREFIX=${frame.prefix.padEnd(9)} DEST=(ALL)  OWNER=${frame.owner.padEnd(9)} SORT=${frame.sort ?? "NONE"}`, "white")],
      [t("NP   JOBNAME  JobID    Owner    Prty Queue  C  Pos   Max-RC      Date", "white")],
      ...page.map((j) => jobRow(j, state.fieldValues[`cmd:${j.id}`] ?? "")),
    ];
    if (jobs.length === 0) rows.push(blank, [dim("  No jobs match. SUBMIT a member from Edit, or type J next to it on a member list.")]);
    if (top + PAGE >= jobs.length) rows.push([dim("******************************** BOTTOM OF DATA ********************************")]);
    return {
      title: `SDSF ${frame.queue} ${SIM}`,
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "End" },
        { key: 7, label: "Up" },
        { key: 8, label: "Down" },
      ],
      fields: ["command", ...page.map((j) => `cmd:${j.id}`)],
      focus: state.focusField ?? (page[0] ? `cmd:${page[0].id}` : "command"),
      message: msg,
      rows,
    };
  },
  onEnter(state, frame, fields) {
    const cmds = collectListCommands(fields, listedJobs(state, frame).map((j) => j.id));
    if (cmds.length) return runListCommands(state, cmds, runJobCommand, "SDSF_STATUS");
    return runStatusPrimary(state, frame, (fields.command ?? "").trim());
  },
  onResume(state, frame) {
    return resumeListCommands(state, frame, runJobCommand);
  },
  onPf(state, frame, key) {
    if (key === 3) return pop(state);
    const total = listedJobs(state, frame).length;
    if (key === 7) return frame.top === 0 ? { state: { ...state, message: { short: "*** TOP OF DATA ***", severity: "info" } }, events: [] } : replace(state, { ...frame, top: Math.max(0, frame.top - PAGE) });
    if (key === 8) return frame.top + PAGE >= total ? { state: { ...state, message: { short: "*** BOTTOM OF DATA ***", severity: "info" } }, events: [] } : replace(state, { ...frame, top: frame.top + PAGE });
    return null;
  },
};

const JOB_ACTIONS = new Set(["S", "?", "P", "SJ", "=", "SE", "X"]);

function runJobCommand(state: SimulatorState, jobId: string, raw: string): StepResult {
  const frame = state.screen as StatusFrame;
  let cmd = raw.trim().toUpperCase();
  const entered: SimEvent = { type: "COMMAND_ENTERED", screen: "SDSF_STATUS", command: `${cmd} ${jobId}` };
  const wrap = (r: StepResult): StepResult => ({ state: r.state, events: [entered, ...r.events] });
  if (!JOB_ACTIONS.has(cmd)) return wrap(fail({ ...state, focusField: `cmd:${jobId}` }, "INVALID ACTION CHARACTER", `"${raw.trim()}" is not an SDSF action here. Use S, ?, P, SJ or =.`));
  if (cmd === "=") {
    if (!frame.lastCmd) return wrap(fail({ ...state, focusField: `cmd:${jobId}` }, "NO PREVIOUS ACTION"));
    cmd = frame.lastCmd;
  }
  const job = findJob(state, jobId);
  if (!job) return wrap(fail(state, "JOB NOT FOUND"));
  const remembered: SimulatorState = { ...state, screen: { ...frame, lastCmd: cmd } };
  switch (cmd) {
    case "S":
    case "X":
      return wrap(browseJobOutput(remembered, job));
    case "?":
      return wrap(push(remembered, { id: "SDSF_JOB_DS", jobId: job.id, top: 0 }, [{ type: "JOB_OUTPUT_OPENED", jobId: job.id }]));
    case "P":
      return wrap(push(remembered, { id: "CONFIRM_PURGE", jobId: job.id }));
    case "SJ":
    case "SE":
      if (!job.source) return wrap(fail(remembered, "SOURCE NOT AVAILABLE", "The JCL was submitted from an unsaved editor buffer; SJ needs a member."));
      return wrap(openRef(remembered, job.source, "E"));
    default:
      return wrap(fail(remembered, "INVALID ACTION CHARACTER"));
  }
}

function runStatusPrimary(state: SimulatorState, frame: StatusFrame, raw: string): StepResult {
  if (!raw) return { state: { ...state, message: undefined, fieldValues: {} }, events: [] };
  const entered: SimEvent = { type: "COMMAND_ENTERED", screen: "SDSF_STATUS", command: raw.toUpperCase() };
  const tokens = tokenize(raw);
  const verb = tokens[0].toUpperCase();
  const arg = (tokens[1] ?? "").toUpperCase();
  const withCmd = { ...state, fieldValues: { command: raw } };
  let r = sdsfCommand(state, verb);
  if (!r) {
    switch (verb) {
      case "OWNER":
        r = replace(state, { ...frame, owner: arg || state.userid, top: 0 }, { short: `OWNER ${arg || state.userid}`, severity: "info" });
        break;
      case "PREFIX":
        r = replace(state, { ...frame, prefix: arg || "*", top: 0 }, { short: `PREFIX ${arg || "*"}`, severity: "info" });
        break;
      case "SORT":
        if (arg === "JOBNAME" || arg === "JOBID" || arg === "STATUS") r = replace(state, { ...frame, sort: arg, top: 0 }, { short: `SORTED BY ${arg}`, severity: "info" });
        else if (arg) r = fail(withCmd, "INVALID SORT COLUMN", "SORT JOBNAME, JOBID or STATUS.");
        else r = replace(state, { ...frame, sort: undefined, top: 0 });
        break;
      case "FIND":
      case "F": {
        const idx = listedJobs(state, frame).findIndex((j, i) => i > frame.top - 1 && (j.jobName.includes(arg) || j.id.includes(arg)));
        r = idx < 0 ? fail(withCmd, `NO CHARS '${arg}' FOUND`) : replace(state, { ...frame, top: idx }, { short: `CHARS '${arg}' FOUND`, severity: "info" });
        break;
      }
      case "END":
      case "EXIT":
        r = pop(state);
        break;
      case "HELP":
        r = push(state, { id: "HELP", topic: "SDSF_STATUS" });
        break;
      case "EXPLAIN":
        r = { state: { ...state, fieldValues: {} }, events: [{ type: "EXPLAIN_REQUESTED", term: tokens.slice(1).join(" ") }] };
        break;
      default:
        r = fail(withCmd, "COMMAND NOT RECOGNIZED", "SDSF commands here: OWNER, PREFIX, SORT, FIND, ST, O, LOG, END.");
    }
  }
  return { state: r.state, events: [entered, ...r.events] };
}

export const sdsfJobDsScreen: ScreenHandler<JobDsFrame> = {
  help: [
    "The job data set panel (? on a job) lists the spool data sets JES kept:",
    "JESMSGLG (job log: $HASP and IEF messages with the condition codes),",
    "JESJCL (the JCL as JES read it, numbered), JESYSMSG (allocation, JCL error",
    "and abend messages) and one entry per SYSOUT DD a program wrote to.",
    "Type S next to a data set to browse it; PF3 returns to the status panel.",
  ],
  render(state, frame) {
    const job = findJob(state, frame.jobId);
    const msg = state.message;
    const outputs = job?.outputs ?? [];
    const page = outputs.slice(frame.top, frame.top + PAGE);
    return {
      title: `SDSF JOB DATA SET ${SIM}`,
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "End" },
      ],
      fields: ["command", ...page.map((o) => `cmd:${o.ddname}`)],
      focus: state.focusField ?? (page[0] ? `cmd:${page[0].ddname}` : "command"),
      message: msg,
      rows: [
        titleRow(`SDSF JOB DATA SET DISPLAY - JOB ${job?.jobName ?? "?"} (${frame.jobId}) ${SIM}`, msg?.short ?? `LINE 1-${outputs.length} (${outputs.length})`, msg ? (msg.severity === "error" ? "red" : "yellow") : "white"),
        [label("COMMAND INPUT ===> "), f("command", 43, state.fieldValues.command ?? ""), label("  SCROLL ===> "), t("PAGE", "green")],
        [t("NP   DDNAME   StepName ProcStep DSID Owner    C Dest       Rec-Cnt", "white")],
        ...page.map((o, i): Row => [
          f(`cmd:${o.ddname}`, 2, state.fieldValues[`cmd:${o.ddname}`] ?? ""),
          t(" "),
          t(o.ddname.padEnd(8), "white"),
          t(" "),
          t((o.stepName ?? "JES2").padEnd(8), "green"),
          t("          "),
          t(String(frame.top + i + 2).padStart(4), "green"),
          t(" "),
          t((job?.owner ?? "").padEnd(8), "green"),
          t(" "),
          t((job?.msgclass ?? "X").padEnd(1), "green"),
          t(" LOCAL      "),
          t(String(o.records.length).padStart(7), "green"),
        ]),
        [dim("******************************** BOTTOM OF DATA ********************************")],
      ],
    };
  },
  onEnter(state, frame, fields) {
    const job = findJob(state, frame.jobId);
    if (!job) return pop(state, { short: "JOB NOT FOUND", severity: "error" });
    for (const o of job.outputs) {
      const v = (fields[`cmd:${o.ddname}`] ?? "").trim().toUpperCase();
      if (!v) continue;
      if (v === "S" || v === "X") return browseJobOutput(state, job, o.ddname);
      return fail({ ...state, focusField: `cmd:${o.ddname}` }, "INVALID ACTION CHARACTER", "Type S next to a spool data set to browse it.");
    }
    const raw = (fields.command ?? "").trim();
    if (!raw) return { state: { ...state, message: undefined }, events: [] };
    const verb = tokenize(raw)[0].toUpperCase();
    const r = sdsfCommand(state, verb);
    if (r) return r;
    if (verb === "END" || verb === "EXIT") return pop(state);
    if (verb === "HELP") return push(state, { id: "HELP", topic: "SDSF_JOB_DS" });
    return fail({ ...state, fieldValues: { command: raw } }, "COMMAND NOT RECOGNIZED");
  },
  onPf(state, _frame, key) {
    return key === 3 ? pop(state) : null;
  },
};

export const confirmPurgeScreen: ScreenHandler<PurgeFrame> = {
  help: ["SDSF asks before purging (P) a job. Enter or Y purges the job and all its output; PF3 or N cancels."],
  render(state, frame) {
    const job = findJob(state, frame.jobId);
    const msg = state.message;
    return {
      title: `Confirm Purge ${SIM}`,
      pfKeys: [
        { key: 3, label: "Cancel" },
        { key: 12, label: "Cancel" },
      ],
      fields: ["confirm"],
      focus: "confirm",
      message: msg,
      rows: [
        titleRow(`SDSF Confirm Action ${SIM}`, msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        blank,
        [label("Action . . . . : "), t("P (purge)", "white")],
        [label("Job  . . . . . : "), t(`${job?.jobName ?? "?"} (${frame.jobId})`, "white")],
        blank,
        padRow("   The job and all of its spool output will be removed.", "white"),
        blank,
        [label("Confirm purge (Y/N) ===> "), f("confirm", 1, state.fieldValues.confirm ?? "Y")],
      ],
    };
  },
  onEnter(state, frame, fields) {
    const answer = (fields.confirm ?? "Y").trim().toUpperCase() || "Y";
    if (answer === "N") return pop(state, { short: "PURGE CANCELLED", severity: "info" });
    if (answer !== "Y") return fail({ ...state, fieldValues: fields }, "ENTER Y OR N");
    const r = purge(state, frame.jobId);
    if (r.state.message?.severity === "error") return r;
    const p = pop(r.state, r.state.message);
    return { state: p.state, events: [...r.events, ...p.events] };
  },
  onPf(state, _frame, key) {
    return key === 3 || key === 12 ? pop(state, { short: "PURGE CANCELLED", severity: "info" }) : null;
  },
};
