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
  {
    term: "UNDO",
    aliases: ["undo command", "take back"],
    summary: "Edit primary command that reverses the changes made by the last interaction (one Enter or PF key), newest first.",
    detail: "UNDO works interaction by interaction, not keystroke by keystroke: everything one Enter did (typed text, several line commands) is taken back together. It needs SETUNDO ON (in-storage) or RECOVERY ON. SAVE is a boundary: changes made before the last SAVE cannot be undone. Messages: UNDO COMPLETE, NO MORE TO UNDO, UNDO NOT AVAILABLE, SETUNDO OFF.",
    readMore: { resource: "ispf-edit", section: "UNDO - reverse last edit interaction" },
  },
  {
    term: "SETUNDO",
    aliases: ["setundo on", "setundo off", "setundo storage"],
    summary: "Edit profile setting that keeps undo information in storage so UNDO works without a recovery data set.",
    detail: "SETUNDO ON (or STORAGE) records each interaction; SETUNDO OFF disables UNDO unless RECOVERY is ON. The setting is saved in the edit profile. Real installations may ship it OFF; type PROFILE to see the current value.",
    readMore: { resource: "ispf-edit", section: "SETUNDO - set UNDO mode" },
  },
  {
    term: "RECOVERY",
    aliases: ["edit recovery", "recovery on", "recovery off", "recovry"],
    summary: "Edit profile setting that journals your changes to a recovery data set so an interrupted session can be recovered (and UNDO works).",
    detail: "On a real system RECOVERY ON writes a recovery table and offers 'Edit - Recovery' the next time you enter Edit after an abend or a lost session. In this simulator RECOVERY only enables UNDO; no recovery data set is created.",
    readMore: { resource: "ispf-edit", section: "RECOVERY - control edit recovery" },
  },
  {
    term: "BOUNDS",
    aliases: ["bnds", "=bnds>", "bounds line", "column bounds"],
    summary: "The left and right columns that FIND, CHANGE and EXCLUDE search. BOUNDS l r sets them; BNDS shows an editable =BNDS> line.",
    detail: "The default bounds are 1 and the record length. Narrow them (BOUNDS 20 72) to change text only in a column range - typical for fixed-format languages. On the =BNDS> line, type < for the left bound and > for the right one. Overtyping records is not limited by the bounds. Bounds are kept in the edit profile.",
    readMore: { resource: "ispf-edit", section: "BOUNDS - control the search bounds" },
  },
  {
    term: "COLS",
    aliases: ["=cols>", "column ruler", "cols line"],
    summary: "Shows a column ruler (=COLS>) so you can see which column text is in. COLS as a primary command puts it at the top; COLS in the prefix area puts it after that line.",
    detail: "The ruler is a special line: it is displayed but never saved. Delete it with D in its prefix area, RESET SPECIAL, or RESET. Columns matter on z/OS: JCL must not go past column 71 and COBOL divisions start in area A (columns 8-11).",
    readMore: { resource: "ispf-edit", section: "COLS - display a column identification line" },
  },
  {
    term: "PROFILE",
    aliases: ["edit profile", "prof", "=prof>", "profile lines"],
    summary: "The set of editor options remembered per data set type (last qualifier): CAPS, NUMBER, STATS, RECOVERY, SETUNDO, AUTOSAVE, BOUNDS and more.",
    detail: "Type PROFILE to display =PROF> lines describing the current profile; type RESET to remove them. ISPF names the profile after the data set type, so editing anything ending in .JCL uses the JCL profile. Changing a setting (CAPS ON, AUTOSAVE OFF ...) updates the profile and is remembered for the next edit session of that type.",
    readMore: { resource: "ispf-edit", section: "PROFILE - control/display profile" },
  },
  {
    term: "AUTOSAVE",
    aliases: ["autosave on", "autosave off", "autosave prompt", "autosave off prompt", "autosave off noprompt"],
    summary: "Edit profile setting that decides what END (PF3) does with unsaved changes: ON saves; OFF PROMPT asks; OFF NOPROMPT discards.",
    detail: "AUTOSAVE ON is the usual default, which is why PF3 seems to save. With AUTOSAVE OFF PROMPT, END shows the 'Edit - Save or Cancel Changes' panel. With AUTOSAVE OFF NOPROMPT, END ends without saving - use SAVE explicitly. Jumping (=3.4) and RETURN run END processing and follow the same rule.",
    readMore: { resource: "ispf-edit", section: "AUTOSAVE - save data automatically" },
  },
  {
    term: "NUMBER",
    aliases: ["num", "number on", "number off", "unnum", "sequence numbers", "line numbers"],
    summary: "Edit profile setting that maintains sequence numbers inside the records (columns 73-80 for 80-byte fixed records).",
    detail: "NUMBER ON renumbers the data in steps of 100; UNNUM removes the numbers. The prefix-area numbers on the left are display only - NUMBER is about numbers stored in the data. This simulator implements the standard 80-byte case (STD numbers in 73-80) only; COBOL numbers in 1-6 are not simulated.",
    readMore: { resource: "ispf-edit", section: "NUMBER - generate sequence numbers" },
  },
  {
    term: "STATS",
    aliases: ["stats on", "stats off", "member statistics", "ispf statistics"],
    summary: "Edit profile setting that controls whether the member's ISPF statistics (version, modification level, dates, userid) are updated on save.",
    detail: "With STATS ON (default) each save bumps the modification level, sets the changed date and time, and records your userid. With STATS OFF the statistics are left untouched, as when maintaining members that other tools own. The statistics appear in the member list.",
    readMore: { resource: "ispf-edit", section: "STATS - generate statistics" },
  },
  {
    term: "FLIP",
    aliases: ["flip command", "flip excluded"],
    summary: "Edit primary command that reverses the excluded status of every line: excluded lines are shown and shown lines are excluded.",
    detail: "Useful after EXCLUDE ALL or X commands: FLIP lets you look at 'everything else'. RESET (or RESET EXCLUDED / RESET X) shows all lines again.",
    readMore: { resource: "ispf-edit", section: "FLIP - reverse exclude status" },
  },
  {
    term: "RETRIEVE",
    aliases: ["retrieve command", "pf12 retrieve", "command retrieval", "command stack"],
    summary: "Brings the previous command back into the command line so you can edit and re-run it; repeat to go further back.",
    detail: "ISPF keeps a stack of the commands you entered (25 in this simulator). RETRIEVE or PF12 on most panels refills the command line with the most recent one, then the one before, and so on. In Edit PF12 is Cancel, so type RETRIEVE there.",
    readMore: { resource: "ispf-users-guide", section: "RETRIEVE command" },
  },
  {
    term: "JES",
    aliases: ["jes2", "jes3", "job entry subsystem", "spool"],
    summary: "Job Entry Subsystem - the z/OS component that receives submitted jobs, queues them, runs them through initiators and keeps their output on the spool.",
    detail: "JES2 (most sites) or JES3 reads the JCL, converts it, schedules the job on an initiator by class, and collects everything the job prints - JESMSGLG, JESJCL, JESYSMSG and SYSOUT data sets - on the spool until it is printed or purged. SDSF is the window onto JES. In this simulator the job runs to completion the instant you submit it; on a real system it waits in the input queue for an initiator.",
    readMore: { resource: "redbook", section: "Chapter 6 Using JCL, JES and SDSF" },
  },
  {
    term: "SDSF",
    aliases: ["system display and search facility", "spool display", "option s", "sdsf st"],
    summary: "System Display and Search Facility - the ISPF application for looking at jobs, their status, their output and the system log.",
    detail: "ST shows the status of your jobs (JOBNAME, JobID, Owner, Max-RC), O the output queue, DA active users, LOG the system log. On a job line type S to browse all its output, ? to list its spool data sets, P to purge it, SJ to edit the JCL that was submitted. OWNER and PREFIX filter the list. The option letter that opens SDSF varies by site: S, SD or M.5 are common. Everything here is labelled (SIMULATED).",
    readMore: { resource: "redbook", section: "Chapter 6.3 SDSF" },
  },
  {
    term: "job",
    aliases: ["batch job", "job id", "jobid", "job00001", "jobname"],
    summary: "A unit of batch work described by JCL: a JOB statement, one or more EXEC steps, and DD statements for their data sets. JES gives it a job id like JOB00001.",
    detail: "The job name comes from the JOB statement (site rules often want your userid plus a letter). Each EXEC step runs one program and ends with a condition code; the highest is the job's Max-RC. A job that never ran because its JCL was wrong shows JCL ERROR; one that failed while running shows an ABEND code.",
    readMore: { resource: "redbook", section: "Chapter 6.1 Batch processing and JCL" },
  },
  {
    term: "JCL",
    aliases: ["job control language", "jcl statement", "exec", "dd statement"],
    summary: "Job Control Language - the statements (JOB, EXEC, DD) that tell z/OS which programs to run and which data sets they use.",
    detail: "Every statement starts with // in columns 1-2; //* is a comment; a null // ends the job. Operands end at the first blank; a trailing comma continues on the next line, which must start with // and a blank. Columns 73-80 are ignored - a statement that runs past column 71 is a classic JCL ERROR. EXEC PGM=name runs a program; DD ties a ddname the program expects (SYSUT1, SYSPRINT ...) to a data set, SYSOUT=* (the spool) or in-stream data (DD * ... /*).",
    readMore: { resource: "redbook", section: "Chapter 6.2 JCL" },
  },
  {
    term: "JCL ERROR",
    aliases: ["jcl error", "iefc452i", "job not run", "iefc605i", "ief212i"],
    summary: "The job did not run (or a step was skipped) because JES or the allocation routines rejected the JCL: a misspelled statement, a missing continuation, an unknown keyword or a data set that does not exist.",
    detail: "Converter errors (IEFC605I UNIDENTIFIED OPERATION FIELD, IEFC621I EXPECTED CONTINUATION NOT RECEIVED, IEFC630I UNIDENTIFIED KEYWORD) stop the job before any step runs: JESMSGLG says IEFC452I JOB NOT RUN - JCL ERROR and JESYSMSG lists the statement numbers. Allocation errors (IEF212I DATA SET NOT FOUND) happen when a step starts: that step and the following ones show STEP WAS NOT EXECUTED. Read JESYSMSG first - it names the statement.",
    readMore: { resource: "redbook", section: "Chapter 6.4 Reading job output" },
  },
  {
    term: "condition code",
    aliases: ["cond code", "cc 0000", "max-rc", "return code", "rc=0000", "abend"],
    summary: "The number a program returns when a step ends (0 = fine, 4 = warning, 8+ = error by convention); SDSF shows the highest one as Max-RC, e.g. CC 0000.",
    detail: "IEF142I STEP WAS EXECUTED - COND CODE 0004 in JESYSMSG is the per-step value. An ABEND (abnormal end) is different: the step was cut short by the system with a code like S806 (module not found) or S0C7 (data exception); SDSF shows ABEND S806 instead of a CC.",
    readMore: { resource: "redbook", section: "Chapter 6.4 Reading job output" },
  },
  {
    term: "JESMSGLG",
    aliases: ["jesjcl", "jesysmsg", "job log", "spool data set", "sysout"],
    summary: "The three data sets JES keeps for every job: JESMSGLG (job log with $HASP and IEF messages and step return codes), JESJCL (the JCL as read, numbered) and JESYSMSG (allocation, JCL error and abend messages). SYSOUT DDs add the program output.",
    detail: "In SDSF type ? next to a job to list them and S to browse one. When something went wrong, JESYSMSG has the reason and the statement number; JESMSGLG has the summary line ($HASP395 ... ENDED - RC=0000 or JCL ERROR).",
    readMore: { resource: "redbook", section: "Chapter 6.4 Reading job output" },
  },
  {
    term: "SUBMIT",
    aliases: ["sub", "submit command", "line command j"],
    summary: "Sends JCL to JES: SUBMIT in the editor, J next to a member in a member list, or TSO SUBMIT dsn(member).",
    detail: "ISPF answers IKJ56250I JOB name(JOB00001) SUBMITTED. Real ISPF submits the data set on disk, so an unsaved change is not submitted; this simulator submits the editor buffer so you can experiment, and says so in the docs. Then go to SDSF (option S) to see how the job ended.",
    readMore: { resource: "redbook", section: "Chapter 6.2 JCL" },
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
