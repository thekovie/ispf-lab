/**
 * 3.3 Move/Copy Utility (entry panel: choose C/M, from data set, to data set).
 * Reference: docs/03-ispf-behaviour-reference.md §3.3.
 */
import { copyMember, getDataset, parseDsnRef } from "@/catalog/catalog";
import type { DsnRef } from "@/catalog/types";
import { blank, f, label, padRow, t, titleRow } from "../rows";
import { fail, pop } from "../navigation";
import type { ScreenHandler, SimEvent, SimulatorState, StepResult } from "../types";

export const moveCopyScreen: ScreenHandler<{ id: "MOVE_COPY" }> = {
  help: [
    "3.3 copies (C) or moves (M) a member from one data set to another, or a",
    "whole sequential data set into a member. Type the source as DSN(MEMBER) and",
    "the target data set name; add (NEWNAME) to the target to rename on the way.",
    "Move deletes the source after a successful copy.",
  ],
  render(state) {
    const msg = state.message;
    const v = (id: string, def = "") => state.fieldValues[id] ?? def;
    return {
      title: "Move/Copy Utility",
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Exit" },
      ],
      fields: ["option", "from", "to"],
      focus: state.focusField ?? "option",
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
  onEnter(state, _frame, fields) {
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

/** Shared by 3.3 and the member-list C/M pop-up. */
export function performCopy(state: SimulatorState, from: DsnRef, to: DsnRef, move: boolean): StepResult {
  const src = getDataset(state.catalog, from.dsn);
  if (!src) return fail(state, "DATA SET NOT CATALOGED", `${from.dsn} does not exist.`);
  if (src.datasetType === "PDS" && !from.member) return fail(state, "MEMBER NAME REQUIRED", "Copying a whole PDS is not supported here; name a member, e.g. DSN(MEMBER).");
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
