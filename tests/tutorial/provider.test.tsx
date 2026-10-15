/**
 * Provider-level regression tests for the lesson runner wiring (TutorialProvider + store).
 * M1a-1 (test first): the suspected `startLesson` event race from the M0 review (finding F-03).
 * Reference: docs/curriculum/m0-acceptance-review.md, docs/adr/0016-challenge-completion-guard.md.
 */
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { lessonProgress } from "@/persistence/progressStore";
import { MemoryAdapter } from "@/persistence/storage";
import { SimulatorProvider, useSimulatorStore } from "@/state/SimulatorProvider";
import type { SimulatorStore } from "@/state/store";
import { TutorialProvider, useTutorial, type TutorialApi } from "@/state/TutorialProvider";

interface Handle {
  api: TutorialApi;
  store: SimulatorStore;
}

function mount(confirmDiscard: (message: string) => boolean = () => true) {
  const h = {} as Handle;
  function Probe() {
    h.api = useTutorial();
    h.store = useSimulatorStore();
    return null;
  }
  const storage = new MemoryAdapter();
  render(
    <SimulatorProvider storage={storage}>
      <TutorialProvider confirmDiscard={confirmDiscard}>
        <Probe />
      </TutorialProvider>
    </SimulatorProvider>,
  );
  return { h, storage };
}

describe("startLesson does not complete the previous lesson (F-03)", () => {
  it("switching lessons in Challenge mode never marks the lesson being left as completed", () => {
    const { h } = mount();
    act(() => h.api.setMode("challenge"));

    // Lesson 2 is on the Primary Option Menu; its outcome check is "back on the menu".
    act(() => h.api.startLesson("l02-navigating"));
    // The learner wanders off to DSLIST: the outcome check is false, so the lesson is running.
    act(() => {
      h.store.dispatch({ type: "ENTER", fields: { option: "3.4" } });
    });
    expect(h.api.runner?.status).toBe("running");
    expect(h.store.getState().screen.id).not.toBe("PRIMARY_OPTION_MENU");

    // Starting another lesson opens the Primary Option Menu. That must not count as lesson 2's outcome.
    act(() => h.api.startLesson("l06-allocating"));

    expect(lessonProgress(h.api.progress, "l02-navigating").status).not.toBe("completed");
    expect(h.api.lesson?.id).toBe("l06-allocating");
    expect(h.api.runner?.status).toBe("running");
  });
});

const enter = (h: Handle, fields: Record<string, string>) => act(() => void h.store.dispatch({ type: "ENTER", fields }));
const pf = (h: Handle, key: number, fields: Record<string, string> = {}) => act(() => void h.store.dispatch({ type: "PF", key, fields }));
const dsEntry = (dsn: string) => ({ project: "", group: "", type: "", member: "", other: dsn });
const TEST_JCL = "USER01.TEST.JCL";

/** Lesson 6's own work: allocate USER01.TEST.JCL through 3.2. */
function allocateTestLibrary(h: Handle) {
  enter(h, { option: "3.2" });
  enter(h, { option: "A", other: TEST_JCL });
  enter(h, { dirblocks: "10", recfm: "FB", lrecl: "80" });
}

