/**
 * Module 11 - Foundations (M3). Lesson specs: docs/curriculum/lessons/<id>.md. Review status of every lesson here: draft
 * (author-checked against the sources named in the spec; independent source, fidelity and expert review pending).
 */
import { editorClosed, editorOpen, eventIs } from "../validators";
import type { Lesson, Validator } from "../types";

const MODULE = "Foundations";

/** The Scroll amount currently held by the open edit session. */
const scrollIs =
  (amount: string): Validator =>
  ({ state }) =>
    state.editor?.scrollAmount.toUpperCase() === amount;

const SCROLL_LINES = Array.from({ length: 60 }, (_, i) => `PRACTICE LINE ${String(i + 1).padStart(3, "0")} OF 060`);

export const lessonA01: Lesson = {
  id: "a-01-panel-fields-scroll",
  number: 29,
  module: MODULE,
  title: "Panel fields and the Scroll amount",
  description: "Find the Scroll field on an Edit panel, change it, and see the difference between the field and a one-time amount.",
  objective: "Open {HLQ}.DATA(SCROLL) in Edit, scroll a page, set the Scroll field to HALF and scroll half a page, then use DOWN 3 once without changing the field.",
  teaches: [
    "The Scroll ===> field holds the scroll amount; type over it to change it",
    "PAGE is a full screen, HALF is half a screen, a number is that many lines",
    "An amount given with the scroll command (DOWN 3) is one-time and leaves the field alone",
    "MAX goes to the end of the data, once",
  ],
  requires: ["l01-meet-ispf"],
  sources: ["SRC-013"],
  startingState: {
    screen: { id: "PRIMARY_OPTION_MENU" },
    resetSettings: ["scrollDefault"],
    createMembers: [{ dsn: "{HLQ}.DATA", member: "SCROLL", records: SCROLL_LINES }],
  },
  steps: [
    {
      id: "open",
      instruction: "Open {HLQ}.DATA(SCROLL) in Edit: option 2, then {HLQ}.DATA(SCROLL) in Other Data Set Name.",
      explanation:
        "The member has 60 numbered lines, more than one screen. On line 2, after Command ===>, there is a short input field marked Scroll ===> . Many ISPF panels carry one; it says how far each scroll key moves the data.",
      hint: "2, Enter, {HLQ}.DATA(SCROLL), Enter.",
      validator: editorOpen("{HLQ}.DATA", "SCROLL", "EDIT"),
      highlightField: "scroll",
    },
    {
      id: "page",
      instruction: "The Scroll field shows PAGE. Press PF8 (Down): the data moves down one full page.",
      explanation: "PAGE means the full height of the scrollable area. Watch the line numbers: the first line shown is now one screen further on.",
      hint: "F8.",
      validator: eventIs("EDITOR_SCROLLED", (e) => e.amount === "PAGE"),
    },
    {
      id: "half",
      instruction: "Type HALF over PAGE in the Scroll ===> field, then press PF8. This time the data moves half a page.",
      explanation:
        "The Scroll field is an ordinary input field: typing over it changes the amount until you change it again. HALF is half the height of the scrollable area. A number would move that many lines.",
      hint: "Tab to Scroll ===> , type HALF, press F8.",
      validator: eventIs("EDITOR_SCROLLED", (e) => e.amount === "HALF"),
      highlightField: "scroll",
    },
    {
      id: "once",
      instruction: "Type DOWN 3 on the Command ===> line and press Enter. The data moves 3 lines, and the Scroll field still says HALF.",
      explanation:
        "An amount typed with the scroll command is a temporary, one-time override: it is used once and the field is not touched. That is the difference between the field (a standing setting) and the command (this one move).",
      hint: "DOWN 3, Enter.",
      validator: (ctx) => eventIs("EDITOR_SCROLLED", (e) => e.amount === "3")(ctx) && scrollIs("HALF")(ctx),
      highlightField: "command",
    },
    {
      id: "max",
      instruction: "Type DOWN MAX and press Enter. The last page of data shows, and the field still says HALF.",
      explanation:
        "MAX goes to the limit of the data in the direction you scroll, and it applies only to that scroll. (Real ISPF keeps separate saved amounts for Browse, for Edit and View, and for member lists; this simulator keeps one per edit session, and only the Edit panel's field can be changed. DATA and CSR also scroll a full page here, and the 'number, then the scroll key' form is not supported.)",
      hint: "DOWN MAX, Enter.",
      validator: eventIs("EDITOR_SCROLLED", (e) => e.amount === "MAX"),
    },
    {
      id: "leave",
      instruction: "Press PF3 to leave the member. You changed nothing, so there is nothing to save.",
      hint: "F3.",
      validator: editorClosed,
    },
  ],
};
