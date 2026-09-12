/**
 * Member list for a partitioned data set (reached from DSLIST E/B/V/M, option 1/2, or 3.1).
 * Reference: docs/03-ispf-behaviour-reference.md §Member list line commands.
 */
import { getDataset, isValidMemberName, listMembers } from "@/catalog/catalog";
import type { Member } from "@/catalog/types";
import { tokenize } from "@/parsers/editorPrimaryCommand";
import { parseMemberLineCommand } from "@/parsers/listLineCommand";
import { blank, dim, f, label, t, titleRow } from "../rows";
import { fail, pop, push, replace } from "../navigation";
import { openRef } from "../open";
import type { Fields, ListMode, Row, ScreenHandler, SimEvent, SimulatorState, StepResult } from "../types";

const PAGE = 15;
type Frame = { id: "MEMBER_LIST"; dsn: string; mode: ListMode; top: number };
const TITLE: Record<ListMode, string> = { E: "EDIT", B: "BROWSE", V: "VIEW", M: "LIBRARY" };

function rowFor(m: Member, value: string): Row {
  const size = String(m.records.length).padStart(5);
  return [
    f(`cmd:${m.name}`, 1, value),
    t(" "),
    t(m.name.padEnd(8), "white"),
    t("                "),
    t(size, "green"),
    t("  "),
    t((m.createdAt ?? "").padEnd(10), "green"),
    t("  "),
    t((m.modifiedAt ?? "").padEnd(10), "green"),
    t(" 00:00  "),
    t((m.modifiedBy ?? "").padEnd(8), "green"),
  ];
}

