/**
 * ISPF Primary Option Menu. Reference: docs/03-ispf-behaviour-reference.md §Primary Option Menu;
 * IBM Redbook SG24-6366 §4.4 "ISPF overview".
 */
import { parseOptionCommand } from "@/parsers/optionCommand";
import { blank, menuRow, optionRow, padRow, t, titleRow } from "../rows";
import { fail, openPath, push } from "../navigation";
import type { ScreenHandler, SimEvent, StepResult, SimulatorState } from "../types";
import { runTsoCommand } from "./tsoCommand";
import { allSessions, closeScreen } from "../splitScreen";

const MENU: [string, string, string][] = [
  ["0", "Settings", "Terminal and user parameters"],
  ["1", "View", "Display source data or listings"],
  ["2", "Edit", "Create or change source data"],
  ["3", "Utilities", "Perform utility functions"],
  ["4", "Foreground", "Interactive language processing"],
  ["5", "Batch", "Submit job for language processing"],
  ["6", "Command", "Enter TSO or Workstation commands"],
  ["7", "Dialog Test", "Perform dialog testing"],
  ["9", "IBM Products", "IBM program development products"],
  ["10", "SCLM", "SW Configuration Library Manager"],
  ["11", "Workplace", "ISPF Object/Action Workplace"],
];

export const primaryMenuScreen: ScreenHandler<{ id: "PRIMARY_OPTION_MENU" }> = {
  help: [
    "The Primary Option Menu is the home panel of ISPF.",
    "Type an option number on the Option ===> line and press Enter.",
    "You can chain options: 3.4 opens Utilities (3) then Data Set List (4).",
    "=3.4 jumps there from any panel. PF3 (End) returns to the previous panel.",
    "X or PF3 here logs you off.",
  ],
  render(state) {
    const msg = state.message;
    return {
      title: "ISPF Primary Option Menu",
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Exit" },
      ],
      fields: ["option"],
      focus: "option",
      message: msg,
      rows: [
        titleRow("ISPF Primary Option Menu", msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        optionRow("option", state.fieldValues.option ?? ""),
        blank,
        ...MENU.map(([o, n, d]) => menuRow(o, n, d)),
        blank,
        [t("      Enter X to Terminate using log/list defaults", "white")],
        blank,
        [t("  User ID . : ", "cyan"), t(state.userid.padEnd(8), "white"), t("     Time. . . : ", "cyan"), t("--:--", "white"), t("      Terminal. : 3278", "white")],
        [t("  Release . : ", "cyan"), t("ISPF LAB", "white"), t("     Applid. . : ", "cyan"), t("ISR", "white"), t(`        Screen. . : ${state.activeScreen + 1}${allSessions(state).length > 1 ? ` of ${allSessions(state).length}` : ""}`, "white")],
        blank,
        padRow("  Educational ISPF training simulator. Not affiliated with or endorsed by IBM.", "dim"),
      ],
    };
  },
  onEnter(state, _frame, fields) {
    const raw = fields.option ?? "";
    const cmd = parseOptionCommand(raw);
    const entered: SimEvent[] = raw.trim() ? [{ type: "COMMAND_ENTERED", screen: "PRIMARY_OPTION_MENU", command: raw.trim() }] : [];
    const withHistory: SimulatorState = raw.trim() ? { ...state, commandHistory: [...state.commandHistory, raw.trim()] } : state;
    let r: StepResult;
    switch (cmd.kind) {
      case "empty":
        r = { state: { ...withHistory, message: undefined }, events: [] };
        break;
      case "path":
        r = openPath(withHistory, cmd.path, "PRIMARY_OPTION_MENU");
        break;
      case "exit":
        r = logoff(withHistory);
        break;
      case "help":
        r = push(withHistory, { id: "HELP", topic: "PRIMARY_OPTION_MENU" });
        break;
      case "tso":
        r = runTsoCommand(withHistory, cmd.command, true);
        break;
      case "explain":
        r = { state: { ...withHistory, fieldValues: {} }, events: [{ type: "EXPLAIN_REQUESTED", term: cmd.term }] };
        break;
      default:
        r = fail({ ...withHistory, fieldValues: { option: raw } }, "INVALID OPTION", `"${raw.trim()}" is not an option on this panel. Try 3.4 to reach the Data Set List Utility.`);
    }
    return { state: r.state, events: [...entered, ...r.events] };
  },
  onPf(state, _frame, key) {
    if (key === 3) return logoff(state);
    return null;
  },
};

/** X / PF3 on the Primary Option Menu: end this logical screen if others are open, otherwise log off. */
export function logoff(state: SimulatorState): StepResult {
  const closed = closeScreen(state);
  if (closed) return closed;
  return {
    state: { ...state, loggedIn: false, screens: [], activeScreen: 0, screen: { id: "LOGIN" }, stack: [], editor: undefined, message: undefined, fieldValues: {}, focusField: undefined },
    events: [{ type: "LOGGED_OFF" }, { type: "SCREEN_OPENED", screen: "LOGIN", frame: { id: "LOGIN" } }],
  };
}
