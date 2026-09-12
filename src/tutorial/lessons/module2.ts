/**
 * Module 2 - Data sets. Lessons 4-6.
 * Modelled on IBM Redbook SG24-6366 ch. 5 (data sets) and Mainframe Master "ISPF Data Set Utility (3.2)".
 */
import { anyOf, datasetExists, dslistShowing, editorOpen, eventIs, memberListOpen, onScreen } from "../validators";
import type { Lesson } from "../types";

export const lesson04: Lesson = {
  id: "l04-finding-data-sets",
  number: 4,
  module: "Data sets",
  title: "Finding your data sets",
  description: "Use the Dsname Level to list every data set that belongs to you.",
  objective: "Display all {HLQ} data sets in DSLIST.",
  teaches: ["High-level qualifier (HLQ)", "Dsname Level", "Data-set naming hierarchy", "DSORG, RECFM, LRECL columns"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" } },
  steps: [
    {
      id: "go-34",
      instruction: "Open the Data Set List Utility. Any route works: 3 then 4, or 3.4, or =3.4.",
      explanation: "Data-set names are made of qualifiers separated by periods: {HLQ}.JCL has two. The first one, the high-level qualifier, usually identifies the owner.",
      hint: "Type 3.4 and press Enter.",
      validator: onScreen("DSLIST_SEARCH"),
      highlightField: "option",
    },
    {
      id: "level",
      instruction: "The Dsname Level field already shows {HLQ}. Press Enter to list every data set whose name starts with it.",
      explanation: "A level is a name prefix. {HLQ} alone matches {HLQ}.JCL, {HLQ}.COBOL and everything else you own; {HLQ}.JCL would match only that library.",
      hint: "Leave {HLQ} in the field and press Enter.",
      validator: dslistShowing((level, ctx) => level.startsWith(ctx.hlq)),
      highlightField: "level",
    },
    {
      id: "read-columns",
      instruction: "Read the list. PO means partitioned (a library of members), PS means sequential (one stream of records). FB 80 is fixed-length 80-byte records - the classic card image. Press PF3 to go back to the entry panel.",
      explanation: "DSORG (organization), RECFM (record format) and LRECL (record length) are the attributes you will type when you create your own data sets in lesson 6.",
      hint: "Press F3.",
      validator: onScreen("DSLIST_SEARCH"),
    },
    {
      id: "narrow",
      instruction: "Change the Dsname Level to {HLQ}.JCL and press Enter to list only that library.",
      explanation: "Each extra qualifier narrows the search. On a real system with thousands of data sets this matters a lot.",
      hint: "Overtype the field with {HLQ}.JCL and press Enter.",
      validator: dslistShowing((level, ctx) => level === `${ctx.hlq}.JCL`),
      highlightField: "level",
    },
  ],
};

export const lesson05: Lesson = {
  id: "l05-data-sets-and-members",
  number: 5,
  module: "Data sets",
  title: "Data sets and members",
  description: "Open a partitioned data set and inspect its members and attributes.",
  objective: "Open {HLQ}.JCL, display its member list, and view its data-set information.",
  teaches: ["PDS versus member: {HLQ}.JCL versus {HLQ}.JCL(HELLO)", "Member list line commands", "The I (information) line command"],
  startingState: { screen: { id: "DSLIST_SEARCH" } },
  steps: [
    {
      id: "list",
      instruction: "List your data sets (Dsname Level {HLQ}, then Enter).",
      explanation: "A partitioned data set (PDS) is a library that holds named members. It is a bit like a folder, but it is one data set with a directory inside it - not a tree.",
      hint: "Press Enter with {HLQ} in the Dsname Level field.",
      validator: dslistShowing((level, ctx) => level.startsWith(ctx.hlq)),
      highlightField: "level",
    },
    {
      id: "info",
      instruction: "Type I in the command column next to {HLQ}.JCL and press Enter to see its Data Set Information.",
      explanation: "The I line command shows the attributes the system keeps: organization PO, record format FB, record length 80, block size, space and directory blocks.",
      hint: "Tab to the {HLQ}.JCL row, type I, Enter.",
      validator: onScreen("DATASET_INFO"),
      highlightField: "cmd:{HLQ}.JCL",
    },
    {
      id: "back",
      instruction: "Press PF3 to return to the list.",
      hint: "F3.",
      validator: onScreen("DSLIST_RESULTS"),
    },
    {
      id: "members",
      instruction: "Type M next to {HLQ}.JCL and press Enter to display its member list.",
      explanation: "{HLQ}.JCL is the library; {HLQ}.JCL(HELLO) names one member inside it. E, B, V on a PDS also open the member list, but M is the explicit way.",
      hint: "Type M on the {HLQ}.JCL row and press Enter.",
      validator: memberListOpen("{HLQ}.JCL"),
      highlightField: "cmd:{HLQ}.JCL",
    },
    {
      id: "read-members",
      instruction: "Read the member list: Name, Size (records), Created, Changed, ID. Then press PF3 to return to DSLIST.",
      explanation: "These are ISPF statistics. The editor keeps them up to date every time you save.",
      hint: "F3.",
      validator: onScreen("DSLIST_RESULTS"),
    },
  ],
};

export const lesson06: Lesson = {
  id: "l06-allocating",
  number: 6,
  module: "Data sets",
  title: "Allocating a data set",
  description: "Create a brand-new partitioned data set with the 3.2 Data Set Utility.",
  objective: "Allocate {HLQ}.TEST.JCL as a PDS (FB, LRECL 80, 10 directory blocks) and find it in 3.4.",
  teaches: ["3.2 Data Set Utility", "Allocate New Data Set panel", "Directory blocks decide PDS versus PS", "RECFM / LRECL choices"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" } },
  steps: [
    {
      id: "open-32",
      instruction: "Open the Data Set Utility: type 3.2 and press Enter.",
      explanation: "3.2 acts on whole data sets: allocate (create), rename, delete, information.",
      hint: "3.2 then Enter.",
      validator: onScreen("DATASET_UTILITY"),
      highlightField: "option",
    },
    {
      id: "allocate-panel",
      instruction: "Type A in the Option field, Tab to Other Data Set Name, type {HLQ}.TEST.JCL, and press Enter.",
      explanation: "Allocating is how you create a data set on z/OS. The system reserves space on a volume and adds the name to the catalog.",
      hint: "Option A; Data Set Name {HLQ}.TEST.JCL; Enter.",
      validator: onScreen("ALLOCATE_DATASET"),
      highlightField: "other",
    },
    {
      id: "fill-attributes",
      instruction: "Set Directory blocks to 10 (Tab to the field and overtype), keep Record format FB and Record length 80, then press Enter.",
      explanation: "Directory blocks greater than zero make a partitioned data set. Each block holds a handful of member entries; 10 is plenty for a training library.",
      hint: "Tab to Directory blocks, type 10, press Enter.",
      validator: eventIs("DATASET_ALLOCATED", (e, ctx) => e.dsn === `${ctx.hlq}.TEST.JCL`),
      highlightField: "dirblocks",
    },
    {
      id: "verify",
      instruction: "Go to 3.4 (PF3 to Utilities, then 4, or =3.4) and list {HLQ}.TEST to prove the data set exists. It should show DSORG PO.",
      explanation: "Every allocation is visible in DSLIST right away because the catalog was updated.",
      hint: "=3.4, Dsname Level {HLQ}.TEST, Enter.",
      validator: anyOf(
        dslistShowing((level, ctx) => level.startsWith(`${ctx.hlq}.TEST`) || level === ctx.hlq),
        editorOpen("{HLQ}.TEST.JCL"),
        memberListOpen("{HLQ}.TEST.JCL"),
      ),
    },
    {
      id: "still-there",
      instruction: "Done. The library is empty for now - lesson 13 fills it. (This step completes automatically.)",
      hint: "Nothing to do.",
      validator: datasetExists("{HLQ}.TEST.JCL"),
    },
  ],
};
