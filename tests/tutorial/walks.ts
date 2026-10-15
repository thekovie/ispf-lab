/**
 * Shared lesson scripts for the M1a regression tests.
 *
 * - `Attempt` starts a lesson exactly as TutorialProvider does (same `startActions`) and feeds every action to the
 *   lesson runner.
 * - `WALKS` holds one legitimate full route per lesson. The same script must complete the lesson in Learn mode,
 *   in Challenge mode and on replay (tests/tutorial/challenge.test.ts).
 * - `SHORTCUTS` are cheap action sequences that do none of a lesson's work. They come from the Phase 0 and M0
 *   probes (docs/curriculum/evidence/probes/) and must never complete any lesson in Challenge mode.
 */
import { Sim } from "../engine/harness";
import { reduce } from "@/engine/reducer";
import { feedEvents, startRunner } from "@/tutorial/engine";
import { startActions } from "@/tutorial/scenario";
import type { AppMode, Lesson, RunnerState } from "@/tutorial/types";

export class Attempt {
  sim: Sim;
  runner: RunnerState;

  /** Start `lesson` in `mode`. Pass an existing `sim` to replay on top of whatever happened before. */
  constructor(readonly lesson: Lesson, readonly mode: AppMode = "learn", sim?: Sim) {
    this.sim = sim ?? Sim.loggedOn();
    this.sim.events = [];
    for (const action of startActions(this.sim.state, lesson.startingState)) this.sim.state = reduce(this.sim.state, action).state;
    this.sim.events = [];
    this.runner = startRunner(lesson, this.sim.state);
  }

  private feed() {
    const events = this.sim.events;
    this.sim.events = [];
    this.runner = feedEvents(this.lesson, this.runner, events, this.sim.state, this.mode).runner;
    return this.runner;
  }
  cmd(text: string) {
    this.sim.cmd(text);
    return this.feed();
  }
  enter(fields: Record<string, string> = {}) {
    this.sim.enter(fields);
    return this.feed();
  }
  pf(key: number, fields: Record<string, string> = {}) {
    this.sim.pf(key, fields);
    return this.feed();
  }
  get done() {
    return this.runner.status === "completed";
  }
  /** id of the first editor line whose text matches */
  lineId(re: RegExp): number {
    const line = this.sim.state.editor?.lines.find((l) => re.test(l.text));
    if (!line) throw new Error(`no editor line matching ${re}`);
    return line.id;
  }
}

export type Script = (c: Attempt) => void;

const HLQ = "USER01";
const entry = (dsn: string) => ({ project: "", group: "", type: "", member: "", other: dsn });
const openEdit = (c: Attempt, ref: string) => {
  c.cmd("2");
  c.enter(entry(ref));
};

/** PF3 until the Primary Option Menu shows (how many presses depends on how the learner got there). */
export function backToMenu(c: Attempt) {
  for (let i = 0; i < 6 && c.sim.state.screen.id !== "PRIMARY_OPTION_MENU"; i++) c.pf(3);
}

