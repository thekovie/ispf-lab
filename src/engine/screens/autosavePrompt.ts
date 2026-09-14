/**
 * AUTOSAVE OFF PROMPT: the "Save or Cancel changes" panel shown when END is pressed on modified data.
 * Reference: ISPF Edit "AUTOSAVE — Save Data Automatically" (panel ISREDCP). docs/04 §Profile.
 */
import { blank, f, label, padRow, t, titleRow } from "../rows";
import { fail, pop } from "../navigation";
import type { ScreenHandler } from "../types";
import { finishEdit } from "./editor";

export const autosavePromptScreen: ScreenHandler<{ id: "AUTOSAVE_PROMPT" }> = {
  help: [
    "The edit profile has AUTOSAVE OFF PROMPT, so END did not save automatically.",
    "Type 1 to SAVE the changes and end, 2 to CANCEL (discard) and end, or press PF3",
    "to return to the editor. With AUTOSAVE ON this panel never appears.",
  ],
  render(state) {
    const s = state.editor;
    const msg = state.message;
    const name = s ? `${s.dsn}${s.member ? `(${s.member})` : ""}` : "";
    return {
      title: "Edit - Save or Cancel",
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Return to edit" },
      ],
      fields: ["choice"],
      focus: "choice",
      message: msg,
      rows: [
        titleRow("Edit - Save or Cancel Changes", msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        [label("Option ===> "), f("choice", 1, state.fieldValues.choice ?? "")],
        blank,
        [label("Data set . . . : "), t(name, "white")],
        blank,
        padRow("   The data has been modified and AUTOSAVE is OFF (PROMPT).", "white"),
        blank,
        padRow("   1  Save     - Save the changes and end the edit session"),
        padRow("   2  Cancel   - Discard the changes and end the edit session"),
        blank,
        padRow("   Press PF3 to return to the editor without saving or cancelling.", "dim"),
        padRow("   AUTOSAVE ON on the editor command line makes END save automatically.", "dim"),
      ],
    };
  },
  onEnter(state, _frame, fields) {
    const choice = (fields.choice ?? "").trim().toUpperCase();
    if (!state.editor) return pop(state);
    // The prompt sits on top of the editor frame: drop the prompt, then let the editor end itself.
    const back = { ...state, screen: state.stack[state.stack.length - 1], stack: state.stack.slice(0, -1), fieldValues: {} };
    if (choice === "1" || choice === "S" || choice === "SAVE") return finishEdit(back, "save");
    if (choice === "2" || choice === "C" || choice === "CANCEL") return finishEdit(back, "cancel");
    return fail({ ...state, fieldValues: fields }, "ENTER 1 OR 2");
  },
  onPf(state, _frame, key) {
    return key === 3 ? pop(state, { short: "RETURNED TO EDIT", severity: "info" }) : null;
  },
};