describe("mode switch and restart re-apply the starting state (M1a-4)", () => {
  it("switching Learn to Challenge removes the learner's leftovers and starts a fresh, armed runner", () => {
    const { h } = mount();
    act(() => h.api.startLesson("l06-allocating"));
    allocateTestLibrary(h);
    expect(h.store.getState().catalog.datasets[TEST_JCL]).toBeDefined();

    act(() => h.api.setMode("challenge"));

    expect(h.store.getState().catalog.datasets[TEST_JCL]).toBeUndefined();
    expect(h.store.getState().screen.id).toBe("PRIMARY_OPTION_MENU");
    expect(h.api.runner?.status).toBe("running");
    expect(h.api.runner?.armed).toBe(true);
    enter(h, {});
    expect(h.api.runner?.status).toBe("running");
  });

  it("restartLesson removes leftovers so the lesson can be done again", () => {
    const { h } = mount();
    act(() => h.api.startLesson("l06-allocating"));
    allocateTestLibrary(h);
    act(() => h.api.restartLesson());
    expect(h.store.getState().catalog.datasets[TEST_JCL]).toBeUndefined();
    // and the allocation panel is reachable again (the replay dead end of M0 review F-02)
    enter(h, { option: "3.2" });
    enter(h, { option: "A", other: TEST_JCL });
    expect(h.store.getState().screen.id).toBe("ALLOCATE_DATASET");
  });

  it("a mode switch does not touch saved progress", () => {
    const { h } = mount();
    act(() => h.api.startLesson("l06-allocating"));
    const before = lessonProgress(h.api.progress, "l06-allocating");
    act(() => h.api.setMode("challenge"));
    act(() => h.api.setMode("practice"));
    const after = lessonProgress(h.api.progress, "l06-allocating");
    expect(after).toEqual(before);
    expect(after.status).toBe("in-progress");
  });

  it("L14: finishing in Learn mode and switching to Challenge cannot complete on the saved result (audit V3)", () => {
    const { h } = mount();
    act(() => h.api.startLesson("l14-final-challenge"));
    enter(h, { option: "2" });
    enter(h, dsEntry("USER01.JCL(COPYJOB)"));
    enter(h, { "prefix:6": "I" });
    const blank = h.store.getState().editor!.lines[6].id;
    enter(h, { [`line:${blank}`]: "//STEP2   EXEC PGM=IEFBR14" });
    enter(h, { command: "SAVE" });
    expect(h.api.runner?.status).toBe("completed");

    act(() => h.api.setMode("challenge"));

    const copyjob = h.store.getState().catalog.datasets["USER01.JCL"].members!.COPYJOB.records;
    expect(copyjob.some((r) => r.startsWith("//STEP2"))).toBe(false); // the lesson's member is back to the seed
    enter(h, {});
    expect(h.api.runner?.status).toBe("running");
  });

  it("switching to Sandbox leaves the environment alone", () => {
    const { h } = mount();
    act(() => h.api.startLesson("l06-allocating"));
    allocateTestLibrary(h);
    act(() => h.api.setMode("sandbox"));
    expect(h.store.getState().catalog.datasets[TEST_JCL]).toBeDefined();
  });
});

describe("starting a lesson closes the previous session (M1a-5)", () => {
  it("closes an open editor and split screens", () => {
    const { h } = mount();
    act(() => h.api.startLesson("l24-submit"));
    enter(h, { option: "2" });
    enter(h, dsEntry("USER01.JCL(HELLO)"));
    expect(h.store.getState().editor).toBeDefined();
    pf(h, 2); // the editor now lives in screen 1's snapshot
    expect(h.store.getState().screens.length).toBeGreaterThan(0);

    act(() => h.api.startLesson("l18-cols-bounds"));

    expect(h.store.getState().editor).toBeUndefined();
    expect(h.store.getState().screens).toHaveLength(0);
    expect(h.store.getState().screen.id).toBe("PRIMARY_OPTION_MENU");
  });

  it("empties the retrieve stack only for lessons that ask for it", () => {
    const { h } = mount();
    act(() => h.api.startLesson("l24-submit"));
    enter(h, { option: "3.4" });
    expect(h.store.getState().retrieveStack.length).toBeGreaterThan(0);
    act(() => h.api.startLesson("l18-cols-bounds"));
    expect(h.store.getState().retrieveStack.length).toBeGreaterThan(0);
    act(() => h.api.startLesson("l17-retrieve-multi"));
    expect(h.store.getState().retrieveStack).toHaveLength(0);
  });
});

/** Open HELLO in Edit and change the STEP1 record without saving. */
function leaveUnsavedEdit(h: Handle) {
  enter(h, { option: "2" });
  enter(h, dsEntry("USER01.JCL(HELLO)"));
  enter(h, { "line:3": "//STEP1    EXEC PGM=IEBGENER" });
}

