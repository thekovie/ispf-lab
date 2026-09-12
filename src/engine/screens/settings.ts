/**
 * Option 0: ISPF Settings (a small, honest subset). Reference: docs/03-ispf-behaviour-reference.md §Settings.
 */
import type { Settings } from "@/persistence/settingsStore";
import { blank, f, label, t, titleRow } from "../rows";
import { fail, pop } from "../navigation";
import type { Fields, ScreenHandler, SimEvent, SimulatorState, StepResult } from "../types";

export const settingsScreen: ScreenHandler<{ id: "SETTINGS" }> = {
  help: [
    "Option 0 sets terminal and user parameters. Type over a value and press",
    "Enter; PF3 saves and returns. Only settings the simulator honours are shown:",
    "PF key display, default Insert mode in the editor, default Scroll amount.",
  ],
  render(state) {
    const s = state.settings;
    const v = (id: string, def: string) => state.fieldValues[id] ?? def;
    const msg = state.message;
    return {
      title: "ISPF Settings",
      pfKeys: [
        { key: 1, label: "Help" },
        { key: 3, label: "Exit" },
      ],
      fields: ["pfkeys", "insert", "scroll"],
      focus: "pfkeys",
      message: msg,
      rows: [
        titleRow("ISPF Settings", msg?.short, msg?.severity === "error" ? "red" : "yellow"),
        [label("Command ===> "), t("_".repeat(60), "dim")],
        blank,
        [t("Options", "white", true), t("                                   Print Graphics", "white", true)],
        [label("   Show PF keys (Y/N) . . . "), f("pfkeys", 1, v("pfkeys", s.pfKeysShown ? "Y" : "N")), t("               Family printer type 2", "white")],
        [label("   Insert mode default (Y/N) "), f("insert", 1, v("insert", s.insertMode ? "Y" : "N")), t("               Device name . . . .", "white")],
        [label("   Default scroll amount  . . "), f("scroll", 4, v("scroll", s.scrollDefault)), t("            Aspect ratio  . . 0", "white")],
        blank,
        [t("   Scroll amount: PAGE, HALF, CSR, DATA or a number of lines.", "dim")],
        blank,
        [t("Terminal Characteristics", "white", true)],
        [t("   Screen format  . . 1  1. Data      2. Std       3. Max      4. Part", "white")],
        [t("   Terminal Type  . . 3  1. 3277      2. 3277A     3. 3278     4. 3278A", "white")],
        blank,
        [t("   Press PF3 (End) to keep your changes and return.", "dim")],
      ],
    };
  },
  onEnter(state, _frame, fields) {
    return apply(state, fields);
  },
  onPf(state, _frame, key, fields) {
    if (key !== 3) return null;
    const r = apply(state, fields);
    if (r.state.message?.severity === "error") return r;
    const p = pop(r.state);
    return { state: p.state, events: [...r.events, ...p.events] };
  },
};

function apply(state: SimulatorState, fields: Fields): StepResult {
  const yn = (v: string | undefined) => (v ?? "").trim().toUpperCase();
  const pf = yn(fields.pfkeys) || (state.settings.pfKeysShown ? "Y" : "N");
  const ins = yn(fields.insert) || (state.settings.insertMode ? "Y" : "N");
  const scroll = yn(fields.scroll) || state.settings.scrollDefault;
  if (!["Y", "N"].includes(pf) || !["Y", "N"].includes(ins)) return fail({ ...state, fieldValues: fields }, "ENTER Y OR N");
  if (!["PAGE", "HALF", "CSR", "DATA"].includes(scroll) && !/^\d{1,4}$/.test(scroll)) {
    return fail({ ...state, fieldValues: fields }, "INVALID SCROLL AMOUNT");
  }
  const settings: Settings = { pfKeysShown: pf === "Y", insertMode: ins === "Y", scrollDefault: scroll as Settings["scrollDefault"] };
  const events: SimEvent[] = [];
  if (settings.pfKeysShown !== state.settings.pfKeysShown) events.push({ type: "SETTING_CHANGED", setting: "pfKeysShown", value: pf });
  if (settings.insertMode !== state.settings.insertMode) events.push({ type: "SETTING_CHANGED", setting: "insertMode", value: ins });
  if (settings.scrollDefault !== state.settings.scrollDefault) events.push({ type: "SETTING_CHANGED", setting: "scrollDefault", value: scroll });
  return { state: { ...state, settings, fieldValues: {}, message: undefined }, events };
}
