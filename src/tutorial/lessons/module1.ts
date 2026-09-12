/**
 * Module 1 - Getting around. Lessons 1-3.
 * Modelled on IBM Redbook SG24-6366 §4.3-4.4 (logon, ISPF overview, PF keys) and the
 * Mainframestechhelp "Interacting with ISPF" / "ISPF Settings" topics. See docs/05-course-design.md.
 */
import { eventIs, onScreen } from "../validators";
import type { Lesson } from "../types";

export const lesson01: Lesson = {
  id: "l01-meet-ispf",
  number: 1,
  module: "Getting around",
  title: "Meet ISPF",
  description: "Log on, read a panel, and learn the three things every ISPF screen has: fields, a command line, and PF keys.",
  objective: "Log on and reach the ISPF Primary Option Menu, then use PF1 and PF3.",
  teaches: ["What a panel is", "Input fields and the command/option line", "Enter processes the panel", "PF keys: PF1 help, PF3 end"],
  startingState: { screen: { id: "LOGIN" } },
  steps: [
    {
      id: "logon",
      instruction: "This is the TSO/E LOGON panel. Your cursor is in the Userid field. Keep USER01 (or type your own name, up to 7 characters) and press Enter.",
      explanation: "On z/OS you reach ISPF through TSO (Time Sharing Option). The userid you log on with becomes the high-level qualifier (HLQ) of your data sets: USER01.JCL, USER01.COBOL and so on.",
      hint: "Just press Enter. The password is not checked in this simulator.",
      validator: eventIs("LOGGED_ON"),
      highlightField: "userid",
    },
    {
      id: "look-around",
      instruction: "You are on the ISPF Primary Option Menu. Notice the Option ===> line at the top and the numbered options below. Press PF1 (or click F1) to open the help for this panel.",
      explanation: "Every ISPF panel has the same anatomy: a title line, a short message area at the top right, a command or option line, a body of protected text and unprotected input fields, and a PF-key legend at the bottom.",
      hint: "Press the F1 key on your keyboard, or click the F1 button under the terminal.",
      validator: onScreen("HELP"),
    },
    {
      id: "pf3-back",
      instruction: "Help panels are stacked on top of the panel you came from. Press PF3 (End) to return to the Primary Option Menu.",
      explanation: "PF3 means End: it closes the current panel and returns to the previous one. You will press it hundreds of times a day on a real system.",
      hint: "Press F3 or click the F3 button.",
      validator: onScreen("PRIMARY_OPTION_MENU"),
    },
    {
      id: "type-something",
      instruction: "Type an option that does not exist, such as 99, on the Option ===> line and press Enter. Watch the short message at the top right.",
      explanation: "ISPF never pops up dialog boxes. Errors appear as a short message in the top-right corner (and PF1 shows a longer one). Learning to look there is half of ISPF fluency.",
      hint: "Type 99 then Enter. The message INVALID OPTION is expected - it is the lesson.",
      validator: eventIs("MESSAGE_SHOWN", (e) => e.text === "INVALID OPTION"),
      highlightField: "option",
    },
    {
      id: "tab",
      instruction: "Press Enter with an empty Option line to clear the message. Then press PF1 once more and PF3 again - this time without the mouse.",
      explanation: "Keyboard first: Enter, Tab (next field), Shift+Tab (previous field), and the PF keys are how ISPF is driven. The mouse is optional.",
      hint: "Press Enter, then F1, then F3.",
      validator: eventIs("PF_KEY_PRESSED", (e) => e.key === 3 && e.screen === "HELP"),
    },
  ],
};

