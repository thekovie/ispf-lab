/**
 * Option 3.4 results: the DSLIST panel with line commands.
 * Reference: docs/03-ispf-behaviour-reference.md §DSLIST line commands.
 */
import { getDataset, searchLevel } from "@/catalog/catalog";
import type { Dataset } from "@/catalog/types";
import { parseDslistLineCommand } from "@/parsers/listLineCommand";
import { tokenize } from "@/parsers/editorPrimaryCommand";
import { blank, dim, f, label, t, titleRow } from "../rows";
import { fail, pop, push, replace } from "../navigation";
import { openRef } from "../open";
import type { Fields, ListMode, Row, ScreenHandler, SimEvent, SimulatorState, StepResult } from "../types";

const PAGE = 14;
type Frame = { id: "DSLIST_RESULTS"; level: string; top: number };

function rowFor(ds: Dataset, value: string): Row {
  const attrs = ds.datasetType === "PDS" ? `${ds.dsorg}    ${ds.recfm.padEnd(4)} ${String(ds.lrecl).padStart(5)}` : `${ds.dsorg}    ${ds.recfm.padEnd(4)} ${String(ds.lrecl).padStart(5)}`;
  return [f(`cmd:${ds.name}`, 1, value), t("  "), t(ds.name.padEnd(44), "white"), t(" "), t(attrs, "green"), t("  "), t(ds.volume, ds.readOnly ? "yellow" : "green")];
}

export const dslistResultsScreen: ScreenHandler<Frame> = {
  help: [
    "Type a line command in the column left of a data set name and press Enter:",
    "  E Edit   B Browse   V View   M Member list   I Information   D Delete   R Rename",
    "On a partitioned data set (DSORG=PO) E/B/V/M open its member list; on a",
    "sequential data set (PS) E/B/V open the records directly. PF7/PF8 scroll,",
    "PF3 returns to the entry panel. Read-only system libraries show a yellow volume.",
  ],
  render(state, frame) {
    const results = searchLevel(state.catalog, frame.level);
    const top = Math.min(frame.top, Math.max(0, results.length - 1));
    const page = results.slice(top, top + PAGE);
    const msg = state.message;
    const rows: Row[] = [
      titleRow(`DSLIST - Data Sets Matching ${frame.level}`, msg?.short ?? `Row ${results.length ? top + 1 : 0} of ${results.length}`, msg ? (msg.severity === "error" ? "red" : "yellow") : "white"),
      [label("Command ===> "), f("command", 49, state.fieldValues.command ?? ""), label("  Scroll ===> "), t("PAGE", "green")],
      blank,
      [t("Command - Enter \"/\" to select action", "white"), t("            Dsorg  Recfm Lrecl  Volume", "white")],
      [dim("-".repeat(80))],
      ...page.map((ds) => rowFor(ds, state.fieldValues[`cmd:${ds.name}`] ?? "")),
    ];
    if (top + PAGE >= results.length) rows.push([dim("***************************** End of Data Set list ****************************")]);
    return {
      title: "DSLIST",
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Exit" },
        { key: 7, label: "Up" },
        { key: 8, label: "Down" },
      ],
      fields: ["command", ...page.map((ds) => `cmd:${ds.name}`)],
      focus: state.focusField ?? (page[0] ? `cmd:${page[0].name}` : "command"),
      message: msg,
      rows,
    };
  },
  onEnter(state, frame, fields) {
    const line = firstLineCommand(fields);
    if (line) return runLineCommand(state, frame, line.dsn, line.raw, fields);
    return runPrimary(state, frame, (fields.command ?? "").trim());
  },
  onPf(state, frame, key) {
    if (key === 3) return pop(state);
    const total = searchLevel(state.catalog, frame.level).length;
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

function firstLineCommand(fields: Fields): { dsn: string; raw: string } | null {
  for (const [k, v] of Object.entries(fields)) {
    if (k.startsWith("cmd:") && v.trim()) return { dsn: k.slice(4), raw: v };
  }
  return null;
}

function runLineCommand(state: SimulatorState, frame: Frame, dsn: string, raw: string, fields: Fields): StepResult {
  const parsed = parseDslistLineCommand(raw);
  const entered: SimEvent = { type: "COMMAND_ENTERED", screen: "DSLIST_RESULTS", command: `${raw.trim().toUpperCase()} ${dsn}` };
  if (!parsed || !parsed.ok) {
    const r = fail({ ...state, fieldValues: fields, focusField: `cmd:${dsn}` }, "INVALID LINE COMMAND", `"${raw.trim()}" is not a DSLIST line command. Use E, B, V, M, I, D or R.`);
    return { state: r.state, events: [entered, ...r.events] };
  }
  const ds = getDataset(state.catalog, dsn);
  if (!ds) return fail(state, "DATA SET NOT CATALOGED");
  const cmd = parsed.cmd;
  let r: StepResult;
  switch (cmd) {
    case "E":
    case "B":
    case "V":
    case "M":
      r = openRef(state, { dsn }, cmd as ListMode);
      break;
    case "S":
      r = openRef(state, { dsn }, "E");
      break;
    case "I":
      r = push(state, { id: "DATASET_INFO", dsn }, [{ type: "DATASET_INFO_VIEWED", dsn }]);
      break;
    case "D":
      r = ds.readOnly ? fail(state, "DATA SET IS READ ONLY", "System libraries cannot be deleted in this training environment.") : push(state, { id: "CONFIRM_DELETE", target: { dsn } });
      break;
    case "R":
      r = ds.readOnly ? fail(state, "DATA SET IS READ ONLY") : push(state, { id: "RENAME", target: { dsn } });
      break;
    default:
      r = fail(state, "INVALID LINE COMMAND");
  }
  return { state: r.state, events: [entered, ...r.events] };
}

function runPrimary(state: SimulatorState, frame: Frame, raw: string): StepResult {
  if (!raw) return { state: { ...state, message: undefined, fieldValues: {} }, events: [] };
  const entered: SimEvent = { type: "COMMAND_ENTERED", screen: "DSLIST_RESULTS", command: raw };
  const tokens = tokenize(raw);
  const verb = tokens[0].toUpperCase();
  let r: StepResult;
  if (verb === "LOCATE" || verb === "L") {
    const name = (tokens[1] ?? "").toUpperCase();
    const results = searchLevel(state.catalog, frame.level);
    const idx = results.findIndex((d) => d.name.startsWith(name));
    r = idx < 0 ? fail(state, "NOT FOUND") : replace(state, { ...frame, top: idx });
  } else if (verb === "REFRESH" || verb === "REF") {
    r = replace(state, { ...frame, top: 0 });
  } else if (verb === "EXPLAIN") {
    r = { state: { ...state, fieldValues: {} }, events: [{ type: "EXPLAIN_REQUESTED", term: tokens.slice(1).join(" ") }] };
  } else if (verb === "END" || verb === "EXIT") {
    r = pop(state);
  } else if (verb === "HELP") {
    r = push(state, { id: "HELP", topic: "DSLIST_RESULTS" });
  } else {
    r = fail({ ...state, fieldValues: { command: raw } }, "COMMAND NOT RECOGNIZED", "DSLIST primary commands here: LOCATE name, REFRESH, END.");
  }
  return { state: r.state, events: [entered, ...r.events] };
}