describe("work that would be lost is confirmed first (M1a acceptance)", () => {
  it("asks before another lesson discards an edit with unsaved changes, and Cancel keeps everything", () => {
    const asked: string[] = [];
    const { h } = mount((m) => (asked.push(m), false));
    act(() => h.api.startLesson("l24-submit"));
    leaveUnsavedEdit(h);

    act(() => h.api.startLesson("l18-cols-bounds"));

    expect(asked).toHaveLength(1);
    expect(asked[0]).toMatch(/unsaved changes/i);
    expect(asked[0]).toContain("USER01.JCL(HELLO)");
    expect(h.api.lesson?.id).toBe("l24-submit");
    expect(h.store.getState().editor?.dirty).toBe(true);
    expect(lessonProgress(h.api.progress, "l18-cols-bounds").attempts).toBe(0);
  });

  it("OK discards the work and starts the lesson", () => {
    const { h } = mount(() => true);
    act(() => h.api.startLesson("l24-submit"));
    leaveUnsavedEdit(h);
    act(() => h.api.startLesson("l18-cols-bounds"));
    expect(h.api.lesson?.id).toBe("l18-cols-bounds");
    expect(h.store.getState().editor).toBeUndefined();
  });

  it("does not ask when nothing would be lost", () => {
    const asked: string[] = [];
    const { h } = mount((m) => (asked.push(m), true));
    act(() => h.api.startLesson("l24-submit"));
    enter(h, { option: "2" });
    enter(h, dsEntry("USER01.JCL(HELLO)")); // open, nothing typed
    act(() => h.api.startLesson("l18-cols-bounds"));
    act(() => h.api.restartLesson());
    expect(asked).toEqual([]);
  });

  it("also counts editor text that was typed but not yet sent with Enter", () => {
    const asked: string[] = [];
    const { h } = mount((m) => (asked.push(m), false));
    act(() => h.api.startLesson("l24-submit"));
    h.store.setUnsentProbe(() => "text typed in USER01.JCL(HELLO) but not yet sent with Enter");

    act(() => h.api.startLesson("l18-cols-bounds"));
    act(() => h.api.setMode("challenge"));

    expect(asked).toHaveLength(2);
    expect(asked[0]).toContain("not yet sent with Enter");
    expect(h.api.lesson?.id).toBe("l24-submit");
    expect(h.api.mode).toBe("learn");
  });

  it("a declined mode switch keeps the mode, the lesson and the work", () => {
    const asked: string[] = [];
    const { h } = mount((m) => (asked.push(m), false));
    act(() => h.api.startLesson("l24-submit"));
    leaveUnsavedEdit(h);
    act(() => h.api.setMode("challenge"));
    expect(asked).toHaveLength(1);
    expect(h.api.mode).toBe("learn");
    expect(h.store.getState().editor?.dirty).toBe(true);
  });

  it("restart asks when a saved change to the lesson's member would be restored", () => {
    const asked: string[] = [];
    const { h } = mount((m) => (asked.push(m), false));
    act(() => h.api.startLesson("l24-submit"));
    leaveUnsavedEdit(h);
    enter(h, { command: "SAVE" });
    pf(h, 3);
    act(() => h.api.restartLesson());
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain("USER01.JCL(HELLO)");
    expect(h.store.getState().catalog.datasets["USER01.JCL"].members!.HELLO.records.join("\n")).toContain("IEBGENER");
  });

  it("switching to Sandbox never asks and never discards", () => {
    const asked: string[] = [];
    const { h } = mount((m) => (asked.push(m), false));
    act(() => h.api.startLesson("l24-submit"));
    leaveUnsavedEdit(h);
    act(() => h.api.setMode("sandbox"));
    expect(asked).toEqual([]);
    expect(h.api.mode).toBe("sandbox");
    expect(h.store.getState().editor?.dirty).toBe(true);
  });

  it("the first lesson start asks nothing", () => {
    const asked: string[] = [];
    const { h } = mount((m) => (asked.push(m), true));
    act(() => h.api.startLesson("l06-allocating"));
    expect(asked).toEqual([]);
  });
});
