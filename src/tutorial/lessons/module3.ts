/**
 * Module 3 - The editor. Lessons 7-11.
 * Modelled on z/OS ISPF Edit and Edit Macros (line/primary commands) and the SHARE
 * "ISPF Editor - Beyond the Basics" hands-on lab. See docs/04-editor-commands.md.
 */
import { allOf, anyOf, editorClosed, editorHasLine, editorLineCount, editorOpen, eventIs, memberListOpen, memberSatisfies, onScreen, savedMember } from "../validators";
import type { Lesson } from "../types";

const HELLO = "{HLQ}.JCL";

export const lesson07: Lesson = {
  id: "l07-browse-vs-edit",
  number: 7,
  module: "The editor",
  title: "Browse versus Edit",
  description: "Look at a member safely with Browse, then reopen it in Edit.",
  objective: "Browse {HLQ}.JCL(HELLO), leave, then open the same member in Edit.",
  teaches: ["Browse is read-only", "View is editable but cannot save", "Edit changes data", "The editor frame: Top/Bottom of Data, columns, prefix area"],
  startingState: { screen: { id: "DSLIST_SEARCH" } },
  steps: [
    {
      id: "browse",
      instruction: "List {HLQ}.JCL in DSLIST, open its member list with B, then type B next to HELLO and press Enter.",
      explanation: "Browse shows records without letting you change them - the safe way to read production JCL. Notice the line numbers are plain text and the prefix area is not typeable.",
      hint: "Dsname Level {HLQ}.JCL, Enter; B on the row; B on HELLO.",
      validator: editorOpen(HELLO, "HELLO", "BROWSE"),
    },
    {
      id: "try-typing",
      instruction: "Try typing SAVE on the command line and press Enter. Read the message, then press PF3 twice to get back to DSLIST.",
      explanation: "Browse refuses SAVE because nothing can be changed. The message area tells you why - ISPF always explains.",
      hint: "SAVE, Enter, then F3, F3.",
      validator: onScreen("DSLIST_RESULTS"),
    },
    {
      id: "edit",
      instruction: "Now type E next to {HLQ}.JCL, then E next to HELLO, and press Enter.",
      explanation: "Edit opens the same records in the ISPF editor. The prefix area on the left now accepts line commands and every record can be typed over.",
      hint: "E on the row, then E on HELLO.",
      validator: editorOpen(HELLO, "HELLO", "EDIT"),
    },
    {
      id: "leave",
      instruction: "Read the editor frame: EDIT, the member name, Columns 00001 00072, the Command ===> line, Top of Data and Bottom of Data. Press PF3 to leave (nothing changed, so nothing is saved).",
      explanation: "Columns tells you which part of each 80-byte record is on screen. PF10/PF11 scroll left and right when records are wider than the screen.",
      hint: "F3.",
      validator: memberListOpen(HELLO),
    },
  ],
};

export const lesson08: Lesson = {
  id: "l08-first-edit",
  number: 8,
  module: "The editor",
  title: "Editing your first member",
  description: "Overtype a record, watch the MODIFIED flag, and SAVE.",
  objective: "Change the STEP1 line of {HLQ}.JCL(HELLO) to run IEBGENER instead of IEFBR14, then SAVE it.",
  teaches: ["Overtype editing", "Dirty (modified) state", "SAVE keeps you in the editor", "PF3 ends and, with AUTOSAVE ON (the default), saves; CANCEL discards"],
  startingState: { screen: { id: "DSLIST_SEARCH" }, resetMembers: [{ dsn: "{HLQ}.JCL", member: "HELLO" }] },
  steps: [
    {
      id: "open",
      instruction: "Open {HLQ}.JCL(HELLO) in Edit (3.4 → E on the library → E on HELLO, or option 2 with the full name).",
      hint: "Fastest: PF3 to the Primary Option Menu, type 2, Enter, then {HLQ}.JCL(HELLO) in Other Data Set Name.",
      validator: editorOpen(HELLO, "HELLO", "EDIT"),
    },
    {
      id: "overtype",
      instruction: "Move the cursor onto the STEP1 record (Tab or the arrow keys), put it on IEFBR14, and type IEBGENER over it. Then press Enter.",
      explanation: "The 3270 terminal is an overtype device: characters replace what is under the cursor. Nothing reaches the editor until you press Enter - then the status line shows MODIFIED.",
      hint: "Place the cursor on the I of IEFBR14 and type IEBGENER, then Enter.",
      validator: editorHasLine((t) => /IEBGENER/i.test(t)),
    },
    {
      id: "save",
      instruction: "Type SAVE on the Command ===> line and press Enter.",
      explanation: "SAVE writes the buffer to the member and keeps you in the editor. The member statistics (Changed, ID) are updated.",
      hint: "SAVE, Enter.",
      validator: savedMember(HELLO, "HELLO"),
      highlightField: "command",
    },
    {
      id: "pf3",
      instruction: "Press PF3 to end the edit session. Because nothing changed since SAVE, ISPF just returns to the member list.",
      explanation: "PF3 means END. In Edit, with the profile setting AUTOSAVE ON (the default on most systems), END saves your changes first; with AUTOSAVE OFF it would ask. If you ever want to throw changes away, type CANCEL (or press PF12) instead.",
      hint: "F3.",
      validator: allOf(editorClosed, memberSatisfies(HELLO, "HELLO", (r) => r.some((t) => /IEBGENER/.test(t)))),
    },
  ],
};

