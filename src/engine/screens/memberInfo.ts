/**
 * Member list `I`: ISPF statistics for one member (version.mod, created, changed, size, user).
 * Reference: docs/03-ispf-behaviour-reference.md §Member list line commands; IBM ISPF User's Guide Vol I "Member statistics".
 */
import { getMember } from "@/catalog/catalog";
import { blank, label, padRow, t, titleRow } from "../rows";
import { pop } from "../navigation";
import type { ScreenFrame, ScreenHandler } from "../types";

type Frame = Extract<ScreenFrame, { id: "MEMBER_INFO" }>;

const vv = (n?: number) => String(n ?? 1).padStart(2, "0");

export const memberInfoScreen: ScreenHandler<Frame> = {
  help: [
    "ISPF keeps statistics in the PDS directory entry of each member: version and",
    "modification level (VV.MM), creation and last-change dates, current and",
    "initial record counts, and the userid that last changed it (STATS ON in the",
    "edit profile). G on the member list resets them. PF3 returns to the list.",
  ],
  render(state, frame) {
    const m = getMember(state.catalog, frame.dsn, frame.member);
    const msg = state.message;
    const title = "Member Information";
    if (!m) return { title, pfKeys: [{ key: 3, label: "Exit" }], fields: [], message: msg, rows: [titleRow(title, "MEMBER NOT FOUND", "red")] };
    return {
      title,
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Exit" },
      ],
      fields: [],
      message: msg,
      rows: [
        titleRow(title, msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        [label("Command ===> "), t("_".repeat(60), "dim")],
        blank,
        [label("Data Set Name  . . . : "), t(frame.dsn, "white")],
        [label("Member Name  . . . . : "), t(m.name, "white")],
        blank,
        [t("ISPF Statistics", "white", true)],
        [label("  Version.Mod  . . . : "), t(`${vv(m.version)}.${vv(m.mod ?? 0)}`, "green")],
        [label("  Created  . . . . . : "), t(m.createdAt ?? "", "green")],
        [label("  Last changed . . . : "), t(`${m.modifiedAt ?? ""} 00:00`, "green")],
        [label("  Current size . . . : "), t(String(m.records.length), "green"), label("  records")],
        [label("  Initial size . . . : "), t(String(m.records.length), "green"), label("  records")],
        [label("  Modified lines . . : "), t(String(m.mod ?? 0), "green")],
        [label("  Last changed by  . : "), t(m.modifiedBy ?? "", "green")],
        blank,
        padRow("  Statistics are stored in the PDS directory. They are maintained by the ISPF", "dim"),
        padRow("  editor when STATS ON is in effect; other programs may leave them unchanged.", "dim"),
      ],
    };
  },
  onEnter(state) {
    return pop(state);
  },
  onPf(state, _frame, key) {
    return key === 3 ? pop(state) : null;
  },
};
