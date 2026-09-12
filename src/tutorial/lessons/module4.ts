/**
 * Module 4 - Managing members and data sets. Lessons 12-13.
 * Modelled on Mainframestechhelp "Library Utility", "Move | Copy" and "Data Set Utility" topics.
 */
import { allOf, anyOf, datasetExists, editorOpen, eventIs, memberExists, memberListOpen, onScreen } from "../validators";
import type { Lesson } from "../types";

export const lesson12: Lesson = {
  id: "l12-managing-members",
  number: 12,
  module: "Managing members and data sets",
  title: "Managing members",
  description: "Create, rename and delete members from a member list.",
  objective: "In {HLQ}.REXX: create a member SCRATCH, rename it to DRAFT, then delete it.",
  teaches: ["Creating a member via Edit", "Member statistics", "R rename with confirmation panel", "D delete with confirmation"],
  startingState: { screen: { id: "DSLIST_SEARCH" } },
  steps: [
    {
      id: "member-list",
      instruction: "Open the member list of {HLQ}.REXX in edit mode (Dsname Level {HLQ}.REXX, Enter, then E on the row).",
      hint: "{HLQ}.REXX, Enter, E.",
      validator: memberListOpen("{HLQ}.REXX"),
    },
    {
      id: "create",
      instruction: "On the Command ===> line type S SCRATCH and press Enter. A new, empty member opens in Edit.",
      explanation: "Editing a member that does not exist creates it - but only on SAVE. Until then it lives only in the editor.",
      hint: "S SCRATCH, Enter.",
      validator: editorOpen("{HLQ}.REXX", "SCRATCH", "EDIT"),
      highlightField: "command",
    },
    {
      id: "save-new",
      instruction: "The member is empty and that is fine. Type SAVE on the command line and press Enter, then press PF3 to return to the member list.",
      explanation: "SAVE on a new member writes it to the directory of the PDS. The member list will now show it with today's date.",
      hint: "SAVE, Enter, then F3.",
      validator: allOf(memberExists("{HLQ}.REXX", "SCRATCH"), memberListOpen("{HLQ}.REXX")),
      highlightField: "command",
    },
    {
      id: "rename",
      instruction: "Type R next to SCRATCH and press Enter; on the Rename panel type DRAFT as the new name and press Enter.",
      explanation: "Renaming a member only rewrites the directory entry; the records stay where they are.",
      hint: "R on SCRATCH → New Name DRAFT → Enter.",
      validator: eventIs("MEMBER_RENAMED", (e) => e.to === "DRAFT"),
    },
    {
      id: "delete",
      instruction: "Type D next to DRAFT, press Enter, and confirm with Enter on the Confirm Member Delete panel.",
      explanation: "ISPF confirms deletes when the Confirm Member Delete option is on (it is here). PF3 on the confirmation cancels.",
      hint: "D on DRAFT, Enter, Enter.",
      validator: allOf(eventIs("MEMBER_DELETED", (e) => e.member === "DRAFT"), memberExists("{HLQ}.REXX", "DRAFT", false)),
    },
  ],
};

export const lesson13: Lesson = {
  id: "l13-copy-across",
  number: 13,
  module: "Managing members and data sets",
  title: "Copying across data sets",
  description: "Move members between libraries with 3.3 and the member-list C command, then delete a data set.",
  objective: "Copy {HLQ}.JCL(HELLO) into {HLQ}.TEST.JCL two ways, then delete {HLQ}.TEST.JCL with 3.2.",
  teaches: ["3.3 Move/Copy Utility", "Member-list C with a target data set", "3.2 D delete with confirmation", "Allocation prerequisite"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" } },
  steps: [
    {
      id: "ensure-target",
      instruction: "Make sure {HLQ}.TEST.JCL exists (lesson 6 created it; if not, allocate it now with 3.2 A, 10 directory blocks). Then open 3.3.",
      hint: "If DSLIST does not show {HLQ}.TEST.JCL, do 3.2 → A first. Then 3.3.",
      validator: allOf(datasetExists("{HLQ}.TEST.JCL"), onScreen("MOVE_COPY")),
    },
    {
      id: "copy-33",
      instruction: "Option C, From {HLQ}.JCL(HELLO), To {HLQ}.TEST.JCL, then Enter.",
      explanation: "3.3 copies a member (or a whole sequential data set) into another data set. The member keeps its name unless you write a new one in parentheses on the To line.",
      hint: "C / {HLQ}.JCL(HELLO) / {HLQ}.TEST.JCL / Enter.",
      validator: eventIs("MEMBER_COPIED", (e, ctx) => e.to.dsn === `${ctx.hlq}.TEST.JCL`),
    },
    {
      id: "copy-list",
      instruction: "Now the member-list way: go to 3.4, open {HLQ}.JCL with E, type C next to COPYJOB, and give {HLQ}.TEST.JCL as the target.",
      explanation: "Most people copy from the member list because they are already there. C opens a small panel asking only for the target.",
      hint: "=3.4 → E on {HLQ}.JCL → C on COPYJOB → {HLQ}.TEST.JCL → Enter.",
      validator: eventIs("MEMBER_COPIED", (e, ctx) => e.from.member === "COPYJOB" && e.to.dsn === `${ctx.hlq}.TEST.JCL`),
    },
    {
      id: "delete-ds",
      instruction: "Finally remove the scratch library: open 3.2, option D with {HLQ}.TEST.JCL, and confirm the delete.",
      explanation: "Deleting a PDS deletes all of its members at once - there is no recycle bin on z/OS, which is why ISPF asks first.",
      hint: "=3.2 → D / {HLQ}.TEST.JCL → Enter → Enter.",
      validator: anyOf(eventIs("DATASET_DELETED", (e, ctx) => e.dsn === `${ctx.hlq}.TEST.JCL`), datasetExists("{HLQ}.TEST.JCL", false)),
    },
  ],
};
