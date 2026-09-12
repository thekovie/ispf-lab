/**
 * Small confirmation / prompt panels: CONFIRM_DELETE, RENAME, COPY_MOVE (member-list pop-up), MESSAGE.
 * Reference: docs/03-ispf-behaviour-reference.md §Confirmations.
 */
import { deleteDataset, deleteMember, getDataset, isValidDsname, isValidMemberName, parseDsnRef, renameDataset, renameMember } from "@/catalog/catalog";
import type { DsnRef } from "@/catalog/types";
import { blank, f, label, padRow, t, titleRow } from "../rows";
import { fail, pop } from "../navigation";
import type { ScreenHandler, SimEvent } from "../types";
import { performCopy } from "./moveCopy";

const refLabel = (r: DsnRef) => `${r.dsn}${r.member ? `(${r.member})` : ""}`;

export const confirmDeleteScreen: ScreenHandler<{ id: "CONFIRM_DELETE"; target: DsnRef }> = {
  help: [
    "ISPF asks for confirmation before deleting. Type Y (or leave the default)",
    "and press Enter to delete; PF3 or N cancels and returns to the list.",
  ],
  render(state, frame) {
    const msg = state.message;
    const isMember = !!frame.target.member;
    const title = isMember ? "Confirm Member Delete" : "Confirm Delete";
    return {
      title,
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Cancel" },
      ],
      fields: ["confirm"],
      focus: "confirm",
      message: msg,
      rows: [
        titleRow(title, msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        [label("Command ===> "), t("_".repeat(60), "dim")],
        blank,
        [label(isMember ? "Member Name  . . . : " : "Data Set Name  . . : "), t(refLabel(frame.target), "white")],
        ...(isMember ? [[label("Data Set Name  . . : "), t(frame.target.dsn, "white")]] : []),
        blank,
        padRow("Instructions:", "white"),
        padRow("   Press ENTER key to confirm delete request."),
        padRow("   (The data set or member will be deleted)"),
        blank,
        padRow("   Enter END or CANCEL command (PF3) to cancel delete request."),
        blank,
        [label("Confirm delete (Y/N) ===> "), f("confirm", 1, state.fieldValues.confirm ?? "Y")],
      ],
    };
  },
  onEnter(state, frame, fields) {
    const answer = (fields.confirm ?? "Y").trim().toUpperCase() || "Y";
    if (answer === "N") return pop(state, { short: "DELETE CANCELLED", severity: "info" });
    if (answer !== "Y") return fail({ ...state, fieldValues: fields }, "ENTER Y OR N");
    const { dsn, member } = frame.target;
    const r = member ? deleteMember(state.catalog, dsn, member) : deleteDataset(state.catalog, dsn);
    if (r.error) return fail(state, r.error);
    const event: SimEvent = member ? { type: "MEMBER_DELETED", dsn, member } : { type: "DATASET_DELETED", dsn };
    const p = pop({ ...state, catalog: r.catalog }, { short: member ? "MEMBER DELETED" : "DATA SET DELETED", long: `${refLabel(frame.target)} was deleted.`, severity: "info" });
    // If we deleted the data set whose member list / DSLIST we came from, that screen re-renders from the catalog.
    return { state: p.state, events: [event, ...p.events] };
  },
  onPf(state, _frame, key) {
    return key === 3 || key === 12 ? pop(state, { short: "DELETE CANCELLED", severity: "info" }) : null;
  },
};

