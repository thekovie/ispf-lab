/**
 * Option 3.4 results: the DSLIST panel with line commands, SORT/FIND/EXCLUDE and multi-command processing.
 * Reference: docs/03-ispf-behaviour-reference.md §DSLIST line commands, §DSLIST primary commands.
 */
import { getDataset, searchLevel } from "@/catalog/catalog";
import type { Dataset } from "@/catalog/types";
import { parseDslistLineCommand } from "@/parsers/listLineCommand";
import { tokenize } from "@/parsers/editorPrimaryCommand";
import { blank, dim, f, label, t, titleRow } from "../rows";
import { collectListCommands, resumeListCommands, runListCommands } from "../listCommands";
import { fail, pop, push, replace, withMessage } from "../navigation";
import { openRef } from "../open";
import type { DslistSort, DslistSortField, ListMode, Row, ScreenFrame, ScreenHandler, SimEvent, SimulatorState, StepResult } from "../types";

const PAGE = 14;
type Frame = Extract<ScreenFrame, { id: "DSLIST_RESULTS" }>;

const SORT_FIELDS: DslistSortField[] = ["NAME", "DSORG", "RECFM", "LRECL", "VOLUME"];

/** One display row: a data set, or a marker standing in for a run of excluded data sets. */
type Entry = { kind: "ds"; ds: Dataset } | { kind: "excluded"; count: number };

function sorted(list: Dataset[], sort?: DslistSort): Dataset[] {
  if (!sort) return list;
  const key = (d: Dataset): string | number =>
    sort.field === "NAME" ? d.name : sort.field === "DSORG" ? d.dsorg : sort.field === "RECFM" ? d.recfm : sort.field === "LRECL" ? d.lrecl : d.volume;
  return [...list].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    const c = ka < kb ? -1 : ka > kb ? 1 : a.name.localeCompare(b.name);
    return sort.descending ? -c : c;
  });
}

/** The data sets of the list in display order (sort applied), excluded ones included. */
export function listedDatasets(state: SimulatorState, frame: Frame): Dataset[] {
  return sorted(searchLevel(state.catalog, frame.level), frame.sort);
}

function entries(state: SimulatorState, frame: Frame): Entry[] {
  const excluded = new Set(frame.excluded ?? []);
  const out: Entry[] = [];
  for (const ds of listedDatasets(state, frame)) {
    if (!excluded.has(ds.name)) out.push({ kind: "ds", ds });
    else {
      const last = out[out.length - 1];
      if (last && last.kind === "excluded") out[out.length - 1] = { kind: "excluded", count: last.count + 1 };
      else out.push({ kind: "excluded", count: 1 });
    }
  }
  return out;
}

function rowFor(e: Entry, value: string): Row {
  if (e.kind === "excluded") return [dim(`- - - - - - - - - - - - - - - - - - - -  ${e.count} Data Set(s) Not Displayed  - - - - - - -`)];
  const ds = e.ds;
  const attrs = `${ds.dsorg}    ${ds.recfm.padEnd(4)} ${String(ds.lrecl).padStart(5)}`;
  return [f(`cmd:${ds.name}`, 2, value), t(" "), t(ds.name.padEnd(44), "white"), t(" "), t(attrs, "green"), t("  "), t(ds.volume, ds.readOnly ? "yellow" : "green")];
}

