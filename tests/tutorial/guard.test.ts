/**
 * Unit tests for the Challenge completion guard and the event history (ADR 0016, M1a-2).
 * Pure runner behaviour with synthetic lessons: no simulator panels involved.
 */
import { describe, expect, it } from "vitest";
import { Sim } from "../engine/harness";
import type { ScreenId, SimEvent, SimulatorState } from "@/engine/types";
import { feedEvents, startRunner } from "@/tutorial/engine";
import { is, sawAll } from "@/tutorial/validators";
import type { Lesson, Validator } from "@/tutorial/types";

const at = (base: SimulatorState, id: ScreenId): SimulatorState => ({ ...base, screen: { id } as SimulatorState["screen"] });
const base = Sim.loggedOn().state;

function lessonWith(validator: Validator, explicitChallenge = true): Lesson {
  return {
    id: "t-guard",
    number: 99,
    module: "test",
    title: "guard",
    description: "",
    objective: "",
    teaches: [],
    steps: [{ id: "only", instruction: "", hint: "", validator }],
    ...(explicitChallenge ? { challenge: { task: "", validator } } : {}),
  };
}

const onMenu: Validator = ({ state }) => state.screen.id === "PRIMARY_OPTION_MENU";
const find = (text: string): SimEvent => ({ type: "EDITOR_FIND", text });

describe("Challenge completion guard", () => {
  it("does not complete when the outcome check is already true on the start state", () => {
    const lesson = lessonWith(onMenu);
    const runner = startRunner(lesson, at(base, "PRIMARY_OPTION_MENU"));
    const r = feedEvents(lesson, runner, [], at(base, "PRIMARY_OPTION_MENU"), "challenge");
    expect(r.completed).toBe(false);
  });

  it("completes only after the check has been seen false and then true", () => {
    const lesson = lessonWith(onMenu);
    let runner = startRunner(lesson, at(base, "PRIMARY_OPTION_MENU"));
    runner = feedEvents(lesson, runner, [], at(base, "DSLIST_SEARCH"), "challenge").runner;
    expect(runner.status).toBe("running");
    const r = feedEvents(lesson, runner, [], at(base, "PRIMARY_OPTION_MENU"), "challenge");
    expect(r.completed).toBe(true);
  });

  it("completes on the first action when the check is false at the start", () => {
    const lesson = lessonWith(({ state }) => state.screen.id === "DSLIST_SEARCH");
    const runner = startRunner(lesson, at(base, "PRIMARY_OPTION_MENU"));
    const r = feedEvents(lesson, runner, [], at(base, "DSLIST_SEARCH"), "challenge");
    expect(r.completed).toBe(true);
  });

  it("without a baseline the first feed can never complete", () => {
    const lesson = lessonWith(onMenu);
    const r = feedEvents(lesson, startRunner(lesson), [], at(base, "PRIMARY_OPTION_MENU"), "challenge");
    expect(r.completed).toBe(false);
  });

  it("applies the same guard to a lesson that falls back to its last step", () => {
    const lesson = lessonWith(onMenu, false);
    const runner = startRunner(lesson, at(base, "PRIMARY_OPTION_MENU"));
    expect(feedEvents(lesson, runner, [], at(base, "PRIMARY_OPTION_MENU"), "challenge").completed).toBe(false);
  });

  it("does not affect Learn or Practice mode", () => {
    const lesson = lessonWith(onMenu);
    for (const mode of ["learn", "practice"] as const) {
      const runner = startRunner(lesson, at(base, "PRIMARY_OPTION_MENU"));
      expect(feedEvents(lesson, runner, [], at(base, "PRIMARY_OPTION_MENU"), mode).completed).toBe(true);
    }
  });
});

describe("Challenge event history", () => {
  const twoFinds: Validator = ({ history }) => (history ?? []).filter((e) => e.type === "EDITOR_FIND").length >= 2;

  it("hands validators every event since the Challenge started, across feeds", () => {
    const lesson = lessonWith(twoFinds);
    let runner = startRunner(lesson, base);
    runner = feedEvents(lesson, runner, [find("A")], base, "challenge").runner;
    expect(runner.status).toBe("running");
    const r = feedEvents(lesson, runner, [find("B")], base, "challenge");
    expect(r.completed).toBe(true);
  });

  it("starts empty again for a fresh runner", () => {
    const lesson = lessonWith(twoFinds);
    feedEvents(lesson, startRunner(lesson, base), [find("A")], base, "challenge");
    const fresh = startRunner(lesson, base);
    expect(feedEvents(lesson, fresh, [find("B")], base, "challenge").completed).toBe(false);
  });

  it("is not recorded in Learn mode", () => {
    const lesson = lessonWith(twoFinds);
    const r = feedEvents(lesson, startRunner(lesson, base), [find("A")], base, "learn");
    expect(r.runner.history).toBeUndefined();
  });
});

describe("Challenge history cap (found in the M3 diff review)", () => {
  it("a required early event is still seen after 1,500 later events", () => {
    const state = Sim.loggedOn().state;
    const lesson = {
      id: "t-cap", number: 98, module: "T", title: "t", description: "", objective: "", teaches: [],
      steps: [{ id: "s", instruction: "", hint: "", validator: () => false }],
      challenge: { task: "t", validator: sawAll(is("SETTING_CHANGED"), is("SETTING_CHANGED", (e) => e.setting === "last")) },
    } as Lesson;
    let runner = startRunner(lesson, state);
    const first = { type: "SETTING_CHANGED", setting: "first" } as never;
    runner = feedEvents(lesson, runner, [first], state, "challenge").runner;
    const filler = Array.from({ length: 1500 }, () => ({ type: "PF_KEY_PRESSED", key: 1, screen: "PRIMARY_OPTION_MENU" }) as never);
    runner = feedEvents(lesson, runner, filler, state, "challenge").runner;
    const done = feedEvents(lesson, runner, [{ type: "SETTING_CHANGED", setting: "last" } as never], state, "challenge");
    expect(done.completed).toBe(true);
  });
});