export const lesson09: Lesson = {
  id: "l09-line-commands",
  number: 9,
  module: "The editor",
  title: "Line commands",
  description: "Insert, delete and repeat records from the prefix area.",
  objective: "In {HLQ}.JCL(HELLO): insert a comment record, delete a record, repeat a record, then save.",
  teaches: ["The prefix area", "I / In insert", "D / Dn and DD...DD delete", "R repeat", "Unused inserted lines disappear"],
  startingState: { screen: { id: "DSLIST_SEARCH" }, resetMembers: [{ dsn: "{HLQ}.JCL", member: "HELLO" }] },
  steps: [
    {
      id: "open",
      instruction: "Open {HLQ}.JCL(HELLO) in Edit.",
      hint: "Option 2 with {HLQ}.JCL(HELLO), or 3.4 → E → E.",
      validator: editorOpen(HELLO, "HELLO", "EDIT"),
    },
    {
      id: "insert",
      instruction: "Move the cursor to the prefix area of line 000001 (the six digits on the left), type I over the number, and press Enter. A blank record appears below it.",
      explanation: "Line commands are typed over the line number. ISPF strips the leftover digits, so I00001 is read as I. I3 would insert three lines.",
      hint: "Shift+Tab or click into the 000001 field, type I, Enter.",
      validator: eventIs("EDITOR_LINE_INSERTED"),
    },
    {
      id: "fill",
      instruction: "Type //* MY FIRST COMMENT on the new blank record and press Enter. (If you press Enter before typing, the empty inserted line vanishes - that is normal ISPF.)",
      explanation: "In JCL, //* starts a comment. Inserted lines that stay blank are removed on the next Enter so they never pollute your member.",
      hint: "The cursor is already on the blank line. Type the text and press Enter.",
      validator: editorHasLine((t) => /^\/\/\*.*COMMENT/i.test(t)),
    },
    {
      id: "delete",
      instruction: "Delete the NOTIFY continuation record: type D over its line number and press Enter.",
      explanation: "D deletes one record; D2 deletes two; DD on the first and DD on the last record deletes a whole block.",
      hint: "Find the record starting with //             NOTIFY, type D in its prefix, Enter.",
      validator: eventIs("EDITOR_LINE_DELETED"),
    },
    {
      id: "repeat",
      instruction: "Type R over the line number of your comment record and press Enter to repeat it.",
      explanation: "R duplicates a record right below itself. R5 makes five copies - handy for boilerplate DD statements.",
      hint: "R in the prefix of the //* MY FIRST COMMENT line, Enter.",
      validator: eventIs("EDITOR_LINE_REPEATED"),
    },
    {
      id: "save",
      instruction: "Press PF3 to save and end.",
      hint: "F3.",
      validator: savedMember(HELLO, "HELLO"),
    },
  ],
};