export const lesson02: Lesson = {
  id: "l02-navigating",
  number: 2,
  module: "Getting around",
  title: "Navigating ISPF",
  description: "Move through the menu tree with option numbers, jump directly with 3.4, and unwind with PF3.",
  objective: "Reach the Data Set List Utility (option 3.4) two different ways and return to the Primary Option Menu.",
  teaches: ["Primary menu options", "Utilities (3)", "Direct option 3.4 and =3.4", "PF3 unwinds one panel at a time"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" } },
  steps: [
    {
      id: "open-utilities",
      instruction: "Type 3 on the Option ===> line and press Enter to open the Utility Selection Panel.",
      explanation: "Option 3, Utilities, is where data sets are managed. You will spend most of your ISPF life under it.",
      hint: "Type 3 and press Enter.",
      validator: onScreen("UTILITY_SELECTION"),
      highlightField: "option",
    },
    {
      id: "open-dslist",
      instruction: "Now type 4 and press Enter to open the Data Set List Utility.",
      explanation: "Option 4 under Utilities is DSLIST. Together the path is written 3.4 - the most famous option number in ISPF.",
      hint: "Type 4 and press Enter.",
      validator: onScreen("DSLIST_SEARCH"),
      highlightField: "option",
    },
    {
      id: "unwind",
      instruction: "Press PF3 twice to unwind back to the Primary Option Menu. Watch how each PF3 returns exactly one panel.",
      explanation: "ISPF keeps a stack of panels. PF3 pops one. Do not look for a Home button - there is none.",
      hint: "F3, then F3 again.",
      validator: onScreen("PRIMARY_OPTION_MENU"),
    },
    {
      id: "jump",
      instruction: "This time type 3.4 (with the period) on the Option line and press Enter.",
      explanation: "Chaining options with periods walks the menu tree in one step. From any panel, =3.4 (with an equals sign) jumps there directly.",
      hint: "Type 3.4 and press Enter.",
      validator: onScreen("DSLIST_SEARCH"),
      highlightField: "option",
    },
    {
      id: "home",
      instruction: "Press PF3 until you are back on the Primary Option Menu. Notice that 3.4 still went through Utilities, so it takes two PF3s.",
      explanation: "Even when you jump, ISPF remembers the intermediate menu, so PF3 behaves the same either way.",
      hint: "F3, F3.",
      validator: onScreen("PRIMARY_OPTION_MENU"),
    },
  ],
};

export const lesson03: Lesson = {
  id: "l03-settings-tso",
  number: 3,
  module: "Getting around",
  title: "Settings and TSO commands",
  description: "Tune the terminal with option 0 and talk to TSO directly with option 6.",
  objective: "Change a setting in option 0, then run LISTCAT LEVEL({HLQ}) from option 6.",
  teaches: ["ISPF Settings (option 0)", "The TSO command shell (option 6)", "LISTCAT and the catalog", "TSO commands from the Option line"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" } },
  steps: [
    {
      id: "open-settings",
      instruction: "Type 0 and press Enter to open ISPF Settings.",
      explanation: "Option 0 holds terminal and user parameters. Real ISPF has dozens; this simulator keeps the ones it honours.",
      hint: "Type 0, Enter.",
      validator: onScreen("SETTINGS"),
      highlightField: "option",
    },
    {
      id: "change-scroll",
      instruction: "Tab to the Default scroll amount field, type HALF over PAGE, and press PF3 to save and return.",
      explanation: "Scroll amount controls how far PF7/PF8 move in lists and the editor. PAGE is a full screen; HALF is half; CSR scrolls to the cursor.",
      hint: "Press Tab until the cursor is on the scroll field, type HALF, then F3.",
      validator: eventIs("SETTING_CHANGED", (e) => e.setting === "scrollDefault"),
      highlightField: "scroll",
    },
    {
      id: "open-tso",
      instruction: "From the Primary Option Menu type 6 and press Enter to open the ISPF Command Shell.",
      explanation: "Option 6 lets you type TSO commands without leaving ISPF. TSO is the command-line layer underneath ISPF.",
      hint: "Type 6, Enter.",
      validator: onScreen("TSO_COMMAND"),
      highlightField: "option",
    },
    {
      id: "listcat",
      instruction: "Type LISTCAT LEVEL({HLQ}) and press Enter.",
      explanation: "LISTCAT asks the catalog (the system index of data-set names) for every entry under a high-level qualifier. DSLIST (3.4) shows the same information as a panel.",
      hint: "LISTCAT LEVEL({HLQ}) then Enter.",
      validator: eventIs("TSO_COMMAND_ENTERED", (e) => /^LISTCAT/i.test(e.command)),
      highlightField: "command",
    },
    {
      id: "back-home",
      instruction: "Press PF3 to return to the Primary Option Menu. Tip: next time you can type TSO LISTCAT LEVEL({HLQ}) straight on the Option line.",
      explanation: "Prefixing a command with TSO on any command line runs it without opening option 6.",
      hint: "F3.",
      validator: onScreen("PRIMARY_OPTION_MENU"),
    },
  ],
};
