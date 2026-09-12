/**
 * Options 1 (View) and 2 (Edit): the Entry Panel with ISPF Library fields and "Other Data Set Name".
 * Reference: docs/03-ispf-behaviour-reference.md §Edit/View Entry.
 */
import { parseDsnRef } from "@/catalog/catalog";
import { blank, f, label, t, titleRow } from "../rows";
import { fail, pop } from "../navigation";
import { openRef } from "../open";
import type { ScreenHandler } from "../types";

type Frame = { id: "EDIT_ENTRY"; mode: "EDIT" | "VIEW" };

export const editEntryScreen: ScreenHandler<Frame> = {
  help: [
    "The Edit/View Entry Panel opens a data set by name. Either fill the ISPF",
    "Library fields (Project.Group.Type and optionally Member) or type a full",
    "name in Other Data Set Name, e.g. USER01.JCL(HELLO). Quotes are optional here.",
    "Leaving Member blank on a PDS shows its member list. In Edit, a member that",
    "does not exist is created when you SAVE.",
  ],
  render(state, frame) {
    const msg = state.message;
    const v = (id: string, def = "") => state.fieldValues[id] ?? def;
    const title = frame.mode === "EDIT" ? "Edit Entry Panel" : "View Entry Panel";
    return {
      title,
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Exit" },
      ],
      fields: ["project", "group", "type", "member", "other"],
      focus: state.focusField ?? "other",
      message: msg,
      rows: [
        titleRow(title, msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        [label("Command ===> "), t("_".repeat(60), "dim")],
        blank,
        [t("ISPF Library:", "white", true)],
        [label("   Project . . . "), f("project", 8, v("project", state.userid))],
        [label("   Group . . . . "), f("group", 8, v("group")), t("  . . . ", "cyan"), t("________", "dim"), t("  . . . ", "cyan"), t("________", "dim")],
        [label("   Type  . . . . "), f("type", 8, v("type"))],
        [label("   Member  . . . "), f("member", 8, v("member")), t("   (Blank or pattern for member selection list)", "white")],
        blank,
        [t("Other Partitioned, Sequential or VSAM Data Set:", "white", true)],
        [label("   Data Set Name . . . "), f("other", 46, v("other"))],
        [label("   Volume Serial . . . "), t("______", "dim"), t("   (If not cataloged)", "white")],
        blank,
        [t("Workstation File:", "white", true)],
        [label("   File Name . . . . . "), t("_".repeat(46), "dim")],
        blank,
        [t("Options", "white", true)],
        [t("   Initial Macro  . . . ________       Confirm Cancel/Move/Replace", "white")],
        [t("   Profile Name . . . . ________       Mixed Mode", "white")],
        [t("   Format Name  . . . . ________       Edit on Workstation", "white")],
        [t("   Data Set Password  . ________       Preserve VB record length", "white")],
      ],
    };
  },
  onEnter(state, frame, fields) {
    const other = (fields.other ?? "").trim();
    const project = (fields.project ?? "").trim();
    const group = (fields.group ?? "").trim();
    const type = (fields.type ?? "").trim();
    const member = (fields.member ?? "").trim();
    let raw = other;
    if (!raw) {
      if (!project || !group || !type) {
        return fail({ ...state, fieldValues: fields, focusField: "other" }, "ENTER DATA SET NAME", "Fill Project/Group/Type or type a full name in Other Data Set Name.");
      }
      raw = `${project}.${group}.${type}${member ? `(${member})` : ""}`;
    } else if (member && !raw.includes("(")) {
      raw = `${raw}(${member})`;
    }
    const ref = parseDsnRef(raw);
    if (!ref) return fail({ ...state, fieldValues: fields, focusField: "other" }, "INVALID DATA SET NAME", "Qualifiers are 1-8 characters separated by periods; member names go in parentheses.");
    const r = openRef({ ...state, fieldValues: fields }, ref, frame.mode === "EDIT" ? "E" : "V");
    if (r.state.message?.severity === "error") return { ...r, state: { ...r.state, fieldValues: fields } };
    return { state: r.state, events: [{ type: "COMMAND_ENTERED", screen: "EDIT_ENTRY", command: raw.toUpperCase() }, ...r.events] };
  },
  onPf(state, _frame, key) {
    if (key === 3) return pop(state);
    return null;
  },
};
