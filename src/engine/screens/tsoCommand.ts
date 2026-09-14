/**
 * Option 6: TSO command shell (subset). Reference: docs/03-ispf-behaviour-reference.md §Option 6.
 */
import { deleteDataset, getDataset, listMembers, parseDsnRef, readRecords, renameDataset, searchLevel } from "@/catalog/catalog";
import { parseTsoCommand } from "@/parsers/tsoCommand";
import { blank, commandRow, padRow, t, titleRow } from "../rows";
import { submitRecords } from "../jesActions";
import { pop, push } from "../navigation";
import type { ScreenHandler, SimEvent, SimulatorState, StepResult } from "../types";

const MAX_OUTPUT = 14;
const Q = String.fromCharCode(39);
const qd = (s: string) => Q + s + Q;

export const tsoCommandScreen: ScreenHandler<{ id: "TSO_COMMAND"; output: string[] }> = {
  help: [
    "Option 6 lets you enter TSO commands without leaving ISPF.",
    `Supported here: LISTCAT LEVEL(hlq), LISTDS ${qd("dsn")} MEMBERS, DELETE ${qd("dsn")},`,
    `RENAME ${qd("old")} ${qd("new")}, TIME, HELP. Quote data set names to use them exactly`,
    "as typed; unquoted names get your userid prefixed, as on a real system.",
  ],
  render(state, frame) {
    const msg = state.message;
    const out = frame.output.slice(-MAX_OUTPUT);
    return {
      title: "ISPF Command Shell",
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Exit" },
      ],
      fields: ["command"],
      focus: "command",
      message: msg,
      rows: [
        titleRow("ISPF Command Shell", msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        [t("Enter TSO or Workstation commands below:", "white")],
        blank,
        commandRow("command", state.fieldValues.command ?? "", "===>", 70),
        blank,
        [t("Place cursor on choice and press enter to Retrieve command", "white")],
        blank,
        ...out.map((line) => padRow(line, "green")),
        ...Array.from({ length: Math.max(0, MAX_OUTPUT - out.length) }, () => blank),
      ],
    };
  },
  onEnter(state, frame, fields) {
    const raw = (fields.command ?? "").trim();
    if (!raw) return { state: { ...state, message: undefined }, events: [] };
    const r = runTsoCommand({ ...state, commandHistory: [...state.commandHistory, raw] }, raw, false, frame.output);
    return { state: r.state, events: [{ type: "COMMAND_ENTERED", screen: "TSO_COMMAND", command: raw }, ...r.events] };
  },
  onPf(state, _frame, key) {
    if (key === 3) return pop(state);
    return null;
  },
};

/** Run a TSO command; from the primary menu (`TSO xxx`) the output opens the shell panel. */
export function runTsoCommand(state: SimulatorState, raw: string, fromMenu: boolean, previous: string[] = []): StepResult {
  const cmd = parseTsoCommand(raw);
  const events: SimEvent[] = [{ type: "TSO_COMMAND_ENTERED", command: raw }];
  let lines: string[] = [];
  let next = state;
  const qualify = (dsn: string) => (dsn.includes(".") || dsn.startsWith(state.userid) ? dsn : `${state.userid}.${dsn}`);
  switch (cmd.kind) {
    case "empty":
      return { state, events: [] };
    case "invalid":
      lines = [cmd.error, "***"];
      break;
    case "listcat": {
      const level = cmd.level || state.userid;
      const ds = searchLevel(state.catalog, level);
      lines = ds.length
        ? ["IN CATALOG:CATALOG.USER", ...ds.map((d) => `NONVSAM ------- ${d.name}`), "***"]
        : [`IDC3012I ENTRY ${level} NOT FOUND`, "***"];
      events.push({ type: "DATASET_SEARCHED", level, results: ds.length });
      break;
    }
    case "listds": {
      const ds = getDataset(state.catalog, qualify(cmd.dsn));
      if (!ds) lines = [qualify(cmd.dsn), "DATA SET NOT FOUND", "***"];
      else {
        lines = [ds.name, "--RECFM-LRECL-BLKSIZE-DSORG", `  ${ds.recfm.padEnd(5)} ${String(ds.lrecl).padEnd(5)} ${String(ds.blksize).padEnd(7)} ${ds.dsorg}`, "--VOLUMES--", `  ${ds.volume}`];
        if (cmd.members && ds.datasetType === "PDS") lines.push("--MEMBERS--", ...listMembers(ds).map((m) => `  ${m.name}`));
        lines.push("***");
      }
      break;
    }
    case "delete": {
      const r = deleteDataset(state.catalog, qualify(cmd.dsn));
      if (r.error) lines = [`IDC3009I ${r.error}`, "***"];
      else {
        next = { ...state, catalog: r.catalog };
        lines = [`IDC0550I ENTRY (A) ${qualify(cmd.dsn)} DELETED`, "***"];
        events.push({ type: "DATASET_DELETED", dsn: qualify(cmd.dsn) });
      }
      break;
    }
    case "rename": {
      const r = renameDataset(state.catalog, qualify(cmd.from), qualify(cmd.to));
      if (r.error) lines = [`IKJ56709I ${r.error}`, "***"];
      else {
        next = { ...state, catalog: r.catalog };
        lines = [`${qualify(cmd.from)} RENAMED TO ${qualify(cmd.to)}`, "***"];
        events.push({ type: "DATASET_RENAMED", from: qualify(cmd.from), to: qualify(cmd.to) });
      }
      break;
    }
    case "time":
      lines = [`IKJ56650I TIME-${state.today} CPU-00:00:01 SERVICE-1234 SESSION-00:05:00`, "***"];
      break;
    case "help":
      lines = [
        "LISTCAT LEVEL(hlq)     - list catalog entries",
        `LISTDS ${qd("dsn")} MEMBERS   - data set attributes`,
        `DELETE ${qd("dsn")}           - delete a data set`,
        `RENAME ${qd("old")} ${qd("new")}     - rename a data set`,
        "TIME                   - show the time",
        "***",
      ];
      break;
    case "ispf":
      lines = ["ISPF IS ALREADY ACTIVE", "***"];
      break;
    case "submit": {
      const ref = parseDsnRef(qualify(cmd.dsn));
      const read: { records?: string[]; error?: string } = ref ? readRecords(state.catalog, ref) : { error: "INVALID DATA SET NAME" };
      if (!ref || read.error) {
        lines = [`IKJ56228I DATA SET ${qualify(cmd.dsn)} NOT IN CATALOG OR CATALOG CAN NOT BE ACCESSED`, "***"];
        break;
      }
      const sub = submitRecords(state, read.records ?? [], ref, "TSO_COMMAND");
      next = { ...sub.state, message: undefined };
      events.push(...sub.events);
      lines = [sub.state.message?.long?.split(".")[0] ?? "SUBMITTED", "***"];
      break;
    }
  }
  const output = [...previous, `> ${raw}`, ...lines];
  const frame = { id: "TSO_COMMAND" as const, output };
  if (fromMenu) {
    const r = push(next, frame);
    return { state: r.state, events: [...events, ...r.events] };
  }
  return { state: { ...next, screen: frame, message: undefined, fieldValues: {}, focusField: undefined }, events };
}