export const memberListScreen: ScreenHandler<Frame> = {
  help: [
    "A member list shows the members of one partitioned data set (PDS).",
    "Line commands: E Edit  B Browse  V View  D Delete  R Rename  C Copy  M Move  S Select.",
    "Primary commands: S name (select; in an EDIT list a new name creates a member),",
    "LOCATE name, END. Size is the record count; Changed/ID are ISPF statistics.",
  ],
  render(state, frame) {
    const ds = getDataset(state.catalog, frame.dsn);
    const members = ds ? listMembers(ds) : [];
    const top = Math.min(frame.top, Math.max(0, members.length - 1));
    const page = members.slice(top, top + PAGE);
    const msg = state.message;
    const rows: Row[] = [
      titleRow(`${TITLE[frame.mode].padEnd(10)} ${frame.dsn}`, msg?.short ?? `Row ${members.length ? String(top + 1).padStart(5, "0") : "00000"} of ${String(members.length).padStart(5, "0")}`, msg ? (msg.severity === "error" ? "red" : "yellow") : "white"),
      [label("Command ===> "), f("command", 49, state.fieldValues.command ?? ""), label("  Scroll ===> "), t("PAGE", "green")],
      [t("           Name     Prompt       Size   Created     Changed          ID", "white")],
      ...page.map((m) => rowFor(m, state.fieldValues[`cmd:${m.name}`] ?? "")),
    ];
    if (members.length === 0) rows.push(blank, [dim("  *** No members ***  (in an EDIT list, type S NEWNAME on the command line to create one)")]);
    if (top + PAGE >= members.length) rows.push([dim("**End**")]);
    return {
      title: "Member List",
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Exit" },
        { key: 7, label: "Up" },
        { key: 8, label: "Down" },
      ],
      fields: ["command", ...page.map((m) => `cmd:${m.name}`)],
      focus: state.focusField ?? (page[0] ? `cmd:${page[0].name}` : "command"),
      message: msg,
      rows,
    };
  },
  onEnter(state, frame, fields) {
    for (const [k, v] of Object.entries(fields)) {
      if (k.startsWith("cmd:") && v.trim()) return runLineCommand(state, frame, k.slice(4), v, fields);
    }
    return runPrimary(state, frame, (fields.command ?? "").trim());
  },
  onPf(state, frame, key) {
    if (key === 3) return pop(state);
    const ds = getDataset(state.catalog, frame.dsn);
    const total = ds ? listMembers(ds).length : 0;
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

function defaultMode(frame: Frame): Exclude<ListMode, "M"> {
  return frame.mode === "M" ? "E" : frame.mode;
}

function runLineCommand(state: SimulatorState, frame: Frame, member: string, raw: string, fields: Fields): StepResult {
  const parsed = parseMemberLineCommand(raw);
  const entered: SimEvent = { type: "COMMAND_ENTERED", screen: "MEMBER_LIST", command: `${raw.trim().toUpperCase()} ${frame.dsn}(${member})` };
  if (!parsed || !parsed.ok) {
    const r = fail({ ...state, fieldValues: fields, focusField: `cmd:${member}` }, "INVALID LINE COMMAND", `"${raw.trim()}" is not a member-list line command. Use E, B, V, D, R, C, M or S.`);
    return { state: r.state, events: [entered, ...r.events] };
  }
  const ds = getDataset(state.catalog, frame.dsn);
  const ref = { dsn: frame.dsn, member };
  let r: StepResult;
  switch (parsed.cmd) {
    case "E":
    case "B":
    case "V":
      r = openRef(state, ref, parsed.cmd);
      break;
    case "S":
      r = openRef(state, ref, defaultMode(frame));
      break;
    case "D":
      r = ds?.readOnly ? fail(state, "DATA SET IS READ ONLY") : push(state, { id: "CONFIRM_DELETE", target: ref });
      break;
    case "R":
      r = ds?.readOnly ? fail(state, "DATA SET IS READ ONLY") : push(state, { id: "RENAME", target: ref });
      break;
    case "C":
      r = push(state, { id: "COPY_MOVE", from: ref, move: false });
      break;
    case "M":
      r = ds?.readOnly ? fail(state, "DATA SET IS READ ONLY") : push(state, { id: "COPY_MOVE", from: ref, move: true });
      break;
    default:
      r = fail(state, "INVALID LINE COMMAND");
  }
  return { state: r.state, events: [entered, ...r.events] };
}

function runPrimary(state: SimulatorState, frame: Frame, raw: string): StepResult {
  if (!raw) return { state: { ...state, message: undefined, fieldValues: {} }, events: [] };
  const entered: SimEvent = { type: "COMMAND_ENTERED", screen: "MEMBER_LIST", command: raw };
  const tokens = tokenize(raw);
  const verb = tokens[0].toUpperCase();
  const arg = (tokens[1] ?? "").toUpperCase();
  let r: StepResult;
  const selectWith = (mode: Exclude<ListMode, "M">) => {
    if (!arg) return fail({ ...state, fieldValues: { command: raw } }, "MEMBER NAME REQUIRED", "Example: S NEWMEM");
    if (!isValidMemberName(arg)) return fail({ ...state, fieldValues: { command: raw } }, "INVALID MEMBER NAME", "1-8 characters, starting with a letter, #, $ or @.");
    return openRef(state, { dsn: frame.dsn, member: arg }, mode);
  };
  switch (verb) {
    case "S":
    case "SELECT":
      r = selectWith(defaultMode(frame));
      break;
    case "E":
    case "EDIT":
      r = selectWith("E");
      break;
    case "B":
    case "BROWSE":
      r = selectWith("B");
      break;
    case "V":
    case "VIEW":
      r = selectWith("V");
      break;
    case "L":
    case "LOCATE": {
      const ds = getDataset(state.catalog, frame.dsn);
      const idx = ds ? listMembers(ds).findIndex((m) => m.name.startsWith(arg)) : -1;
      r = idx < 0 ? fail(state, "MEMBER NOT FOUND") : replace(state, { ...frame, top: idx });
      break;
    }
    case "END":
    case "EXIT":
      r = pop(state);
      break;
    case "HELP":
      r = push(state, { id: "HELP", topic: "MEMBER_LIST" });
      break;
    case "EXPLAIN":
      r = { state: { ...state, fieldValues: {} }, events: [{ type: "EXPLAIN_REQUESTED", term: tokens.slice(1).join(" ") }] };
      break;
    default:
      r = fail({ ...state, fieldValues: { command: raw } }, "COMMAND NOT RECOGNIZED", "Member list commands: S name, E name, B name, V name, LOCATE name, END.");
  }
  return { state: r.state, events: [entered, ...r.events] };
}
