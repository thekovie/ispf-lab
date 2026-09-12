/**
 * 3.2 option A: Allocate New Data Set panel.
 * Reference: docs/03-ispf-behaviour-reference.md §Allocate; Mainframe Master "ISPF Data Set Utility (3.2)".
 */
import { allocate } from "@/catalog/catalog";
import type { Recfm, SpaceUnits } from "@/catalog/types";
import { blank, f, label, t, titleRow } from "../rows";
import { fail, pop } from "../navigation";
import type { ScreenHandler } from "../types";

type Frame = { id: "ALLOCATE_DATASET"; dsn: string };

const RECFMS: Recfm[] = ["FB", "VB", "F", "V", "U"];

export const allocateScreen: ScreenHandler<Frame> = {
  help: [
    "Allocate New Data Set creates a data set with the attributes you type.",
    "Directory blocks > 0 makes a PDS (partitioned, DSORG=PO); 0 makes a",
    "sequential data set (PS). Record format FB + record length 80 is the classic",
    "card-image layout used for JCL and COBOL source. Press Enter to allocate.",
  ],
  render(state, frame) {
    const msg = state.message;
    const v = (id: string, def = "") => state.fieldValues[id] ?? def;
    return {
      title: "Allocate New Data Set",
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Exit" },
      ],
      fields: ["units", "primary", "secondary", "dirblocks", "recfm", "lrecl", "blksize", "dstype", "volume"],
      focus: state.focusField ?? "units",
      message: msg,
      rows: [
        titleRow("Allocate New Data Set", msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        [label("Command ===> "), t("_".repeat(60), "dim")],
        blank,
        [label("Data Set Name  . . : "), t(frame.dsn, "white")],
        blank,
        [label("Management class . . "), t("STANDARD", "green"), t("      (Blank for default management class)", "white")],
        [label("Storage class  . . . "), t("USRDATA ", "green"), t("      (Blank for default storage class)", "white")],
        [label(" Volume serial . . . "), f("volume", 6, v("volume", "USR001")), t("        (Blank for system default volume) **", "white")],
        [label(" Device type . . . . "), t("3390    ", "green"), t("      (Generic unit or device address) **", "white")],
        [label("Data class . . . . . "), t("        ", "green"), t("      (Blank for default data class)", "white")],
        [label(" Space units . . . . "), f("units", 5, v("units", "TRKS")), t("         (BLKS, TRKS, CYLS, KB, MB, BYTES or RECORDS)", "white")],
        [label(" Average record unit "), t("        ", "green"), t("      (M, K, or U)", "white")],
        [label(" Primary quantity  . "), f("primary", 6, v("primary", "5")), t("        (In above units)", "white")],
        [label(" Secondary quantity  "), f("secondary", 6, v("secondary", "2")), t("        (In above units)", "white")],
        [label(" Directory blocks  . "), f("dirblocks", 6, v("dirblocks", "0")), t("        (Zero for sequential data set) *", "white")],
        [label(" Record format . . . "), f("recfm", 4, v("recfm", "FB"))],
        [label(" Record length . . . "), f("lrecl", 5, v("lrecl", "80"))],
        [label(" Block size  . . . . "), f("blksize", 5, v("blksize"))],
        [label(" Data set name type  "), f("dstype", 8, v("dstype")), t("      (LIBRARY, HFS, PDS, LARGE, BASIC, *", "white")],
        [t("                                    EXTREQ, EXTPREF or blank)", "white")],
        [label(" Expiration date . . "), t("        ", "green"), t("      (YY/MM/DD, YYYY/MM/DD", "white")],
        [t("                                    YY.DDD, YYYY.DDD in Julian form", "white")],
        [t("  (* Specify directory blocks or PDS type to create a partitioned data set)", "dim")],
      ],
    };
  },
  onEnter(state, frame, fields) {
    const withFields = { ...state, fieldValues: fields };
    const num = (id: string, def: number) => {
      const raw = (fields[id] ?? "").trim();
      if (raw === "") return def;
      return /^\d+$/.test(raw) ? parseInt(raw, 10) : NaN;
    };
    const units = ((fields.units ?? "TRKS").trim().toUpperCase() || "TRKS") as SpaceUnits;
    if (!["TRKS", "CYLS", "BLKS"].includes(units)) return fail({ ...withFields, focusField: "units" }, "INVALID SPACE UNITS", "Use TRKS, CYLS or BLKS.");
    const primary = num("primary", 5);
    const secondary = num("secondary", 2);
    let dirBlocks = num("dirblocks", 0);
    const lrecl = num("lrecl", 80);
    const blksizeRaw = num("blksize", 0);
    if ([primary, secondary, dirBlocks, lrecl, blksizeRaw].some(Number.isNaN)) return fail(withFields, "NUMERIC VALUE REQUIRED");
    const recfm = ((fields.recfm ?? "FB").trim().toUpperCase() || "FB") as Recfm;
    if (!RECFMS.includes(recfm)) return fail({ ...withFields, focusField: "recfm" }, "INVALID RECORD FORMAT", "Use FB, VB, F, V or U.");
    const dstype = (fields.dstype ?? "").trim().toUpperCase();
    if (dstype === "PDS" || dstype === "LIBRARY") dirBlocks = Math.max(dirBlocks, 10);
    else if (dstype && dstype !== "BASIC" && dstype !== "LARGE") return fail({ ...withFields, focusField: "dstype" }, "INVALID DATA SET NAME TYPE", "Use PDS, LIBRARY or blank.");
    const r = allocate(
      state.catalog,
      { name: frame.dsn, spaceUnits: units, primary, secondary, dirBlocks, recfm, lrecl, blksize: blksizeRaw || undefined, volume: (fields.volume ?? "").trim() || undefined, owner: state.userid },
      state.today,
    );
    if (r.error) return fail(withFields, r.error);
    const type = dirBlocks > 0 ? "PDS" : "PS";
    const p = pop({ ...state, catalog: r.catalog }, { short: "DATA SET ALLOCATED", long: `${frame.dsn} allocated as ${type === "PDS" ? "a partitioned (PO)" : "a sequential (PS)"} data set, ${recfm}/${lrecl}.`, severity: "info" });
    return { state: p.state, events: [{ type: "DATASET_ALLOCATED", dsn: frame.dsn, datasetType: type }, ...p.events] };
  },
  onPf(state, _frame, key) {
    return key === 3 ? pop(state) : null;
  },
};