export const dslistResultsScreen: ScreenHandler<Frame> = {
  help: [
    "Type a line command in the column left of a data set name and press Enter:",
    "  E Edit  B Browse  V View  M Member list  I Information  S Short information",
    "  D Delete  R Rename  CO Copy  MO Move  X Exclude  NX Unexclude  Z Compress",
    "  = Repeat last line command. Several commands are processed top to bottom.",
    "Primary: SORT NAME|DSORG|RECFM|LRECL|VOLUME [A|D], FIND text, RFIND (PF5),",
    "EXCLUDE text [ALL], RESET, LOCATE name, REFRESH. PF3 returns to the entry panel.",
  ],
  render(state, frame) {
    const all = entries(state, frame);
    const top = Math.min(frame.top, Math.max(0, all.length - 1));
    const page = all.slice(top, top + PAGE);
    const msg = state.message;
    const total = listedDatasets(state, frame).length;
    const rows: Row[] = [
      titleRow(`DSLIST - Data Sets Matching ${frame.level}`, msg?.short ?? `Row ${total ? top + 1 : 0} of ${total}`, msg ? (msg.severity === "error" ? "red" : "yellow") : "white"),
      [label("Command ===> "), f("command", 49, state.fieldValues.command ?? ""), label("  Scroll ===> "), t("PAGE", "green")],
      blank,
      [t("Command - Enter \"/\" to select action", "white"), t("            Dsorg  Recfm Lrecl  Volume", "white")],
      [dim("-".repeat(80))],
      ...page.map((e) => rowFor(e, e.kind === "ds" ? (state.fieldValues[`cmd:${e.ds.name}`] ?? "") : "")),
    ];
    if (top + PAGE >= all.length) rows.push([dim("***************************** End of Data Set list ****************************")]);
    const fields = page.flatMap((e) => (e.kind === "ds" ? [`cmd:${e.ds.name}`] : []));
    return {
      title: "DSLIST",
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Exit" },
        { key: 5, label: "Rfind" },
        { key: 7, label: "Up" },
        { key: 8, label: "Down" },
      ],
      fields: ["command", ...fields],
      focus: state.focusField ?? fields[0] ?? "command",
      message: msg,
      rows,
    };
  },
  onEnter(state, frame, fields) {
    const keys = entries(state, frame).flatMap((e) => (e.kind === "ds" ? [e.ds.name] : []));
    const cmds = collectListCommands(fields, keys);
    if (cmds.length) return runListCommands(state, cmds, runLineCommand, "DSLIST_RESULTS");
    return runPrimary(state, frame, (fields.command ?? "").trim());
  },
  onResume(state, frame) {
    return resumeListCommands(state, frame, runLineCommand);
  },
  onPf(state, frame, key) {
    if (key === 3) return pop(state);
    if (key === 5) return rfind(state, frame);
    const total = entries(state, frame).length;
    if (key === 7) {
      if (frame.top === 0) return { state: { ...state, message: { short: "*** TOP OF LIST ***", severity: "info" } }, events: [] };
      return replace(state, { ...frame, top: Math.max(0, frame.top - PAGE) });
    }
    if (key === 8) {
      if (frame.top + PAGE >= total) return { state: { ...state, message: { short: "*** BOTTOM OF LIST ***", severity: "info" } }, events: [] };
      return replace(state, { ...frame, top: frame.top + PAGE });
    }
    return null;
  },
};

const frameOf = (state: SimulatorState): Frame => state.screen as Frame;

function runLineCommand(state: SimulatorState, dsn: string, raw: string): StepResult {
  const frame = frameOf(state);
  const typed = raw.trim().toUpperCase();
  const parsed = parseDslistLineCommand(typed);
  const entered: SimEvent = { type: "COMMAND_ENTERED", screen: "DSLIST_RESULTS", command: `${typed} ${dsn}` };
  if (!parsed || !parsed.ok) {
    const r = fail({ ...state, focusField: `cmd:${dsn}` }, "INVALID LINE COMMAND", `"${raw.trim()}" is not a DSLIST line command. Use E, B, V, M, I, S, D, R, CO, MO, X, NX, Z or =.`);
    return { state: r.state, events: [entered, ...r.events] };
  }
  const ds = getDataset(state.catalog, dsn);
  if (!ds) return fail(state, "DATA SET NOT CATALOGED");
  let cmd: string = parsed.cmd;
  if (cmd === "=") {
    if (!frame.lastCmd) return fail({ ...state, focusField: `cmd:${dsn}` }, "NO PREVIOUS LINE COMMAND", "= repeats the last line command entered on this list; none has been entered yet.");
    cmd = frame.lastCmd;
  }
  const remembered: SimulatorState = { ...state, screen: { ...frame, lastCmd: cmd } };
  const r = execute(remembered, ds, cmd);
  return { state: r.state, events: [entered, ...r.events] };
}

