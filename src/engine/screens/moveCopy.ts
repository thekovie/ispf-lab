/**
 * 3.3 Move/Copy Utility (entry panel: choose C/M, from data set, to data set).
 * Reference: docs/03-ispf-behaviour-reference.md §3.3.
 */
import { copyDataset, copyMember, getDataset, parseDsnRef } from "@/catalog/catalog";
import type { DsnRef } from "@/catalog/types";
import { blank, f, label, padRow, t, titleRow } from "../rows";
import { fail, pop } from "../navigation";
import type { ScreenFrame, ScreenHandler, SimEvent, SimulatorState, StepResult } from "../types";

type Frame = Extract<ScreenFrame, { id: "MOVE_COPY" }>;

export const moveCopyScreen: ScreenHandler<Frame> = {
  help: [
    "3.3 copies (C) or moves (M) a member from one data set to another, or a",
    "whole sequential data set into a member. Type the source as DSN(MEMBER) and",
    "the target data set name; add (NEWNAME) to the target to rename on the way.",
    "Move deletes the source after a successful copy. From DSLIST, CO and MO open",
    "this panel with the option and source filled in; a whole PDS is copied member",
    "by member to the target data set (created when it does not exist).",
  ],
  render(state, frame) {
    const msg = state.message;
    const pre: Record<string, string> = frame.prefill ? { option: frame.prefill.option, from: frame.prefill.from } : {};
    const v = (id: string, def = "") => state.fieldValues[id] ?? pre[id] ?? def;
    return {
      title: "Move/Copy Utility",
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Exit" },
      ],
      fields: ["option", "from", "to"],
      focus: state.focusField ?? (frame.prefill ? "to" : "option"),
      message: msg,
      rows: [
        titleRow("Move/Copy Utility", msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        [label("Option ===> "), f("option", 2, v("option"))],
        blank,
        padRow("   C Copy data set or member(s)        CP Copy and print"),
        padRow("   M Move data set or member(s)        MP Move and print"),
        padRow("   L Copy and LMF lock member(s)       LP Copy, LMF lock, and print"),
        padRow("   P LMF Promote data set or member(s) PP LMF Promote and print"),
        blank,
        padRow("Specify \"From\" Data Set below, then press Enter key", "white"),
        blank,
        [t("From Other Partitioned or Sequential Data Set:", "white", true)],
        [label("   Data Set Name . . . "), f("from", 46, v("from"))],
        [label("   Volume Serial . . . "), t("______", "dim"), t("   (If not cataloged)", "white")],
        blank,
        [t("To Other Partitioned or Sequential Data Set:", "white", true)],
        [label("   Data Set Name . . . "), f("to", 46, v("to"))],
        blank,
        padRow("   Example:  From  USER01.JCL(HELLO)      To  USER01.TEST.JCL", "dim"),
        padRow("   Members are copied with the same name unless the target names a member.", "dim"),
      ],
    };
  },
  onEnter(state, frame, fields) {
    if (frame.prefill) fields = { option: frame.prefill.option, from: frame.prefill.from, ...stripBlank(fields) };
    const option = (fields.option ?? "").trim().toUpperCase();
    const withFields = { ...state, fieldValues: fields };
    if (!["C", "M", "CP", "MP"].includes(option)) return fail({ ...withFields, focusField: "option" }, "INVALID OPTION", "Type C to copy or M to move.");
    const from = parseDsnRef(fields.from ?? "");
    if (!from) return fail({ ...withFields, focusField: "from" }, "INVALID DATA SET NAME", "Example: USER01.JCL(HELLO)");
    const to = parseDsnRef(fields.to ?? "");
    if (!to) return fail({ ...withFields, focusField: "to" }, "INVALID DATA SET NAME", "Example: USER01.TEST.JCL");
    return performCopy(withFields, from, to, option.startsWith("M"));
  },
  onPf(state, _frame, key) {
    return key === 3 ? pop(state) : null;
  },
};

/** Fields the operator left blank fall back to the DSLIST prefill. */
function stripBlank(fields: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v.trim() !== ""));
}

/** Shared by 3.3 and the member-list C/M pop-up. */
export function performCopy(state: SimulatorState, from: DsnRef, to: DsnRef, move: boolean): StepResult {
  const src = getDataset(state.catalog, from.dsn);
  if (!src) return fail(state, "DATA SET NOT CATALOGED", `${from.dsn} does not exist.`);
  const wholeDataset = !from.member && (src.datasetType === "PDS" || !getDataset(state.catalog, to.dsn));
  if (wholeDataset) {
    if (to.member) return fail(state, "INVALID DATA SET NAME", "A whole PDS copies to a data set, not to a member.");
    const r = copyDataset(state.catalog, from.dsn, to.dsn, { today: state.today, userid: state.userid, move });
    if (r.error) return fail(state, r.error);
    const event: SimEvent = move ? { type: "DATASET_MOVED", from: from.dsn, to: to.dsn.toUpperCase() } : { type: "DATASET_COPIED", from: from.dsn, to: to.dsn.toUpperCase() };
    return {
      state: { ...state, catalog: r.catalog, fieldValues: {}, message: { short: move ? "DATA SET MOVED" : "DATA SET COPIED", long: `${from.dsn} ${move ? "moved" : "copied"} to ${to.dsn.toUpperCase()} (${Object.keys(src.members ?? {}).length} member(s)).`, severity: "info" } },
      events: [event],
    };
  }
  const r = copyMember(state.catalog, from, to, { today: state.today, userid: state.userid, move });
  if (r.error) return fail(state, r.error);
  const targetMember = getDataset(state.catalog, to.dsn)?.datasetType === "PDS" ? (to.member ?? from.member) : undefined;
  const event: SimEvent = move ? { type: "MEMBER_MOVED", from, to: { dsn: to.dsn, member: targetMember } } : { type: "MEMBER_COPIED", from, to: { dsn: to.dsn, member: targetMember } };
  const label = `${from.dsn}${from.member ? `(${from.member})` : ""} ${move ? "moved" : "copied"} to ${to.dsn}${targetMember ? `(${targetMember})` : ""}`;
  return {
    state: { ...state, catalog: r.catalog, fieldValues: {}, message: { short: move ? "MEMBER MOVED" : "MEMBER COPIED", long: label, severity: "info" } },
    events: [event],
  };
}
