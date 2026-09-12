/**
 * Option 3: Utility Selection Panel. Reference: docs/03-ispf-behaviour-reference.md §Utilities.
 */
import { parseOptionCommand } from "@/parsers/optionCommand";
import { blank, menuRow, optionRow, padRow, titleRow } from "../rows";
import { fail, openPath, pop, push } from "../navigation";
import type { Row, ScreenHandler, SimEvent, StepResult } from "../types";

const MENU: [string, string, string][] = [
  ["1", "Library", "Compress or print data set. Print index listing. Print, rename, delete, browse, edit or view members"],
  ["2", "Data Set", "Allocate, rename, delete, catalog, uncatalog, or display information of an entire data set"],
  ["3", "Move/Copy", "Move, or copy members or data sets"],
  ["4", "Dslist", "Print or display (to process) list of data set names. Print or display VTOC information"],
  ["5", "Reset", "Reset statistics for members of ISPF library"],
  ["6", "Hardcopy", "Initiate hardcopy output"],
  ["8", "Outlist", "Display, delete, or print held job output"],
  ["9", "Commands", "Create/change an application command table"],
  ["12", "SuperC", "Compare data sets"],
  ["14", "Search-For", "Search data sets for strings of data"],
];

function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    if ((line + " " + w).trim().length > width) {
      lines.push(line.trim());
      line = w;
    } else line = line + " " + w;
  }
  lines.push(line.trim());
  return lines;
}

export const utilitiesScreen: ScreenHandler<{ id: "UTILITY_SELECTION" }> = {
  help: [
    "Utilities (option 3) groups the data-set management tools.",
    "3.1 Library: work with members of one PDS. 3.2 Data Set: allocate, rename,",
    "delete a data set. 3.3 Move/Copy: copy members between data sets.",
    "3.4 Dslist: the most-used panel - list data sets by name and act on them.",
  ],
  render(state) {
    const msg = state.message;
    const rows: Row[] = [
      titleRow("Utility Selection Panel", msg?.short, msg?.severity === "error" ? "red" : "yellow"),
      optionRow("option", state.fieldValues.option ?? ""),
      blank,
    ];
    for (const [o, n, d] of MENU) {
      const lines = wrap(d, 60);
      rows.push(menuRow(o, n, lines[0]));
      for (const extra of lines.slice(1)) rows.push(padRow("                 " + extra));
    }
    return {
      title: "Utility Selection Panel",
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Exit" },
      ],
      fields: ["option"],
      focus: "option",
      message: msg,
      rows,
    };
  },
  onEnter(state, _frame, fields) {
    const raw = (fields.option ?? "").trim();
    const cmd = parseOptionCommand(raw);
    const entered: SimEvent[] = raw ? [{ type: "COMMAND_ENTERED", screen: "UTILITY_SELECTION", command: raw }] : [];
    let r: StepResult;
    switch (cmd.kind) {
      case "empty":
        r = { state: { ...state, message: undefined }, events: [] };
        break;
      case "path":
        r = cmd.jump
          ? openPath({ ...state, stack: [], screen: { id: "PRIMARY_OPTION_MENU" } }, cmd.path, "UTILITY_SELECTION")
          : openPath(state, ["3", ...cmd.path], "UTILITY_SELECTION");
        break;
      case "exit":
        r = pop(state);
        break;
      case "help":
        r = push(state, { id: "HELP", topic: "UTILITY_SELECTION" });
        break;
      case "explain":
        r = { state: { ...state, fieldValues: {} }, events: [{ type: "EXPLAIN_REQUESTED", term: cmd.term }] };
        break;
      default:
        r = fail({ ...state, fieldValues: { option: raw } }, "INVALID OPTION", "Type 4 to open the Data Set List Utility (DSLIST).");
    }
    return { state: r.state, events: [...entered, ...r.events] };
  },
  onPf(state, _frame, key) {
    if (key === 3) return pop(state);
    return null;
  },
};