function execute(state: SimulatorState, ds: Dataset, cmd: string): StepResult {
  const frame = frameOf(state);
  switch (cmd) {
    case "E":
    case "B":
    case "V":
    case "M":
      return openRef(state, { dsn: ds.name }, cmd as ListMode);
    case "S":
      return push(state, { id: "DATASET_INFO", dsn: ds.name, short: true }, [{ type: "DATASET_INFO_VIEWED", dsn: ds.name, short: true }]);
    case "I":
      return push(state, { id: "DATASET_INFO", dsn: ds.name }, [{ type: "DATASET_INFO_VIEWED", dsn: ds.name }]);
    case "D":
      return ds.readOnly ? fail(state, "DATA SET IS READ ONLY", "System libraries cannot be deleted in this training environment.") : push(state, { id: "CONFIRM_DELETE", target: { dsn: ds.name } });
    case "R":
      return ds.readOnly ? fail(state, "DATA SET IS READ ONLY") : push(state, { id: "RENAME", target: { dsn: ds.name } });
    case "CO":
      return push(state, { id: "MOVE_COPY", prefill: { option: "C", from: ds.name } });
    case "MO":
      return ds.readOnly ? fail(state, "DATA SET IS READ ONLY", "System libraries cannot be moved.") : push(state, { id: "MOVE_COPY", prefill: { option: "M", from: ds.name } });
    case "X": {
      const excluded = frame.excluded?.includes(ds.name) ? frame.excluded : [...(frame.excluded ?? []), ds.name];
      const r = replace(state, { ...frame, excluded });
      return { state: r.state, events: [...r.events, { type: "LIST_LINES_EXCLUDED", screen: "DSLIST_RESULTS", count: 1 }] };
    }
    case "NX":
      return replace(state, { ...frame, excluded: (frame.excluded ?? []).filter((n) => n !== ds.name) });
    case "Z": {
      if (ds.datasetType !== "PDS") return fail(state, "DATA SET IS NOT PARTITIONED", "Only a PDS has directory and member space to compress.");
      if (ds.readOnly) return fail(state, "DATA SET IS READ ONLY");
      const r = withMessage(state, { short: "COMPRESS COMPLETED", long: `${ds.name} was compressed (simulated: IEBCOPY reclaims the space of deleted and replaced members).`, severity: "info" });
      return { state: r.state, events: [{ type: "DATASET_COMPRESSED", dsn: ds.name }, ...r.events] };
    }
    default:
      return fail(state, "INVALID LINE COMMAND");
  }
}

/** Index of the first visible data set containing `text` after entry `from`, wrapping to the top; -1 if none. */
function findFrom(all: Entry[], text: string, from: number): number {
  const hit = (e: Entry) => e.kind === "ds" && e.ds.name.includes(text);
  const after = all.findIndex((e, i) => i > from && hit(e));
  return after >= 0 ? after : all.findIndex(hit);
}

function rfind(state: SimulatorState, frame: Frame): StepResult {
  if (!frame.find) return fail(state, "NO PREVIOUS FIND", "Type FIND text first; RFIND (PF5) repeats it.");
  return doFind(state, frame, frame.find, frame.top);
}

function doFind(state: SimulatorState, frame: Frame, text: string, from: number): StepResult {
  const all = entries(state, frame);
  const idx = findFrom(all, text, from);
  const found: SimEvent = { type: "LIST_FIND", screen: "DSLIST_RESULTS", text, found: idx >= 0 };
  if (idx < 0) {
    const r = replace(state, { ...frame, find: text }, { short: `NO CHARS '${text}' FOUND`, severity: "error" });
    return { state: r.state, events: [found, ...r.events] };
  }
  const wrapped = idx <= from;
  const r = replace(state, { ...frame, find: text, top: idx }, { short: `CHARS '${text}' FOUND`, long: wrapped ? "The search wrapped around to the top of the list." : undefined, severity: "info" });
  const hit = all[idx] as { kind: "ds"; ds: Dataset };
  return { state: { ...r.state, focusField: `cmd:${hit.ds.name}` }, events: [found, ...r.events] };
}

