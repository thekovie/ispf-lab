/**
 * TSO/E LOGON panel. Reference: docs/03-ispf-behaviour-reference.md §LOGON.
 */
import { buildSeed } from "@/catalog/seed";
import { blank, f, label, padRow, t, titleRow } from "../rows";
import { fail } from "../navigation";
import type { ScreenHandler, SimulatorState } from "../types";

const USERID_RE = /^[A-Z#$@][A-Z0-9#$@]{0,6}$/;

export const loginScreen: ScreenHandler<{ id: "LOGIN" }> = {
  help: [
    "The TSO/E LOGON panel is the first screen on a real z/OS system.",
    "Type a userid (1-7 characters) and press Enter. In this simulator the",
    "password is not checked. Your userid becomes the high-level qualifier",
    "(HLQ) of your training data sets, e.g. USER01.JCL.",
  ],
  render(state) {
    const userid = state.fieldValues.userid ?? (state.userid || "USER01");
    return {
      title: "TSO/E LOGON",
      pfKeys: [{ key: 1, label: "Help" }],
      fields: ["userid", "password"],
      focus: state.focusField ?? "userid",
      message: state.message,
      rows: [
        titleRow("------------------------------- TSO/E LOGON -------------------------------", state.message?.short, state.message?.severity === "error" ? "red" : "yellow"),
        blank,
        padRow("   Enter LOGON parameters below:                 RACF LOGON parameters:", "white"),
        blank,
        [label("   Userid    ===> "), f("userid", 8, userid)],
        blank,
        [label("   Password  ===> "), f("password", 8, "", { password: true }), t("      New Password ===> ", "cyan"), t("________", "dim")],
        blank,
        [label("   Procedure ===> "), t("ISPFPROC", "green"), t("      Group Ident  ===> ", "cyan"), t("________", "dim")],
        blank,
        [label("   Acct Nmbr ===> "), t("ACCT    ", "green"), t("      Size         ===> ", "cyan"), t("4096    ", "green")],
        blank,
        [label("   Command   ===> "), t("_".repeat(40), "dim")],
        blank,
        padRow("   Enter an 'S' before each option desired below:", "white"),
        [t("        -Nomail   -Nonotice   -Reconnect   -OIDcard", "white")],
        blank,
        blank,
        padRow("   Educational ISPF training simulator. Not affiliated with or endorsed by IBM.", "dim"),
        padRow("   Any userid works. It becomes your data-set high-level qualifier (HLQ).", "dim"),
      ],
    };
  },
  onEnter(state, _frame, fields) {
    const userid = (fields.userid ?? "").trim().toUpperCase();
    if (!USERID_RE.test(userid)) {
      return fail({ ...state, fieldValues: { userid } }, "INVALID USERID", "Userid must be 1-7 characters: letters, digits, #, $ or @, starting with a letter.");
    }
    const next: SimulatorState = {
      ...state,
      userid,
      loggedIn: true,
      catalog: state.catalog.hlq === userid ? state.catalog : buildSeed(userid),
      screens: [],
      activeScreen: 0,
      screen: { id: "PRIMARY_OPTION_MENU" },
      stack: [],
      message: undefined,
      fieldValues: {},
      focusField: undefined,
      editor: undefined,
    };
    return {
      state: next,
      events: [
        { type: "LOGGED_ON", userid },
        { type: "SCREEN_OPENED", screen: "PRIMARY_OPTION_MENU", frame: { id: "PRIMARY_OPTION_MENU" } },
      ],
    };
  },
};
