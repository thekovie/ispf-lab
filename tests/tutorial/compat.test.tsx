/**
 * Compatibility guards (M1a acceptance): existing lesson ids, step ids and stored progress must keep working.
 * The fixture was extracted from the baseline commit e97a91b, independently of the current source.
 */
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KEYS } from "@/persistence/keys";
import { loadProgress, type Progress } from "@/persistence/progressStore";
import { MemoryAdapter } from "@/persistence/storage";
import { SimulatorProvider, useSimulatorStore } from "@/state/SimulatorProvider";
import { TutorialProvider, useTutorial, type TutorialApi } from "@/state/TutorialProvider";
import { LESSONS } from "@/tutorial/lessons";
import baseline from "./fixtures/baseline-ids.json";

describe("lesson and step ids", () => {
  const ids = baseline as Record<string, { number: number; steps: string[] }>;

  it("every baseline lesson id still exists with the same number, in the same order", () => {
    expect(LESSONS.slice(0, Object.keys(ids).length).map((l) => [l.id, l.number])).toEqual(Object.entries(ids).map(([id, v]) => [id, v.number]));
  });

  it("every baseline step id is unchanged and in the same order", () => {
    for (const lesson of LESSONS) expect(lesson.steps.map((s) => s.id), lesson.id).toEqual(ids[lesson.id].steps);
  });

  it("the 28 lessons and 137 steps are exactly the baseline set", () => {
    expect(LESSONS).toHaveLength(28);
    expect(LESSONS.reduce((n, l) => n + l.steps.length, 0)).toBe(137);
  });
});

describe("stored progress", () => {
  // A record in the format written by the baseline (version 1, keyed by lesson id).
  const stored: Progress = {
    version: 1,
    currentLessonId: "l01-meet-ispf",
    lessons: {
      "l01-meet-ispf": { status: "completed", attempts: 2, hintsUsed: 1, mistakes: 0, bestScore: 85, completedAt: "2026-09-01T10:00:00.000Z" },
      "l02-navigating": { status: "in-progress", attempts: 1, hintsUsed: 0, mistakes: 1 },
    },
  };

  it("keeps the storage key and the version-1 shape", () => {
    expect(KEYS.progress).toBe("ispf-lab:progress:v1");
    const storage = new MemoryAdapter();
    storage.set(KEYS.progress, stored);
    expect(loadProgress(storage)).toEqual(stored);
  });

  it("starting lessons, switching mode and restarting leave unrelated progress untouched", () => {
    const storage = new MemoryAdapter();
    storage.set(KEYS.progress, stored);
    const h = {} as { api: TutorialApi };
    function Probe() {
      h.api = useTutorial();
      useSimulatorStore();
      return null;
    }
    render(
      <SimulatorProvider storage={storage}>
        <TutorialProvider confirmDiscard={() => true}>
          <Probe />
        </TutorialProvider>
      </SimulatorProvider>,
    );

    act(() => h.api.startLesson("l06-allocating"));
    act(() => h.api.setMode("challenge"));
    act(() => h.api.restartLesson());
    act(() => h.api.setMode("learn"));

    const after = loadProgress(storage);
    expect(after.version).toBe(1);
    expect(after.lessons["l01-meet-ispf"]).toEqual(stored.lessons["l01-meet-ispf"]);
    expect(after.lessons["l02-navigating"]).toEqual(stored.lessons["l02-navigating"]);
    expect(after.lessons["l06-allocating"].status).toBe("in-progress");
    expect(after.currentLessonId).toBe("l06-allocating");
  });

  it("runs entirely on the injected storage adapter (local-first: no network, no other store)", () => {
    const storage = new MemoryAdapter();
    const h = {} as { api: TutorialApi };
    function Probe() {
      h.api = useTutorial();
      return null;
    }
    render(
      <SimulatorProvider storage={storage}>
        <TutorialProvider confirmDiscard={() => true}>
          <Probe />
        </TutorialProvider>
      </SimulatorProvider>,
    );
    act(() => h.api.startLesson("l06-allocating"));
    expect(storage.keys().every((k) => k.startsWith("ispf-lab:"))).toBe(true);
    expect(storage.keys()).toContain(KEYS.progress);
  });
});
