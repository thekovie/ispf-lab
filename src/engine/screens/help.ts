/**
 * PF1 Help: shows the help text declared by the screen the user came from
 * (the same idea as the ISPF tutorial reached with PF1).
 */
import { blank, padRow, titleRow } from "../rows";
import { pop } from "../navigation";
import type { ScreenHandler, ScreenId } from "../types";
import { getHandler } from "../registry";

const GENERAL = [
  "Keyboard summary:",
  "  Enter      process what you typed on this panel",
  "  Tab        move to the next input field (Shift+Tab: previous)",
  "  PF1        help for the current panel        PF3   end / return",
  "  PF7 / PF8  scroll backward / forward          PF10 / PF11  scroll left / right",
  "  PF12       cancel (where offered)",
  "",
  "Type EXPLAIN <term> on any command line (e.g. EXPLAIN PDS) for a glossary entry.",
];

export const helpScreen: ScreenHandler<{ id: "HELP"; topic: ScreenId }> = {
  help: ["You are already in help. Press PF3 to return."],
  render(_state, frame) {
    const topicHelp = getHandler(frame.topic)?.help ?? [];
    return {
      title: "Help",
      pfKeys: [{ key: 3, label: "Exit" }],
      fields: [],
      rows: [
        titleRow(`Help - ${frame.topic.replace(/_/g, " ")}`),
        blank,
        ...topicHelp.map((l) => padRow(l, "white")),
        blank,
        ...GENERAL.map((l) => padRow(l, "cyan")),
        blank,
        padRow("Press PF3 (End) to return to the panel.", "dim"),
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
