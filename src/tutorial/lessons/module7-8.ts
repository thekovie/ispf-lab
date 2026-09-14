/**
 * Module 7 - Navigation mastery (lessons 16-17). Module 8 - Editor power tools (lessons 18-21).
 * Modelled on z/OS ISPF User's Guide Vol I ("Using the jump function", "RETRIEVE") and
 * z/OS ISPF Edit and Edit Macros (COLS, BOUNDS, PROFILE, UNDO, RECOVERY, exclude commands).
 */
import { allOf, anyOf, dslistShowing, editorClosed, editorOpen, eventIs, onScreen } from "../validators";
import type { Lesson, Validator } from "../types";

const hasSpecial =
  (kind: "COLS" | "BNDS" | "PROF", present = true): Validator =>
  ({ state }) =>
    !!state.editor && state.editor.special.some((s) => s.kind === kind) === present;

export const lesson16: Lesson = {
  id: "l16-jump-return",
  number: 16,
  module: "Navigation mastery",
  title: "Jump anywhere with = and come home with RETURN",
  description: "Stop pressing PF3 five times: =option jumps from any panel, RETURN (PF4) goes straight to the Primary Option Menu.",
  objective: "From DSLIST jump to Edit with =2, open {HLQ}.JCL(HELLO), jump to =3.4 from inside the editor, then RETURN.",
  teaches: ["=option is RETURN followed by the option", "Jumping out of Edit ends the session (AUTOSAVE saves)", "RETURN / PF4 unwinds the whole panel chain", "Only the active logical screen is affected"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" } },
  steps: [
    {
      id: "open-dslist",
      instruction: "Open the Data Set List Utility and list {HLQ} (3.4, then the level).",
      hint: "3.4, Enter, {HLQ} in Dsname Level, Enter.",
      validator: dslistShowing((level, ctx) => level.toUpperCase().startsWith(ctx.hlq)),
    },
    {
      id: "jump-to-edit",
      instruction: "On the DSLIST command line type =2 and press Enter. You land on the Edit Entry Panel without walking back through Utilities.",
      explanation: "ISPF processes = as a system command before the panel sees it, so it works on every command line - DSLIST, member lists, even inside the editor.",
      hint: "Type =2 on the Command line and press Enter.",
      validator: eventIs("JUMP_EXECUTED", (e) => e.path === "2"),
    },
    {
      id: "edit-hello",
      instruction: "Open {HLQ}.JCL(HELLO) in Edit.",
      hint: "Other Data Set Name: {HLQ}.JCL(HELLO), Enter.",
      validator: editorOpen("{HLQ}.JCL", "HELLO", "EDIT"),
    },
    {
      id: "jump-from-editor",
      instruction: "Type =3.4 on the editor command line. The jump ends the edit session first (saving if AUTOSAVE is ON and you changed something), then opens DSLIST.",
      explanation: "Jumping out of Edit is safe: ISPF runs END processing exactly as PF3 would. That is why the profile's AUTOSAVE setting matters.",
      hint: "=3.4 on the Command line, Enter.",
      validator: allOf(eventIs("JUMP_EXECUTED", (e) => e.from === "EDIT"), editorClosed),
    },
    {
      id: "return",
      instruction: "Press PF4 (or type RETURN). You are back on the Primary Option Menu in one step.",
      explanation: "RETURN unwinds every panel on this logical screen. Split-screen users use it constantly to reset one screen without touching the other.",
      hint: "F4.",
      validator: eventIs("RETURN_EXECUTED"),
    },
  ],
};

export const lesson17: Lesson = {
  id: "l17-retrieve-multi",
  number: 17,
  module: "Navigation mastery",
  title: "RETRIEVE and several line commands per Enter",
  description: "Recall previous commands with F12 / RETRIEVE, and type more than one line command before pressing Enter.",
  objective: "Exclude two data sets from DSLIST in one Enter, RESET, then bring back and re-run an earlier command with RETRIEVE.",
  teaches: ["ISPF processes every line command on the panel, top to bottom", "RETRIEVE / F12 refills the command line from the stack", "F12 is Cancel in Edit and Retrieve on most other panels"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" } },
  steps: [
    {
      id: "open-dslist",
      instruction: "Open DSLIST for {HLQ} (3.4 and the level).",
      hint: "3.4, Enter, {HLQ}, Enter.",
      validator: dslistShowing((level, ctx) => level.toUpperCase().startsWith(ctx.hlq)),
    },
    {
      id: "two-commands",
      instruction: "Type X next to two different data sets, then press Enter once. Both rows disappear behind a 'Not Displayed' marker.",
      explanation: "Real ISPF collects all line commands typed since the last Enter and runs them in order. If one opens a panel, the rest wait until you press PF3.",
      hint: "Put X in the command column of two rows (use Tab or the arrow keys), then Enter.",
      validator: eventIs("LIST_COMMANDS_PROCESSED", (e) => e.count >= 2),
    },
    {
      id: "reset",
      instruction: "Type RESET on the command line to show the excluded rows again.",
      hint: "RESET, Enter.",
      validator: eventIs("LIST_RESET"),
    },
    {
      id: "retrieve",
      instruction: "Press F12 (or type RETRIEVE). The previous command, RESET, comes back on the command line. Press F12 again to walk further back.",
      explanation: "ISPF keeps the last commands on a stack shared by all panels. The editor uses F12 for Cancel instead, so type RETRIEVE there.",
      hint: "F12.",
      validator: eventIs("COMMAND_RETRIEVED"),
    },
    {
      id: "rerun",
      instruction: "Press PF3 twice, then use F12 until 3.4 is on the Option line and press Enter to run it again.",
      hint: "F3, F3, then F12 until you see 3.4, then Enter.",
      validator: allOf(onScreen("DSLIST_SEARCH"), ({ state }) => state.retrieveStack.length > 0),
    },
  ],
};

export const lesson18: Lesson = {
  id: "l18-cols-bounds",
  number: 18,
  module: "Editor power tools",
  title: "Columns matter: COLS and BOUNDS",
  description: "Show a column ruler, restrict FIND to a column range, and remove the special lines again.",
  objective: "In {HLQ}.COBOL(HELLO) display a =COLS> ruler, set BOUNDS 8 72, FIND DIVISION inside the bounds, then RESET.",
  teaches: ["COLS shows a =COLS> ruler (special line, never saved)", "BOUNDS left right limits FIND/CHANGE/EXCLUDE", "COBOL area A starts in column 8; JCL must not pass column 71", "RESET removes special lines"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" } },
  steps: [
    {
      id: "open-cobol",
      instruction: "Open {HLQ}.COBOL(HELLO) in Edit.",
      hint: "2, Enter, {HLQ}.COBOL(HELLO), Enter.",
      validator: editorOpen("{HLQ}.COBOL", "HELLO", "EDIT"),
    },
    {
      id: "cols",
      instruction: "Type COLS on the command line. A =COLS> ruler appears above the first line: ----+----1----+----2 ... each digit marks a multiple of ten.",
      explanation: "Fixed-format languages care about columns. COBOL divisions start in area A (columns 8-11); code goes in area B (12-72). The ruler is display-only.",
      hint: "COLS, Enter.",
      validator: eventIs("COLS_DISPLAYED"),
    },
    {
      id: "bounds",
      instruction: "Type BOUNDS 8 72. From now on FIND, CHANGE and EXCLUDE only look between columns 8 and 72.",
      explanation: "Bounds are stored in the edit profile, so they stay until you change them. BNDS on its own shows an editable =BNDS> line.",
      hint: "BOUNDS 8 72, Enter.",
      validator: eventIs("BOUNDS_CHANGED"),
    },
    {
      id: "find",
      instruction: "Type FIND DIVISION. The cursor lands on the first DIVISION inside the bounds.",
      hint: "FIND DIVISION, Enter (F5 repeats it).",
      validator: eventIs("EDITOR_FIND"),
    },
    {
      id: "reset",
      instruction: "Type RESET to remove the ruler (RESET SPECIAL would do only that). The bounds stay - type BOUNDS 1 72 if you want the default back.",
      hint: "RESET, Enter.",
      validator: allOf(hasSpecial("COLS", false), editorOpen("{HLQ}.COBOL", "HELLO")),
    },
    {
      id: "leave",
      instruction: "Press PF3 to leave the editor.",
      hint: "F3.",
      validator: editorClosed,
    },
  ],
};

export const lesson19: Lesson = {
  id: "l19-profiles",
  number: 19,
  module: "Editor power tools",
  title: "Edit profiles: settings that follow the data set type",
  description: "Display the profile, change CAPS, and see that the change is remembered for every member of the same type.",
  objective: "Show =PROF> lines for {HLQ}.JCL(HELLO), turn CAPS ON, leave, reopen {HLQ}.JCL(COPYJOB) and confirm CAPS is still ON; then turn it OFF again.",
  teaches: ["PROFILE shows =PROF> lines", "The profile is named after the last qualifier (JCL, COBOL)", "CAPS, NUMBER, STATS, RECOVERY, SETUNDO, AUTOSAVE and BOUNDS live in it", "Profiles persist across sessions"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" } },
  steps: [
    {
      id: "open-hello",
      instruction: "Open {HLQ}.JCL(HELLO) in Edit.",
      hint: "2, Enter, {HLQ}.JCL(HELLO), Enter.",
      validator: editorOpen("{HLQ}.JCL", "HELLO", "EDIT"),
    },
    {
      id: "profile",
      instruction: "Type PROFILE. Two =PROF> lines show the current settings: the profile name JCL, LRECL, CAPS, NUMBER, STATS, RECOVERY, SETUNDO, AUTOSAVE, BOUNDS.",
      explanation: "ISPF keeps one profile per data set type - the last qualifier. Every member of a .JCL library shares the JCL profile.",
      hint: "PROFILE, Enter.",
      validator: hasSpecial("PROF"),
    },
    {
      id: "caps-on",
      instruction: "Type CAPS ON. Text you type from now on is upper-cased, and the =PROF> line updates.",
      hint: "CAPS ON, Enter.",
      validator: eventIs("PROFILE_CHANGED", (_e, ctx) => ctx.state.editor?.profile.caps === true),
    },
    {
      id: "reopen",
      instruction: "Press PF3, then open {HLQ}.JCL(COPYJOB) in Edit. Type PROFILE: CAPS is still ON because COPYJOB uses the same JCL profile.",
      explanation: "This is why a setting you changed weeks ago can surprise you. When something behaves oddly in Edit, PROFILE is the first command to type.",
      hint: "F3, then 2 with {HLQ}.JCL(COPYJOB), then PROFILE.",
      validator: allOf(editorOpen("{HLQ}.JCL", "COPYJOB", "EDIT"), ({ state }) => state.editor?.profile.caps === true),
    },
    {
      id: "caps-off",
      instruction: "Type CAPS OFF to restore the default, then PF3 to leave.",
      hint: "CAPS OFF, Enter, F3.",
      validator: allOf(editorClosed, ({ state }) => state.editProfiles.JCL?.caps === false),
    },
  ],
};

export const lesson20: Lesson = {
  id: "l20-undo-recovery",
  number: 20,
  module: "Editor power tools",
  title: "UNDO and edit recovery",
  description: "Take back a mistake with UNDO, learn what SETUNDO and RECOVERY control, and leave without saving.",
  objective: "In {HLQ}.JCL(HELLO) delete a line, UNDO it, turn RECOVERY ON, then CANCEL.",
  teaches: ["UNDO reverses one interaction (one Enter) at a time", "SETUNDO ON or RECOVERY ON is required", "SAVE is a boundary: earlier changes cannot be undone", "CANCEL discards everything since the last SAVE"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" }, resetMembers: [{ dsn: "{HLQ}.JCL", member: "HELLO" }] },
  steps: [
    {
      id: "open-hello",
      instruction: "Open {HLQ}.JCL(HELLO) in Edit.",
      hint: "2, Enter, {HLQ}.JCL(HELLO), Enter.",
      validator: editorOpen("{HLQ}.JCL", "HELLO", "EDIT"),
    },
    {
      id: "delete",
      instruction: "Type D in the prefix area of the EXEC line (line 3) and press Enter. The step is gone.",
      hint: "Overtype the line number of line 3 with D, Enter.",
      validator: eventIs("EDITOR_LINE_DELETED"),
    },
    {
      id: "undo",
      instruction: "Type UNDO on the command line. The line is back and the message says UNDO COMPLETE.",
      explanation: "UNDO works interaction by interaction: everything one Enter did comes back together. It needs SETUNDO ON (undo data in storage) or RECOVERY ON.",
      hint: "UNDO, Enter.",
      validator: eventIs("UNDO_EXECUTED"),
    },
    {
      id: "recovery",
      instruction: "Type RECOVERY ON. On a real system this journals your keystrokes so a lost session can be recovered; here it is a profile flag that keeps UNDO available.",
      explanation: "Sites differ: ISPF ships RECOVERY OFF and SETUNDO OFF, many installations turn them on. PROFILE tells you.",
      hint: "RECOVERY ON, Enter.",
      validator: eventIs("PROFILE_CHANGED", (_e, ctx) => ctx.state.editor?.profile.recovery === true),
    },
    {
      id: "cancel",
      instruction: "Type CANCEL to leave without saving anything (the member is unchanged anyway).",
      hint: "CANCEL, Enter (or CAN).",
      validator: eventIs("EDIT_CANCELLED"),
    },
  ],
};

export const lesson21: Lesson = {
  id: "l21-exclude-flip",
  number: 21,
  module: "Editor power tools",
  title: "Excluded lines, FLIP and RESET",
  description: "Hide the lines you do not care about, flip the view, and bring everything back.",
  objective: "In {HLQ}.COBOL(HELLO) exclude every line containing DIVISION, FLIP, then RESET.",
  teaches: ["X / EXCLUDE ALL hides matching lines behind a marker", "FLIP reverses which lines are hidden", "RESET (or RESET X) redisplays everything", "Excluded lines are still in the data"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" } },
  steps: [
    {
      id: "open-cobol",
      instruction: "Open {HLQ}.COBOL(HELLO) in Edit.",
      hint: "2, Enter, {HLQ}.COBOL(HELLO), Enter.",
      validator: editorOpen("{HLQ}.COBOL", "HELLO", "EDIT"),
    },
    {
      id: "exclude",
      instruction: "Type X DIVISION ALL on the command line. Every line with DIVISION collapses into '- - - n Line(s) not Displayed'.",
      explanation: "EXCLUDE (X) is how you read a large member: hide what you know, look at what is left. The lines are still saved.",
      hint: "X DIVISION ALL, Enter.",
      validator: allOf(eventIs("EDITOR_LINES_EXCLUDED"), editorOpen("{HLQ}.COBOL", "HELLO")),
    },
    {
      id: "flip",
      instruction: "Type FLIP. Now only the DIVISION lines are shown and everything else is excluded - a table of contents of the program.",
      hint: "FLIP, Enter.",
      validator: eventIs("COMMAND_ENTERED", (e) => e.command.toUpperCase() === "FLIP"),
    },
    {
      id: "reset",
      instruction: "Type RESET to redisplay all lines.",
      hint: "RESET, Enter.",
      validator: anyOf(eventIs("LINES_REDISPLAYED"), ({ state }) => !!state.editor && state.editor.lines.every((l) => !l.excluded)),
    },
    {
      id: "leave",
      instruction: "Press PF3 to leave; nothing was changed.",
      hint: "F3.",
      validator: editorClosed,
    },
  ],
};
