/**
 * Module 6 - Split screen. Lesson 15.
 * Modelled on z/OS ISPF User's Guide Vol I, "Split-screen mode" (SPLIT, SWAP, START, SWAPBAR).
 */
import { allOf, anyOf, editorOpen, eventIs, onScreen } from "../validators";
import type { Lesson } from "../types";

export const lesson15: Lesson = {
  id: "l15-split-screen",
  number: 15,
  module: "Split screen",
  title: "Working in two screens",
  description: "Open a second logical screen, look at one member while editing another, and swap between them.",
  objective: "Edit {HLQ}.JCL(HELLO) in screen 1, view {HLQ}.JCL(COPYJOB) in screen 2, swap between them, then end screen 2.",
  teaches: ["PF2 = SPLIT opens a logical screen", "PF9 = SWAP switches screens", "Each screen has its own panel stack and editor", "PF3 on a screen's Primary Option Menu ends that screen", "The SWAPBAR row"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" }, resetMembers: [{ dsn: "{HLQ}.JCL", member: "HELLO" }] },
  steps: [
    {
      id: "edit-hello",
      instruction: "Open {HLQ}.JCL(HELLO) in Edit (option 2 with the full name is fastest).",
      explanation: "This is the screen you will keep working in. Real ISPF users almost always have two screens open: one to edit, one to look things up.",
      hint: "2, Enter, then {HLQ}.JCL(HELLO) in Other Data Set Name.",
      validator: editorOpen("{HLQ}.JCL", "HELLO", "EDIT"),
    },
    {
      id: "split",
      instruction: "Press PF2 (SPLIT). A second logical screen opens on the Primary Option Menu; the editor is still alive in screen 1. Notice the SWAPBAR row above the PF legend.",
      explanation: "ISPF supports up to 8 logical screens (SPLIT/START). Each one has its own panel stack, so screen 2 starts at the Primary Option Menu while screen 1 stays in the editor.",
      hint: "Press F2, or click the F2 button.",
      validator: eventIs("SCREEN_SPLIT"),
    },
    {
      id: "browse-copyjob",
      instruction: "In screen 2, open {HLQ}.JCL(COPYJOB) read-only: option 1 (View) with the full name, or 3.4 → B on the library → B on COPYJOB (Browse).",
      explanation: "Reading a reference member in the second screen is the classic pattern: you can copy statements by eye without any risk of changing it.",
      hint: "1, Enter, {HLQ}.JCL(COPYJOB).",
      validator: allOf(anyOf(editorOpen("{HLQ}.JCL", "COPYJOB", "BROWSE"), editorOpen("{HLQ}.JCL", "COPYJOB", "VIEW")), ({ state }) => state.activeScreen === 1),
    },
    {
      id: "swap-back",
      instruction: "Press PF9 (SWAP). You are back in the editor on HELLO, exactly where you left it. Press PF9 again to return to COPYJOB.",
      explanation: "SWAP cycles through the screens; SWAP 2 or SWAP LIST on any command line target a specific one. The status line shows S1/2, S2/2.",
      hint: "F9, then F9.",
      validator: eventIs("SCREEN_SWAPPED", (e) => e.to === 1),
    },
    {
      id: "end-screen",
      instruction: "End screen 2: press PF3 to leave View, then PF3 on its Primary Option Menu. ISPF ends the screen and drops you back into screen 1.",
      explanation: "PF3 on the Primary Option Menu logs off when it is the only screen; with two screens it just ends that screen. X on the Option line does the same.",
      hint: "F3 until the SWAPBAR disappears (2-4 presses depending on how you opened COPYJOB).",
      validator: allOf(eventIs("SCREEN_CLOSED"), onScreen("EDIT")),
    },
    {
      id: "leave",
      instruction: "Press PF3 to leave the editor (nothing changed, so nothing is saved).",
      hint: "F3.",
      validator: ({ state }) => !state.editor && state.screens.length <= 1,
    },
  ],
};