function runPrimary(state: SimulatorState, frame: Frame, raw: string): StepResult {
  if (!raw) return { state: { ...state, message: undefined, fieldValues: {} }, events: [] };
  const entered: SimEvent = { type: "COMMAND_ENTERED", screen: "DSLIST_RESULTS", command: raw };
  const tokens = tokenize(raw);
  const verb = tokens[0].toUpperCase();
  const arg = (tokens[1] ?? "").toUpperCase();
  const withCmd = { ...state, fieldValues: { command: raw } };
  let r: StepResult;
  switch (verb) {
    case "LOCATE":
    case "L": {
      const idx = entries(state, frame).findIndex((e) => e.kind === "ds" && e.ds.name.startsWith(arg));
      r = idx < 0 ? fail(state, "NOT FOUND") : replace(state, { ...frame, top: idx });
      break;
    }
    case "SORT": {
      const field = (arg || "NAME") as DslistSortField;
      const dir = (tokens[2] ?? "").toUpperCase();
      if (!SORT_FIELDS.includes(field)) r = fail(withCmd, "INVALID SORT FIELD", "SORT NAME, DSORG, RECFM, LRECL or VOLUME, optionally followed by A or D.");
      else if (dir && dir !== "A" && dir !== "D") r = fail(withCmd, "INVALID SORT DIRECTION", "Use A (ascending) or D (descending).");
      else {
        const rr = replace(state, { ...frame, top: 0, sort: { field, descending: dir === "D" } }, { short: `SORTED BY ${field}`, severity: "info" });
        r = { state: rr.state, events: [{ type: "LIST_SORTED", screen: "DSLIST_RESULTS", field }, ...rr.events] };
      }
      break;
    }
    case "FIND":
    case "F":
      r = arg ? doFind(state, frame, arg, frame.top - 1) : fail(withCmd, "FIND STRING REQUIRED", "Example: FIND JCL");
      break;
    case "RFIND":
      r = rfind(state, frame);
      break;
    case "EXCLUDE":
    case "EX":
    case "X": {
      if (!arg) {
        r = fail(withCmd, "EXCLUDE STRING REQUIRED", "Example: EXCLUDE LOAD ALL");
        break;
      }
      const all = (tokens[2] ?? "").toUpperCase() === "ALL";
      const current = new Set(frame.excluded ?? []);
      const candidates = listedDatasets(state, frame).filter((d) => !current.has(d.name) && d.name.includes(arg));
      const hit = all ? candidates : candidates.slice(0, 1);
      if (hit.length === 0) {
        r = fail(withCmd, `NO CHARS '${arg}' FOUND`);
        break;
      }
      const rr = replace(state, { ...frame, excluded: [...current, ...hit.map((d) => d.name)] }, { short: `${hit.length} DATA SET(S) EXCLUDED`, severity: "info" });
      r = { state: rr.state, events: [{ type: "LIST_LINES_EXCLUDED", screen: "DSLIST_RESULTS", count: hit.length }, ...rr.events] };
      break;
    }
    case "RESET":
    case "RES": {
      const rr = replace(state, { ...frame, excluded: undefined, top: 0 });
      r = { state: rr.state, events: [{ type: "LIST_RESET", screen: "DSLIST_RESULTS" }, ...rr.events] };
      break;
    }
    case "REFRESH":
    case "REF":
      r = replace(state, { ...frame, top: 0 });
      break;
    case "EXPLAIN":
      r = { state: { ...state, fieldValues: {} }, events: [{ type: "EXPLAIN_REQUESTED", term: tokens.slice(1).join(" ") }] };
      break;
    case "END":
    case "EXIT":
      r = pop(state);
      break;
    case "HELP":
      r = push(state, { id: "HELP", topic: "DSLIST_RESULTS" });
      break;
    default:
      r = fail(withCmd, "COMMAND NOT RECOGNIZED", "DSLIST primary commands: SORT, FIND, RFIND, EXCLUDE, RESET, LOCATE name, REFRESH, END.");
  }
  return { state: r.state, events: [entered, ...r.events] };
}