/** One legitimate full route per lesson (the Learn path). */
export const WALKS: Record<string, Script> = {
  "l01-meet-ispf": (c) => {
    c.enter({ userid: HLQ });
    c.pf(1);
    c.pf(3);
    c.cmd("99");
    c.enter({});
    c.pf(1);
    c.pf(3);
  },
  "l02-navigating": (c) => {
    c.cmd("3");
    c.cmd("4");
    c.pf(3);
    c.pf(3);
    c.cmd("3.4");
    c.pf(3);
    c.pf(3);
  },
  "l03-settings-tso": (c) => {
    c.cmd("0");
    c.pf(3, { scroll: "HALF" });
    c.cmd("6");
    c.cmd(`LISTCAT LEVEL(${HLQ})`);
    c.pf(3);
  },
  "l04-finding-data-sets": (c) => {
    c.cmd("3.4");
    c.enter({ level: HLQ });
    c.pf(3);
    c.enter({ level: `${HLQ}.JCL` });
  },
  "l05-data-sets-and-members": (c) => {
    c.enter({ level: HLQ });
    c.enter({ [`cmd:${HLQ}.JCL`]: "I" });
    c.pf(3);
    c.enter({ [`cmd:${HLQ}.JCL`]: "M" });
    c.pf(3);
  },
  "l06-allocating": (c) => {
    c.cmd("3.2");
    c.enter({ option: "A", other: `${HLQ}.TEST.JCL` });
    c.enter({ dirblocks: "10", recfm: "FB", lrecl: "80" });
    c.pf(3);
    c.cmd("4");
    c.enter({ level: `${HLQ}.TEST` });
  },
  "l07-browse-vs-edit": (c) => {
    c.enter({ level: `${HLQ}.JCL` });
    c.enter({ [`cmd:${HLQ}.JCL`]: "B" });
    c.enter({ "cmd:HELLO": "B" });
    c.cmd("SAVE");
    c.pf(3);
    c.pf(3);
    c.enter({ [`cmd:${HLQ}.JCL`]: "E" });
    c.enter({ "cmd:HELLO": "E" });
    c.pf(3);
  },
  "l08-first-edit": (c) => {
    c.enter({ level: `${HLQ}.JCL` });
    c.enter({ [`cmd:${HLQ}.JCL`]: "E" });
    c.enter({ "cmd:HELLO": "E" });
    c.enter({ "line:3": "//STEP1    EXEC PGM=IEBGENER" });
    c.enter({ command: "SAVE" });
    c.pf(3);
  },
  "l09-line-commands": (c) => {
    c.enter({ level: `${HLQ}.JCL` });
    c.enter({ [`cmd:${HLQ}.JCL`]: "E" });
    c.enter({ "cmd:HELLO": "E" });
    c.enter({ "prefix:1": "I00001" });
    const blank = c.sim.lineIds()[1];
    c.enter({ [`line:${blank}`]: "//* MY FIRST COMMENT" });
    c.enter({ [`prefix:${c.lineId(/NOTIFY/)}`]: "D" });
    c.enter({ [`prefix:${blank}`]: "R" });
    c.pf(3);
  },
  "l10-copy-move": (c) => {
    c.enter({ level: `${HLQ}.JCL` });
    c.enter({ [`cmd:${HLQ}.JCL`]: "E" });
    c.enter({ "cmd:SORTJOB": "E" });
    c.enter({ [`prefix:${c.lineId(/^\/\/SYSOUT/)}`]: "C", [`prefix:${c.lineId(/^\/\/SORTOUT/)}`]: "A" });
    c.enter({ [`prefix:${c.lineId(/^\/\/SORTIN/)}`]: "C", [`prefix:${c.lineId(/^\/\/SORT +EXEC/)}`]: "B" });
    c.enter({ [`prefix:${c.lineId(/^\/\/SYSIN/)}`]: "MM", [`prefix:${c.lineId(/SORT FIELDS/)}`]: "MM", [`prefix:${c.lineId(/^\/\*/)}`]: "A" });
    c.enter({ command: "CANCEL" });
  },
  "l11-find-change": (c) => {
    openEdit(c, `${HLQ}.COBOL(CUSTOMER)`);
    c.enter({ command: "FIND CUST" });
    for (let i = 0; i < 12; i++) c.pf(5);
    c.enter({ command: "CHANGE WS-CUST WS-CLIENT ALL" });
    c.enter({ command: "X DISPLAY ALL" });
    c.enter({ command: "RESET" });
    c.pf(3);
  },
  "l12-managing-members": (c) => {
    c.enter({ level: `${HLQ}.REXX` });
    c.enter({ [`cmd:${HLQ}.REXX`]: "E" });
    c.enter({ command: "S SCRATCH" });
    c.enter({ command: "SAVE" });
    c.pf(3);
    c.enter({ "cmd:SCRATCH": "R" });
    c.enter({ newname: "DRAFT" });
    c.enter({ "cmd:DRAFT": "D" });
    c.enter({ confirm: "Y" });
  },
  "l13-copy-across": (c) => {
    c.cmd("3.3");
    c.enter({ option: "C", from: `${HLQ}.JCL(HELLO)`, to: `${HLQ}.TEST.JCL` });
    c.cmd("=3.4");
    c.enter({ level: `${HLQ}.JCL` });
    c.enter({ [`cmd:${HLQ}.JCL`]: "E" });
    c.enter({ "cmd:COPYJOB": "C" });
    c.enter({ to: `${HLQ}.TEST.JCL` });
    c.cmd("=3.2");
    c.enter({ option: "D", other: `${HLQ}.TEST.JCL` });
    c.enter({ confirm: "Y" });
  },
  "l14-final-challenge": (c) => {
    openEdit(c, `${HLQ}.JCL(COPYJOB)`);
    c.enter({ "prefix:6": "I" });
    c.enter({ [`line:${c.sim.lineIds()[6]}`]: "//STEP2   EXEC PGM=IEFBR14" });
    c.enter({ command: "SAVE" });
  },
  "l15-split-screen": (c) => {
    openEdit(c, `${HLQ}.JCL(HELLO)`);
    c.pf(2);
    c.cmd("1");
    c.enter(entry(`${HLQ}.JCL(COPYJOB)`));
    c.pf(9);
    c.pf(9);
    c.pf(3);
    c.pf(3);
    c.pf(3);
    c.pf(3);
  },
  "l16-jump-return": (c) => {
    c.cmd("3.4");
    c.enter({ level: HLQ });
    c.cmd("=2");
    c.enter(entry(`${HLQ}.JCL(HELLO)`));
    c.cmd("=3.4");
    c.pf(4);
  },
  "l17-retrieve-multi": (c) => {
    c.cmd("3.4");
    c.enter({ level: HLQ });
    c.enter({ [`cmd:${HLQ}.COBOL`]: "X", [`cmd:${HLQ}.DATA`]: "X" });
    c.cmd("RESET");
    c.pf(12);
    backToMenu(c);
    c.pf(12);
    c.pf(12);
    c.pf(12);
    c.enter({ option: "3.4" });
  },
  "l18-cols-bounds": (c) => {
    openEdit(c, `${HLQ}.COBOL(HELLO)`);
    c.enter({ command: "COLS" });
    c.enter({ command: "BOUNDS 8 72" });
    c.enter({ command: "FIND DIVISION" });
    c.enter({ command: "RESET" });
    c.pf(3);
  },
  "l19-profiles": (c) => {
    openEdit(c, `${HLQ}.JCL(HELLO)`);
    c.enter({ command: "PROFILE" });
    c.enter({ command: "CAPS ON" });
    c.pf(3);
    c.enter(entry(`${HLQ}.JCL(COPYJOB)`));
    c.enter({ command: "CAPS OFF" });
    c.pf(3);
  },
  "l20-undo-recovery": (c) => {
    openEdit(c, `${HLQ}.JCL(HELLO)`);
    c.enter({ "prefix:3": "D" });
    c.enter({ command: "UNDO" });
    c.enter({ command: "RECOVERY ON" });
    c.enter({ command: "CANCEL" });
  },
  "l21-exclude-flip": (c) => {
    openEdit(c, `${HLQ}.COBOL(HELLO)`);
    c.enter({ command: "X DIVISION ALL" });
    c.enter({ command: "FLIP" });
    c.enter({ command: "RESET" });
    c.pf(3);
  },
  "l22-dslist-advanced": (c) => {
    c.cmd("3.4");
    c.enter({ level: HLQ });
    c.cmd("SORT LRECL D");
    c.cmd("FIND COBOL");
    c.cmd("EXCLUDE LOADLIB");
    c.enter({ [`cmd:${HLQ}.JCL`]: "S" });
    c.pf(3);
    c.cmd("RESET");
  },
  "l23-member-info": (c) => {
    c.cmd("2");
    c.enter({ other: `${HLQ}.JCL` });
    c.enter({ "cmd:HELLO": "I" });
    c.pf(3);
    c.enter({ "cmd:HELLO": "G" });
    c.enter({ "cmd:HELLO": "I" });
    c.pf(3);
  },
  "l24-submit": (c) => {
    openEdit(c, `${HLQ}.JCL(HELLO)`);
    c.enter({ command: "SUBMIT" });
    c.pf(3);
  },
  "l25-sdsf-status": (c) => {
    c.cmd("2");
    c.enter({ other: `${HLQ}.JCL` });
    c.enter({ "cmd:HELLO": "J" });
    c.cmd("=S");
    c.cmd("ST");
    c.enter({ "cmd:JOB00001": "S" });
    c.pf(3);
    c.pf(3);
  },
  "l26-job-output": (c) => {
    c.cmd("TSO SUBMIT JCL(SORTJOB)");
    c.cmd("=S");
    c.cmd("ST");
    c.enter({ "cmd:JOB00001": "?" });
    c.enter({ "cmd:SORTOUT": "S" });
    c.pf(3);
    c.enter({ "cmd:JESMSGLG": "S" });
    c.pf(3);
  },
  "l27-jcl-error": (c) => {
    c.cmd("TSO SUBMIT JCL(PAYRPT)");
    c.cmd("=S");
    c.cmd("ST");
    c.enter({ "cmd:JOB00001": "?" });
    c.enter({ "cmd:JESYSMSG": "S" });
    c.pf(3);
    c.pf(3);
    c.enter({ "cmd:JOB00001": "SJ" });
    c.enter({ command: "C PAYROLL.DATA DATA(EMPLOYEE)" });
    c.enter({ command: "SUBMIT" });
    c.pf(3);
  },
  "l28-day-one": (c) => {
    c.cmd("TSO SUBMIT JCL(PAYRPT)");
    c.cmd("=S");
    c.cmd("ST");
    c.enter({ "cmd:JOB00001": "?" });
    c.enter({ "cmd:JESYSMSG": "S" });
    c.pf(3);
    c.pf(3);
    c.enter({ "cmd:JOB00001": "SJ" });
    c.enter({ command: "C PAYROLL.DATA DATA(EMPLOYEE)" });
    c.enter({ command: "SUBMIT" });
    c.pf(3);
    c.enter({ "cmd:JOB00002": "?" });
    c.enter({ "cmd:SYSUT2": "S" });
  },
};

