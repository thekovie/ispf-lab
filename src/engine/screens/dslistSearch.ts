/**
 * Option 3.4: Data Set List Utility entry panel. Reference: docs/03-ispf-behaviour-reference.md §DSLIST.
 */
import { searchLevel } from "@/catalog/catalog";
import { blank, f, label, optionRow, t, titleRow } from "../rows";
import { fail, pop, push } from "../navigation";
import type { ScreenHandler, SimEvent, SimulatorState, StepResult } from "../types";

export const dslistSearchScreen: ScreenHandler<{ id: "DSLIST_SEARCH" }> = {
  help: [
    "The Data Set List Utility (3.4) lists data sets whose names start with the",
    "Dsname Level you type. A level is one or more qualifiers: USER01 lists all",
    "of your data sets; USER01.JCL narrows it; * is a wildcard inside a qualifier.",
    "Press Enter with the Option field blank to display the list.",
  ],
  render(state) {
    const msg = state.message;
    const v = (id: string, def = "") => state.fieldValues[id] ?? def;
    return {
      title: "Data Set List Utility",
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Exit" },
      ],
      fields: ["option", "level", "volume"],
      focus: state.focusField ?? "level",
      message: msg,
      rows: [
        titleRow("Data Set List Utility", msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        optionRow("option", v("option")),
        blank,
        [t("   blank Display data set list       P Print data set list", "white")],
        [t("      V Display VTOC information     PV Print VTOC information", "white")],
        blank,
        [t("Enter one or both of the parameters below:", "white", true)],
        [label("   Dsname Level . . . "), f("level", 44, v("level", state.userid))],
        [label("   Volume serial  . . "), f("volume", 6, v("volume"))],
        blank,
        [t("Data set list options", "white", true)],
        [label("   Initial View . . . "), t("1", "green"), t("  1. Volume    ", "white"), t("   Enter \"/\" to select option", "white")],
        [t("                         2. Space     ", "white"), t("   /  Confirm Data Set Delete", "white")],
        [t("                         3. Attrib    ", "white"), t("   /  Confirm Member Delete", "white")],
        [t("                         4. Total     ", "white"), t("      Include Additional Qualifiers", "white")],
        blank,
        [t("When the data set list is displayed, enter either:", "white")],
        [t("  \"/\" on the data set list command field for the command prompt pop-up,", "white")],
        [t("  an ISPF line command, the name of a TSO command, CLIST, or REXX exec, or", "white")],
        [t("  \"=\" to execute the previous command.", "white")],
      ],
    };
  },
  onEnter(state, _frame, fields) {
    const option = (fields.option ?? "").trim().toUpperCase();
    if (option && option !== "V") return fail({ ...state, fieldValues: fields }, "OPTION NOT SUPPORTED", "Only the blank option (display list) is implemented.");
    return runSearch(state, fields.level ?? "");
  },
  onPf(state, _frame, key) {
    if (key === 3) return pop(state);
    return null;
  },
};

export function runSearch(state: SimulatorState, levelRaw: string): StepResult {
  const level = levelRaw.trim().toUpperCase();
  if (!level) return fail({ ...state, focusField: "level" }, "ENTER DSNAME LEVEL", "Type a high-level qualifier such as your userid.");
  const results = searchLevel(state.catalog, level);
  const searched: SimEvent = { type: "DATASET_SEARCHED", level, results: results.length };
  if (results.length === 0) {
    const r = fail({ ...state, fieldValues: { level } }, "NO DATA SETS MATCH LEVEL", `No catalog entries start with ${level}.`);
    return { state: r.state, events: [searched, ...r.events] };
  }
  const r = push(state, { id: "DSLIST_RESULTS", level, top: 0 }, [searched]);
  return r;
}