export const lesson10: Lesson = {
  id: "l10-copy-move",
  number: 10,
  module: "The editor",
  title: "Copy and move",
  description: "Two-part line commands: mark the source with C or M, mark the target with A or B.",
  objective: "In {HLQ}.JCL(SORTJOB): copy a record after another (C + A), copy one before another (C + B), and move a block (MM...MM + A).",
  teaches: ["C / M sources", "A (after) and B (before) destinations", "Block form CC...CC and MM...MM", "Pending commands and RESET"],
  startingState: { screen: { id: "DSLIST_SEARCH" }, resetMembers: [{ dsn: "{HLQ}.JCL", member: "SORTJOB" }] },
  steps: [
    {
      id: "open",
      instruction: "Open {HLQ}.JCL(SORTJOB) in Edit.",
      hint: "Option 2 with {HLQ}.JCL(SORTJOB).",
      validator: editorOpen(HELLO, "SORTJOB", "EDIT"),
    },
    {
      id: "copy-after",
      instruction: "Type C over the line number of the //SYSOUT record and A over the line number of the //SORTOUT record. Press Enter once.",
      explanation: "C marks what to copy; A says put it after this line. You can type both before pressing Enter, or press Enter after the C - it stays pending (shown in the prefix area) until you supply A or B.",
      hint: "C on //SYSOUT, A on //SORTOUT, Enter.",
      validator: eventIs("EDITOR_LINES_COPIED", (e) => e.dest === "A"),
    },
    {
      id: "copy-before",
      instruction: "Now copy the //SORTIN record before the //SORT EXEC record: C on SORTIN, B on the EXEC line, Enter.",
      explanation: "B is the mirror of A: the copy lands before the marked line.",
      hint: "C on //SORTIN, B on //SORT     EXEC, Enter.",
      validator: eventIs("EDITOR_LINES_COPIED", (e) => e.dest === "B"),
    },
    {
      id: "move-block",
      instruction: "Move the two-record block //SYSIN DD * and SORT FIELDS to the end: type MM on both records, then A on the /* record, and press Enter.",
      explanation: "MM...MM marks a block; M alone moves one line. Move removes the source. If you get MOVE/COPY IS PENDING, you still need the A or B.",
      hint: "MM on //SYSIN, MM on the SORT FIELDS line, A on /*, Enter.",
      validator: eventIs("EDITOR_LINES_MOVED"),
    },
    {
      id: "cancel",
      instruction: "This member is now scrambled on purpose. Type CANCEL and press Enter to leave without saving.",
      explanation: "CANCEL (or PF12) discards everything since the last SAVE. Use it when an experiment goes wrong.",
      hint: "CANCEL, Enter.",
      validator: eventIs("EDIT_CANCELLED"),
      highlightField: "command",
    },
  ],
};

export const lesson11: Lesson = {
  id: "l11-find-change",
  number: 11,
  module: "The editor",
  title: "FIND and CHANGE",
  description: "Search and replace with primary commands and the repeat keys PF5/PF6.",
  objective: "In {HLQ}.COBOL(CUSTOMER): FIND a string, repeat with PF5, CHANGE ALL, exclude lines, and save.",
  teaches: ["FIND / RFIND (PF5)", "CHANGE / RCHANGE (PF6)", "CHANGE ... ALL", "EXCLUDE and RESET"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" }, resetMembers: [{ dsn: "{HLQ}.COBOL", member: "CUSTOMER" }] },
  steps: [
    {
      id: "open",
      instruction: "Open {HLQ}.COBOL(CUSTOMER) in Edit.",
      hint: "Option 2, then {HLQ}.COBOL(CUSTOMER).",
      validator: editorOpen("{HLQ}.COBOL", "CUSTOMER", "EDIT"),
    },
    {
      id: "find",
      instruction: "Type FIND CUST on the command line and press Enter. The cursor jumps to the first hit.",
      explanation: "FIND is case-insensitive by default. Quotes are needed only when the string contains blanks: FIND 'WS CUST'.",
      hint: "FIND CUST, Enter.",
      validator: eventIs("EDITOR_FIND"),
      highlightField: "command",
    },
    {
      id: "rfind",
      instruction: "Press PF5 to repeat the find. Keep pressing it until you see *BOTTOM OF DATA REACHED*.",
      explanation: "PF5 is RFIND - repeat find. PF6 is RCHANGE. Together with FIND and CHANGE they are the fastest way to walk through a large member.",
      hint: "F5, F5, F5...",
      validator: eventIs("MESSAGE_SHOWN", (e) => e.text === "*BOTTOM OF DATA REACHED*"),
    },
    {
      id: "change-all",
      instruction: "Type CHANGE WS-CUST WS-CLIENT ALL and press Enter.",
      explanation: "CHANGE old new replaces the next occurrence; ALL replaces every one. The message tells you how many changed.",
      hint: "CHANGE WS-CUST WS-CLIENT ALL, Enter.",
      validator: editorHasLine((t) => /WS-CLIENT-ID/.test(t)),
      highlightField: "command",
    },
    {
      id: "exclude",
      instruction: "Type X DISPLAY ALL and press Enter to hide the DISPLAY lines, then RESET to show them again.",
      explanation: "Excluded lines collapse into a dashed marker so you can focus. RESET clears exclusions, pending line commands and messages.",
      hint: "X DISPLAY ALL, Enter, then RESET, Enter.",
      validator: anyOf(eventIs("EDITOR_LINES_EXCLUDED"), editorLineCount((n) => n > 0)),
    },
    {
      id: "save",
      instruction: "Press PF3 to save and end.",
      hint: "F3.",
      validator: savedMember("{HLQ}.COBOL", "CUSTOMER"),
    },
  ],
};
