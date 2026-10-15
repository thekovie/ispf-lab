/**
 * M2: the coach panel shows a non-blocking note when a lesson's `requires` are not completed yet (ADR 0017).
 * It is advice: the lesson still starts, and the note disappears once the required lesson is completed.
 */
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LearningPanel } from "@/components/coach/LearningPanel";
import { KEYS } from "@/persistence/keys";
import { MemoryAdapter } from "@/persistence/storage";
import { SimulatorProvider } from "@/state/SimulatorProvider";
import { TutorialProvider, useTutorial, type TutorialApi } from "@/state/TutorialProvider";

function mount(completed: string[]) {
  const storage = new MemoryAdapter();
  storage.set(KEYS.progress, {
    version: 1,
    lessons: Object.fromEntries(completed.map((id) => [id, { status: "completed", attempts: 1, hintsUsed: 0, mistakes: 0 }])),
  });
  const h = {} as { api: TutorialApi };
  function Probe() {
    h.api = useTutorial();
    return null;
  }
  render(
    <SimulatorProvider storage={storage}>
      <TutorialProvider confirmDiscard={() => true}>
        <Probe />
        <LearningPanel />
      </TutorialProvider>
    </SimulatorProvider>,
  );
  return h;
}

describe("prerequisite note", () => {
  it("is shown for a lesson whose required lesson is not completed, and the lesson still starts", () => {
    const h = mount([]);
    act(() => h.api.startLesson("l13-copy-across"));
    expect(h.api.lesson?.id).toBe("l13-copy-across");
    expect(screen.getByText(/Before you start/i)).toBeInTheDocument();
    expect(screen.getByText(/lesson 6 \(Allocating a data set\)/i)).toBeInTheDocument();
    expect(screen.getByText(/carry on without it/i)).toBeInTheDocument();
  });

  it("is not shown once the required lesson is completed", () => {
    const h = mount(["l06-allocating"]);
    act(() => h.api.startLesson("l13-copy-across"));
    expect(screen.queryByText(/Before you start/i)).toBeNull();
  });

  it("is not shown for a lesson with no requires", () => {
    const h = mount([]);
    act(() => h.api.startLesson("l06-allocating"));
    expect(screen.queryByText(/Before you start/i)).toBeNull();
  });
});
