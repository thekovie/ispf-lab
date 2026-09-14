import { describe, expect, it } from "vitest";
import { Sim } from "./harness";
import { MAX_SCREENS, allSessions, describeSession } from "@/engine/splitScreen";
import { parseSystemCommand } from "@/engine/systemCommands";

describe("system command parsing", () => {
  it("recognises SPLIT, START and SWAP variants", () => {
    expect(parseSystemCommand("split")).toEqual({ kind: "split" });
    expect(parseSystemCommand("START")).toEqual({ kind: "start" });
    expect(parseSystemCommand("swap")).toEqual({ kind: "swap", target: "NEXT" });
    expect(parseSystemCommand("SWAP PREV")).toEqual({ kind: "swap", target: "PREV" });
    expect(parseSystemCommand("swap 2")).toEqual({ kind: "swap", target: 2 });
    expect(parseSystemCommand("SWAP LIST")).toEqual({ kind: "swap", target: "LIST" });
    expect(parseSystemCommand("3.4")).toBeNull();
    expect(parseSystemCommand("")).toBeNull();
  });
});

describe("split and swap", () => {
  it("PF2 opens a second logical screen on the Primary Option Menu", () => {
    const s = Sim.loggedOn().cmd("3.4");
    s.pf(2);
    expect(s.screenId).toBe("PRIMARY_OPTION_MENU");
    expect(s.state.activeScreen).toBe(1);
    expect(allSessions(s.state).length).toBe(2);
    expect(s.has("SCREEN_SPLIT")).toBe(true);
    expect(s.message).toBe("SCREEN 2 OF 2");
  });
  it("PF9 swaps back to the first screen with its panel stack intact", () => {
    const s = Sim.loggedOn().cmd("3.4").pf(2).pf(9);
    expect(s.screenId).toBe("DSLIST_SEARCH");
    expect(s.state.activeScreen).toBe(0);
    expect(s.state.stack.map((f) => f.id)).toEqual(["PRIMARY_OPTION_MENU", "UTILITY_SELECTION"]);
    expect(s.has("SCREEN_SWAPPED")).toBe(true);
  });
  it("each screen keeps its own editor session, including unsaved changes", () => {
    const s = Sim.loggedOn().cmd("2").enter({ other: "USER01.JCL(HELLO)" });
    s.enter({ "line:3": "//STEP1    EXEC PGM=CHANGED" });
    expect(s.state.editor?.dirty).toBe(true);
    s.cmd("SPLIT"); // typed on the editor command line
    expect(s.screenId).toBe("PRIMARY_OPTION_MENU");
    expect(s.state.editor).toBeUndefined();
    s.cmd("3.4").enter({ level: "USER01.JCL" }).enter({ "cmd:USER01.JCL": "B" }).enter({ "cmd:COPYJOB": "B" });
    expect(s.state.editor?.mode).toBe("BROWSE");
    s.cmd("SWAP");
    expect(s.state.editor?.mode).toBe("EDIT");
    expect(s.state.editor?.dirty).toBe(true);
    expect(s.texts()[2]).toContain("CHANGED");
    s.cmd("SWAP 2");
    expect(s.state.editor?.member).toBe("COPYJOB");
  });
  it("typed drafts are kept with the screen they were typed on", () => {
    const s = Sim.loggedOn().cmd("3.4");
    s.pf(2, { level: "USER01.COB" });
    s.pf(9);
    expect(s.state.fieldValues.level).toBe("USER01.COB");
  });
  it("START opens a screen without leaving the current panel behind", () => {
    const s = Sim.loggedOn().cmd("3.4").cmd("START");
    expect(allSessions(s.state).length).toBe(2);
    expect(describeSession(allSessions(s.state)[0])).toBe("DSLIST SEARCH");
  });
  it("SWAP with a single screen and out-of-range targets are reported", () => {
    const s = Sim.loggedOn().pf(9);
    expect(s.message).toBe("SWAP NOT ACTIVE");
    s.pf(2);
    s.cmd("SWAP 5");
    expect(s.message).toBe("SCREEN NOT ACTIVE");
  });
  it("SWAP LIST lists the screens", () => {
    const s = Sim.loggedOn().cmd("3.4").pf(2).cmd("SWAP LIST");
    expect(s.state.message?.long).toContain("1  DSLIST SEARCH");
    expect(s.state.message?.long).toContain("2* PRIMARY");
  });
  it("PF3 on a split screen's Primary Option Menu ends that screen, not the session", () => {
    const s = Sim.loggedOn().cmd("3.4").pf(2);
    s.pf(3);
    expect(s.state.loggedIn).toBe(true);
    expect(s.screenId).toBe("DSLIST_SEARCH");
    expect(allSessions(s.state).length).toBe(1);
    expect(s.has("SCREEN_CLOSED")).toBe(true);
    s.pf(3).pf(3).pf(3);
    expect(s.state.loggedIn).toBe(false);
  });
  it("caps the number of screens", () => {
    const s = Sim.loggedOn();
    for (let i = 1; i < MAX_SCREENS; i++) s.pf(2);
    expect(allSessions(s.state).length).toBe(MAX_SCREENS);
    s.pf(2);
    expect(s.message).toBe("MAXIMUM SCREENS ACTIVE");
    expect(allSessions(s.state).length).toBe(MAX_SCREENS);
  });
  it("shows the screen number on the Primary Option Menu", () => {
    const s = Sim.loggedOn().pf(2);
    expect(JSON.stringify(s.rendered().rows)).toContain("Screen. . : 2 of 2");
  });
  it("reset and logoff collapse to one screen", () => {
    const s = Sim.loggedOn().pf(2);
    const r = s.pf(3).pf(3);
    expect(r.state.loggedIn).toBe(false);
    expect(r.state.screens).toEqual([]);
  });
});
