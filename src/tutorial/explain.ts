/**
 * Explain glossary: concise, beginner-friendly, technically accurate z/OS terminology.
 * Reference: docs/05-course-design.md §Glossary; IBM z/OS ISPF User's Guide Vol I; Redbook SG24-6366 ch. 4-5.
 */
export interface GlossaryEntry {
  term: string;
  aliases: string[];
  summary: string;
  detail: string;
  /** flagged analogy, kept separate so it is never mistaken for the definition */
  analogy?: string;
  /** section of a reference guide to read next (see src/content/resources.ts ids) */
  readMore?: { resource: string; section: string };
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "ISPF",
    aliases: ["ispf/pdf", "pdf"],
    summary: "Interactive System Productivity Facility - the full-screen, panel-driven interface to z/OS that runs on top of TSO.",
    detail: "ISPF presents panels (screens) with input fields and a command line. You select options by number, act on lists with one-letter line commands, and edit records with the ISPF editor. It is not a shell: nothing happens until you press Enter or a PF key.",
    readMore: { resource: "redbook", section: "Chapter 4.4 ISPF overview" },
  },
  {
    term: "TSO",
    aliases: ["tso/e", "time sharing option"],
    summary: "Time Sharing Option - the command-line interactive layer of z/OS; ISPF is started from it.",
    detail: "You log on to TSO with a userid; ISPF is usually started automatically. TSO commands such as LISTCAT or ALLOCATE can be run from ISPF option 6 or by prefixing TSO on a command line.",
    readMore: { resource: "redbook", section: "Chapter 4.2 TSO overview" },
  },
  {
    term: "panel",
    aliases: ["screen", "menu"],
    summary: "One ISPF screen: title, short-message area, command/option line, body with protected text and input fields, PF-key legend.",
    detail: "Panels stack: opening one pushes it on top of the previous, PF3 (End) pops it. The short message at the top right is where ISPF reports errors and confirmations.",
  },
  {
    term: "3.4",
    aliases: ["dslist", "data set list utility", "option 3.4"],
    summary: "The Data Set List Utility: list data sets by name pattern and act on them with line commands.",
    detail: "Reached with 3 then 4, or 3.4, or =3.4 from anywhere. Type a Dsname Level (name prefix), press Enter, then use E, B, V, M, I, D or R in the column left of a name.",
    readMore: { resource: "mainframemaster-menu", section: "Option 3.4" },
  },
  {
    term: "HLQ",
    aliases: ["high-level qualifier", "high level qualifier"],
    summary: "The first qualifier of a data-set name; usually the owning userid.",
    detail: "USER01.JCL has two qualifiers; USER01 is the high-level qualifier. Security and catalog searches are organised around it, which is why DSLIST asks for a Dsname Level starting with it.",
  },
  {
    term: "data set",
    aliases: ["dataset", "dsn", "dsname"],
    summary: "A named collection of records stored on z/OS disk or tape - the mainframe unit of storage, not a file in a directory tree.",
    detail: "Names are up to 44 characters: qualifiers of 1-8 characters separated by periods, e.g. SYS1.PARMLIB. A data set has attributes such as organization (DSORG), record format (RECFM) and record length (LRECL).",
    analogy: "Roughly a file - but there are no directories, and the name itself is the whole address.",
    readMore: { resource: "redbook", section: "Chapter 5 Working with data sets" },
  },
  {
    term: "PDS",
    aliases: ["partitioned data set", "library", "po", "pdse"],
    summary: "A partitioned data set: one data set that contains named members, each a sequence of records.",
    detail: "DSORG=PO. The directory at the front lists the members; USER01.JCL(HELLO) names member HELLO inside library USER01.JCL. Source code, JCL and procedures live in PDSs.",
    analogy: "Like a folder holding files - except it is one data set with a fixed-size directory, members cannot nest, and deleting the PDS deletes every member.",
    readMore: { resource: "redbook", section: "Chapter 5.4 Partitioned data sets" },
  },
  {
    term: "member",
    aliases: ["members", "pds member"],
    summary: "A named unit of records inside a partitioned data set; referred to as DSN(MEMBER).",
    detail: "Member names are 1-8 characters. The member list shows ISPF statistics: size (records), created and changed dates, and the ID that last saved it.",
  },
  {
    term: "PS",
    aliases: ["sequential data set", "sequential", "physical sequential"],
    summary: "A sequential data set: one stream of records with no members.",
    detail: "DSORG=PS. Browse, Edit and View open it directly from DSLIST; a member list does not exist for it.",
  },
  {
    term: "DSORG",
    aliases: ["organization", "data set organization"],
    summary: "Data set organization: PO (partitioned) or PS (sequential) in this simulator; real z/OS also has VSAM and others.",
    detail: "You see it in DSLIST and Data Set Information. It decides whether the data set has members.",
  },
  {
    term: "RECFM",
    aliases: ["record format"],
    summary: "Record format: F/FB fixed (blocked), V/VB variable (blocked), U undefined.",
    detail: "FB 80 is the classic card image used for JCL and source. RECFM and LRECL are chosen when a data set is allocated.",
  },
  {
    term: "LRECL",
    aliases: ["record length", "logical record length"],
    summary: "Logical record length in bytes - the width of every record in a fixed-format data set.",
    detail: "The editor pads and truncates to LRECL. With LRECL 80 only columns 1-72 are usually meaningful in JCL; 73-80 were sequence numbers on punched cards.",
  },
  {
    term: "volume",
    aliases: ["volser", "volume serial"],
    summary: "The disk (DASD volume) a data set lives on, identified by a six-character volume serial.",
    detail: "The catalog records which volume holds each data set, so you rarely need to type it. DSLIST shows it in the Volume column.",
  },
  {
    term: "catalog",
    aliases: ["listcat", "cataloged"],
    summary: "The system index that maps data-set names to the volumes that hold them.",
    detail: "DSLIST and the TSO LISTCAT command both read the catalog. DATA SET NOT CATALOGED means the name is unknown to it.",
  },
  {
    term: "allocate",
    aliases: ["allocation", "3.2", "data set utility"],
    summary: "Create a data set: reserve space on a volume and catalog the name (ISPF 3.2 option A or the TSO ALLOCATE command).",
    detail: "You choose space units and quantities, directory blocks (greater than zero makes a PDS), record format, record length and block size.",
    readMore: { resource: "mainframemaster-32", section: "Allocate" },
  },
  {
    term: "PF3",
    aliases: ["f3", "end", "pf keys", "pf key", "function keys"],
    summary: "Program Function key 3 = End: close the current panel and return to the previous one. In Edit, END saves first when the profile has AUTOSAVE ON (the usual default).",
    detail: "Other default keys: PF1 Help, PF2 Split, PF4 Return, PF5 repeat find, PF6 repeat change, PF7/PF8 scroll up/down, PF9 Swap, PF10/PF11 scroll left/right, PF12 Cancel (Edit) or Retrieve (elsewhere). PF-key assignments can vary by panel and keylist: check the function-key legend shown on the active panel.",
    readMore: { resource: "redbook", section: "Chapter 4.4.4 Using PF keys" },
  },
  {
    term: "keylist",
    aliases: ["key list", "pf key assignments", "function keys vary"],
    summary: "The table that says what each PF key does on a panel. PF-key assignments can vary by panel and keylist: check the function-key legend shown on the active panel.",
    detail: "ISPF ships default keylists (F1 Help, F2 Split, F3 End, F4 Return, F5 Rfind, F6 Rchange, F7 Up, F8 Down, F9 Swap, F10 Left, F11 Right, F12 Cancel/Retrieve) but applications and installations override them - the editor, for example, uses F12 for Cancel while most other panels use it for Retrieve. KEYLIST on a real system lets you view and change them.",
    readMore: { resource: "ispf-users-guide", section: "Working with function keys and keylists" },
  },
  {
    term: "jump",
    aliases: ["jump function", "=3.4", "=", "equals sign"],
    summary: "=option on any command line ends the current dialog and selects that option from the Primary Option Menu, e.g. =3.4 or =2.",
    detail: "The jump function is RETURN followed by the option: an open editor session is ended first (saved when AUTOSAVE is ON), the panel chain is unwound, and the new option is selected. Only the active logical screen is affected.",
    readMore: { resource: "ispf-users-guide", section: "Using the jump function" },
  },
  {
    term: "RETURN",
    aliases: ["pf4", "f4", "return command"],
    summary: "RETURN (PF4) ends every panel of the current chain and takes you back to the Primary Option Menu in one step.",
    detail: "Compare: PF3 (END) backs out one panel at a time; RETURN goes all the way home; =option is RETURN plus a new selection. On a real system RETURN may stop at the panel where a nested dialog started.",
    readMore: { resource: "ispf-users-guide", section: "Using the RETURN command" },
  },
  {
    term: "Enter",
    aliases: ["enter key", "aid key"],
    summary: "Sends everything you typed on the panel to ISPF at once. Until then nothing has happened.",
    detail: "The 3270 terminal buffers your typing locally; Enter and the PF keys are the attention keys that transmit it. This is why the editor processes text changes and line commands together.",
  },
  {
    term: "line command",
    aliases: ["line commands", "prefix command", "prefix area", "sequence area"],
    summary: "A short command typed in the column left of a list row or over the six-digit line number in the editor.",
    detail: "Lists: E Edit, B Browse, V View, M Member list, I Information, D Delete, R Rename, C Copy, M Move. Editor: I insert, D delete, R repeat, C copy, M move, A after, B before, X exclude, and block forms DD, RR, CC, MM, XX.",
    readMore: { resource: "ispf-edit", section: "Line commands" },
  },
  {
    term: "primary command",
    aliases: ["primary commands", "command line", "command ===>"],
    summary: "A command typed on the Command ===> line: SAVE, CANCEL, FIND, CHANGE, RESET, LOCATE, TOP, BOTTOM, UP, DOWN, LEFT, RIGHT.",
    detail: "Primary commands act on the whole member; line commands act on specific records. Abbreviations: F for FIND, C for CHANGE, L for LOCATE, X for EXCLUDE.",
    readMore: { resource: "ispf-edit", section: "Edit primary commands" },
  },
  {
    term: "E",
    aliases: ["edit", "edit command", "option 2"],
    summary: "Edit: open records in the ISPF editor with full change and SAVE ability.",
    detail: "From DSLIST or a member list type E next to the name. Option 2 opens the Edit Entry Panel where you type the name yourself. Editing a member that does not exist creates it on SAVE.",
  },
  {
    term: "B",
    aliases: ["browse"],
    summary: "Browse: read-only display of records. Nothing can be typed over; SAVE is refused.",
    detail: "Use it for anything you must not change by accident, such as production JCL or SYS1.PARMLIB members.",
  },
  {
    term: "V",
    aliases: ["view", "option 1"],
    summary: "View: looks like Edit, but SAVE is not allowed - changes are discarded when you leave.",
    detail: "Handy for experimenting with FIND/CHANGE on real data without any risk. Real ISPF can write from View with CREATE or REPLACE.",
  },
  {
    term: "M",
    aliases: ["member list", "move"],
    summary: "In DSLIST, M displays the member list of a PDS. In a member list, M moves a member to another data set. In the editor prefix area, M moves a line.",
    detail: "One letter, three contexts - which is why ISPF shows the legal line commands in the panel help (PF1).",
  },
  {
    term: "I",
    aliases: ["insert", "information"],
    summary: "In the editor prefix area, I inserts a blank line after this one (I5 inserts five). In DSLIST, I shows Data Set Information.",
    detail: "Inserted lines that stay blank disappear on the next Enter - ISPF assumes you did not want them.",
  },
  {
    term: "D",
    aliases: ["delete", "dd"],
    summary: "Delete: D removes one line (or a list entry, with confirmation); D3 removes three; DD on two lines removes the block between them.",
    detail: "There is no undo in classic ISPF Edit. CANCEL abandons all changes since the last SAVE.",
  },
  {
    term: "R",
    aliases: ["repeat", "rename", "rr"],
    summary: "In the editor prefix area R repeats a line (R3 three times, RR...RR a block). In lists, R renames a data set or member.",
    detail: "Repeat is the fastest way to duplicate a DD statement and then overtype the differences.",
  },
  {
    term: "C/A",
    aliases: ["c", "copy", "a", "after", "b", "before", "cc", "c a", "m a", "m b", "c b"],
    summary: "Two-part editor commands: C (copy) or M (move) marks the source; A (after) or B (before) marks the destination.",
    detail: "Press Enter with both marked, or mark the source, press Enter (it stays pending), then mark the destination. Block forms CC...CC and MM...MM mark a range. RESET clears a pending command.",
    readMore: { resource: "share-lab", section: "Copy, move, repeat" },
  },
  {
    term: "X",
    aliases: ["exclude", "xx", "excluded lines"],
    summary: "Exclude: hide lines from view (X, X5, XX...XX, or the EXCLUDE primary command). They still exist.",
    detail: "Excluded lines collapse into a dashed marker showing how many are hidden. S, F, L show them again; RESET shows everything.",
  },
  {
    term: "SAVE",
    aliases: ["save command"],
    summary: "Write the editor buffer to the member and stay in the editor.",
    detail: "Updates the member statistics. PF3 (END) also saves changed data when AUTOSAVE is ON in the edit profile, then ends. SAVE is refused in Browse and View.",
  },
  {
    term: "CANCEL",
    aliases: ["cancel command", "pf12"],
    summary: "Leave the editor discarding every change since the last SAVE.",
    detail: "Type CANCEL or CAN on the command line, or press PF12 where it is active.",
  },
  {
    term: "FIND",
    aliases: ["find command", "rfind", "pf5"],
    summary: "Search the member for a string from the cursor forward; PF5 (RFIND) repeats it.",
    detail: "FIND HELLO; FIND 'TWO WORDS'; FIND X ALL counts every hit; FIND X FIRST / LAST / PREV change direction. Case-insensitive by default.",
  },
  {
    term: "CHANGE",
    aliases: ["change command", "rchange", "pf6"],
    summary: "Replace the next occurrence of a string; CHANGE old new ALL replaces every one; PF6 (RCHANGE) repeats.",
    detail: "The message reports how many strings changed. Quote strings containing blanks.",
  },
  {
    term: "SPLIT",
    aliases: ["pf2", "f2", "split screen", "logical screen", "start"],
    summary: "PF2 / SPLIT opens a second logical screen; START does the same from a command line. Up to 8 screens, each with its own panels and editor.",
    detail: "The new screen starts on the Primary Option Menu. The SWAPBAR row lists every screen with * on the active one. PF3 or X on a screen’s Primary Option Menu ends that screen instead of logging off.",
    analogy: "Like browser tabs - but every tab is a full ISPF session with its own history, and there are never more than eight.",
    readMore: { resource: "ispf-users-guide", section: "Split-screen mode" },
  },
  {
    term: "SWAP",
    aliases: ["pf9", "f9", "swap list", "swapbar"],
    summary: "PF9 / SWAP switches to the next logical screen; SWAP n, SWAP PREV and SWAP LIST target a specific one.",
    detail: "Whatever you typed on the screen you leave is still there when you come back, and an editor session with unsaved changes stays open. The status line shows S1/2, S2/2.",
    readMore: { resource: "ispf-users-guide", section: "Split-screen mode" },
  },
  {
    term: "JCL",
    aliases: ["job control language", "job"],
    summary: "Job Control Language: the statements (// JOB, // EXEC, // DD) that tell z/OS how to run a batch job.",
    detail: "JCL lives in PDS members such as USER01.JCL(HELLO). Columns 1-2 are //, statements end by column 71, and //* starts a comment.",
    readMore: { resource: "redbook", section: "Chapter 6 Using JCL and SDSF" },
  },
  {
    term: "SYS1.PARMLIB",
    aliases: ["parmlib", "sys1", "system library"],
    summary: "The system parameter library: members such as IEASYS00 configure how z/OS starts.",
    detail: "Read-only in this simulator, as it would be for a trainee on a real system. Browse it; do not edit it.",
  },
];

export function explainTerm(query: string): GlossaryEntry | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return (
    GLOSSARY.find((g) => g.term.toLowerCase() === q || g.aliases.includes(q)) ??
    GLOSSARY.find((g) => g.term.toLowerCase().startsWith(q) || g.aliases.some((a) => a.startsWith(q))) ??
    GLOSSARY.find((g) => g.summary.toLowerCase().includes(q))
  );
}

export function searchGlossary(query: string): GlossaryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return GLOSSARY;
  return GLOSSARY.filter((g) => g.term.toLowerCase().includes(q) || g.aliases.some((a) => a.includes(q)) || g.summary.toLowerCase().includes(q));
}