WALKS["a-01-panel-fields-scroll"] = (c) => {
  openEdit(c, `${HLQ}.DATA(SCROLL)`);
  c.pf(8);
  c.pf(8, { scroll: "HALF" });
  c.enter({ command: "DOWN 3" });
  c.enter({ command: "DOWN MAX" });
  c.pf(3);
};

WALKS["b-01-zos-big-picture"] = (c) => {
  c.cmd("6");
  c.enter({ command: `LISTDS '${HLQ}.JCL'` });
  c.pf(3);
  openEdit(c, `${HLQ}.JCL(HELLO)`);
  c.enter({ command: "SUBMIT" });
  c.pf(3);
  c.cmd("=S");
  c.cmd("ST");
  c.enter({ "cmd:JOB00001": "S" });
  c.pf(3);
};

const E = (ref: string) => entry(ref);

/**
 * Cheap sequences that do none of a lesson's work (Phase 0 audit probes b, c, l, n and M0 review probes
 * m0-challenge, m0-single, m0-seq). None may complete any lesson in Challenge mode.
 */
export const SHORTCUTS: Record<string, Script> = {
  "no action": () => {},
  "empty Enter": (c) => void c.enter({}),
  "PF7, PF8, PF3": (c) => {
    c.pf(7);
    c.pf(8);
    c.pf(3);
  },
  "HELP": (c) => void c.cmd("HELP"),
  "type 3.4": (c) => void c.cmd("3.4"),
  "jump =S": (c) => void c.cmd("=S"),
  "jump =3.4 then RETURN": (c) => {
    c.cmd("=3.4");
    c.cmd("RETURN");
  },
  "jump =3.4 then PF4": (c) => {
    c.cmd("=3.4");
    c.pf(4);
  },
  "settings then PF4": (c) => {
    c.cmd("0");
    c.pf(4);
  },
  "open a member list": (c) => {
    c.cmd("=2");
    c.enter(E(`'${HLQ}.JCL'`));
  },
  "3.4, level, RESET": (c) => {
    c.cmd("=3.4");
    c.enter({ level: HLQ });
    c.cmd("RESET");
  },
  "edit HELLO then SAVE unchanged": (c) => {
    c.cmd("=2");
    c.enter(E(`'${HLQ}.JCL(HELLO)'`));
    c.cmd("SAVE");
  },
  "edit HELLO then CANCEL": (c) => {
    c.cmd("=2");
    c.enter(E(`'${HLQ}.JCL(HELLO)'`));
    c.cmd("CANCEL");
  },
  "edit HELLO, CAPS OFF, PF3": (c) => {
    c.cmd("=2");
    c.enter(E(`'${HLQ}.JCL(HELLO)'`));
    c.cmd("CAPS OFF");
    c.pf(3);
  },
  "edit, split, swap back and forth": (c) => {
    c.cmd("=2");
    c.enter(E(`'${HLQ}.JCL(HELLO)'`));
    c.pf(2);
    c.pf(9);
    c.pf(9);
  },
};