export const renameScreen: ScreenHandler<{ id: "RENAME"; target: DsnRef }> = {
  help: [
    "Type the new name and press Enter. Member names are 1-8 characters;",
    "data set names are qualifiers of 1-8 characters separated by periods.",
    "PF3 cancels without renaming.",
  ],
  render(state, frame) {
    const msg = state.message;
    const isMember = !!frame.target.member;
    const title = isMember ? "Rename Member" : "Rename Data Set";
    return {
      title,
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Cancel" },
      ],
      fields: ["newname"],
      focus: "newname",
      message: msg,
      rows: [
        titleRow(title, msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        [label("Command ===> "), t("_".repeat(60), "dim")],
        blank,
        [label(isMember ? "Member Name  . . . : " : "Data Set Name  . . : "), t(refLabel(frame.target), "white")],
        ...(isMember ? [[label("Data Set Name  . . : "), t(frame.target.dsn, "white")]] : []),
        blank,
        [t("Enter new name below:", "white")],
        blank,
        [label("   New Name  . . . . "), f("newname", isMember ? 8 : 44, state.fieldValues.newname ?? "")],
        blank,
        padRow("   Press ENTER to rename, PF3 to cancel.", "dim"),
      ],
    };
  },
  onEnter(state, frame, fields) {
    const newName = (fields.newname ?? "").trim().toUpperCase();
    const { dsn, member } = frame.target;
    if (!newName) return fail({ ...state, fieldValues: fields }, "ENTER NEW NAME");
    if (member) {
      if (!isValidMemberName(newName)) return fail({ ...state, fieldValues: fields }, "INVALID MEMBER NAME", "1-8 characters, starting with a letter, #, $ or @.");
      const r = renameMember(state.catalog, dsn, member, newName);
      if (r.error) return fail({ ...state, fieldValues: fields }, r.error);
      const p = pop({ ...state, catalog: r.catalog }, { short: "MEMBER RENAMED", long: `${dsn}(${member}) is now ${dsn}(${newName}).`, severity: "info" });
      return { state: p.state, events: [{ type: "MEMBER_RENAMED", dsn, from: member, to: newName }, ...p.events] };
    }
    if (!isValidDsname(newName)) return fail({ ...state, fieldValues: fields }, "INVALID DATA SET NAME");
    const r = renameDataset(state.catalog, dsn, newName);
    if (r.error) return fail({ ...state, fieldValues: fields }, r.error);
    const p = pop({ ...state, catalog: r.catalog }, { short: "DATA SET RENAMED", long: `${dsn} is now ${newName}.`, severity: "info" });
    return { state: p.state, events: [{ type: "DATASET_RENAMED", from: dsn, to: newName }, ...p.events] };
  },
  onPf(state, _frame, key) {
    return key === 3 || key === 12 ? pop(state, { short: "RENAME CANCELLED", severity: "info" }) : null;
  },
};

export const copyMovePopupScreen: ScreenHandler<{ id: "COPY_MOVE"; from: DsnRef; move: boolean }> = {
  help: [
    "Type the target data set (and optionally a new member name in parentheses)",
    "and press Enter. Copy keeps the source member; Move deletes it afterwards.",
  ],
  render(state, frame) {
    const msg = state.message;
    const title = frame.move ? "Move Entry Panel" : "Copy Entry Panel";
    const ds = getDataset(state.catalog, frame.from.dsn);
    return {
      title,
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Cancel" },
      ],
      fields: ["to"],
      focus: "to",
      message: msg,
      rows: [
        titleRow(title, msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        [label("Command ===> "), t("_".repeat(60), "dim")],
        blank,
        [label(`${frame.move ? "Move" : "Copy"} from data set . : `), t(refLabel(frame.from), "white")],
        [label("Record format . . . : "), t(ds ? `${ds.recfm}  LRECL ${ds.lrecl}` : "", "green")],
        blank,
        [t("To Other Partitioned or Sequential Data Set:", "white", true)],
        [label("   Data Set Name . . . "), f("to", 46, state.fieldValues.to ?? "")],
        blank,
        padRow("   Example: USER01.TEST.JCL          or   USER01.TEST.JCL(NEWNAME)", "dim"),
        padRow(`   ${frame.move ? "The source member is deleted after a successful move." : "The source member is kept."}`, "dim"),
      ],
    };
  },
  onEnter(state, frame, fields) {
    const to = parseDsnRef(fields.to ?? "");
    if (!to) return fail({ ...state, fieldValues: fields }, "INVALID DATA SET NAME", "Example: USER01.TEST.JCL");
    const r = performCopy(state, frame.from, to, frame.move);
    if (r.state.message?.severity === "error") return { ...r, state: { ...r.state, fieldValues: fields } };
    const p = pop(r.state, r.state.message);
    return { state: p.state, events: [...r.events, ...p.events] };
  },
  onPf(state, _frame, key) {
    return key === 3 || key === 12 ? pop(state, { short: "CANCELLED", severity: "info" }) : null;
  },
};

export const messageScreen: ScreenHandler<{ id: "MESSAGE"; title: string; lines: string[] }> = {
  help: ["Press Enter or PF3 to continue."],
  render(state, frame) {
    return {
      title: frame.title,
      pfKeys: [{ key: 3, label: "Exit" }],
      fields: [],
      message: state.message,
      rows: [titleRow(frame.title), blank, ...frame.lines.map((l) => padRow(l)), blank, padRow("Press Enter to continue.", "dim")],
    };
  },
  onEnter(state) {
    return pop(state);
  },
  onPf(state, _frame, key) {
    return key === 3 ? pop(state) : null;
  },
};
