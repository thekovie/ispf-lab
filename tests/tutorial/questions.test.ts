/**
 * Multiple-choice check questions (ADR 0018): the smallest way to assess a concept that has no simulator event.
 * A wrong choice counts as a mistake; a right one is remembered by the runner and read by `answered(id)`.
 */
import { describe, expect, it } from "vitest";
import { answerQuestion, feedEvents, startRunner } from "@/tutorial/engine";
import type { Lesson } from "@/tutorial/types";
import { answered } from "@/tutorial/validators";
import { Sim } from "../engine/harness";

const lesson: Lesson = {
  id: "t-questions",
  number: 99,
  module: "Test",
  title: "Questions",
  description: "",
  objective: "",
  teaches: [],
  questions: [
    { id: "q1", prompt: "Pick b", options: ["a", "b", "c"], correct: 1 },
    { id: "q2", prompt: "Pick c", options: ["a", "b", "c"], correct: 2 },
  ],
  steps: [
    { id: "one", instruction: "", hint: "", questionId: "q1", validator: answered("q1") },
    { id: "two", instruction: "", hint: "", questionId: "q2", validator: answered("q2") },
  ],
};
const challengeLesson: Lesson = { ...lesson, challenge: { task: "answer both", validator: (ctx) => answered("q1")(ctx) && answered("q2")(ctx) } };
const state = () => Sim.loggedOn().state;

describe("answerQuestion", () => {
  it("a wrong choice is a mistake and advances nothing", () => {
    const r = startRunner(lesson, state());
    const u = answerQuestion(lesson, r, "q1", 0, state(), "learn");
    expect(u.runner.mistakes).toBe(1);
    expect(u.advancedSteps).toBe(0);
    expect(u.runner.stepIndex).toBe(0);
    expect(u.runner.answers?.q1).toBeUndefined();
  });

  it("a right choice completes the step", () => {
    const u = answerQuestion(lesson, startRunner(lesson, state()), "q1", 1, state(), "learn");
    expect(u.advancedSteps).toBe(1);
    expect(u.runner.stepIndex).toBe(1);
    expect(u.runner.mistakes).toBe(0);
  });

  it("answering the second question first does not skip the first step", () => {
    const u = answerQuestion(lesson, startRunner(lesson, state()), "q2", 2, state(), "learn");
    expect(u.runner.stepIndex).toBe(0);
    const v = answerQuestion(lesson, u.runner, "q1", 1, state(), "learn");
    expect(v.completed).toBe(true);
  });

  it("an out-of-range or unknown choice is a mistake; an unknown question changes nothing", () => {
    const r = startRunner(lesson, state());
    expect(answerQuestion(lesson, r, "q1", 7, state(), "learn").runner.mistakes).toBe(1);
    expect(answerQuestion(lesson, r, "q1", -1, state(), "learn").runner.mistakes).toBe(1);
    expect(answerQuestion(lesson, r, "nope", 0, state(), "learn").runner).toBe(r);
  });

  it("answering a solved question again is a no-op", () => {
    const solved = answerQuestion(lesson, startRunner(lesson, state()), "q1", 1, state(), "learn").runner;
    expect(answerQuestion(lesson, solved, "q1", 0, state(), "learn").runner).toBe(solved);
  });

  it("a restart forgets earlier answers", () => {
    expect(startRunner(lesson, state()).answers).toBeUndefined();
  });

  it("Challenge: completes only when every question is right, wrong tries cost mistakes", () => {
    const r0 = startRunner(challengeLesson, state());
    expect(r0.armed).toBe(true);
    const wrong = answerQuestion(challengeLesson, r0, "q1", 2, state(), "challenge");
    expect(wrong.runner.mistakes).toBe(1);
    const one = answerQuestion(challengeLesson, wrong.runner, "q1", 1, state(), "challenge");
    expect(one.completed).toBe(false);
    const two = answerQuestion(challengeLesson, one.runner, "q2", 2, state(), "challenge");
    expect(two.completed).toBe(true);
    expect(two.runner.mistakes).toBe(1);
  });

  it("simulator events cannot stand in for an answer", () => {
    const r = startRunner(lesson, state());
    expect(feedEvents(lesson, r, [], state(), "learn").advancedSteps).toBe(0);
  });
});
