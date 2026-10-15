/**
 * Display order and the draft gate (ADR 0018).
 * - Lesson ids and numbers are stable identifiers; the order of `LESSONS` is only the order learners see.
 * - A lesson marked `draft` is hidden from every learner-facing list unless NEXT_PUBLIC_SHOW_DRAFT_LESSONS=1.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { LESSONS, MODULES } from "@/tutorial/lessons";

const M3_IDS = ["a-01-panel-fields-scroll", "b-01-zos-big-picture", "b-02-dataset-types", "b-03-jcl-anatomy", "b-04-build-a-job", "b-05-disp", "b-06-multistep-rc", "b-10-job-troubleshooting"];

describe("display order", () => {
  it("numbers are unique and still 1..36", () => {
    expect(LESSONS.map((l) => l.number).sort((a, b) => a - b)).toEqual(Array.from({ length: 36 }, (_, i) => i + 1));
  });

  it("the original 28 lessons keep their relative order", () => {
    const original = LESSONS.filter((l) => l.number <= 28).map((l) => l.number);
    expect(original).toEqual(Array.from({ length: 28 }, (_, i) => i + 1));
  });

  it("every lesson comes after the lessons it advises finishing first", () => {
    LESSONS.forEach((l, i) => {
      for (const req of l.requires ?? []) expect(LESSONS.findIndex((x) => x.id === req), `${l.id} requires ${req}`).toBeLessThan(i);
    });
  });

  it("a module's lessons are adjacent, so menus group them without splitting", () => {
    const seen = new Set<string>();
    let previous = "";
    for (const l of LESSONS) {
      if (l.module !== previous) {
        expect(seen.has(l.module), `${l.module} is split`).toBe(false);
        seen.add(l.module);
        previous = l.module;
      }
    }
    expect(MODULES).toEqual([...seen]);
  });
});

describe("draft gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });
  const load = async (flag: string) => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SHOW_DRAFT_LESSONS", flag);
    return import("@/tutorial/lessons");
  };

  it("the eight M3 lessons are drafts", () => {
    for (const id of M3_IDS) expect(LESSONS.find((l) => l.id === id)?.draft, id).toBe(true);
    expect(LESSONS.filter((l) => l.draft).map((l) => l.id).sort()).toEqual([...M3_IDS].sort());
  });

  it("drafts are hidden from the lesson list, modules and lookups by default", async () => {
    const m = await load("");
    expect(m.LESSONS).toHaveLength(28);
    expect(m.LESSONS.some((l) => l.draft)).toBe(false);
    for (const id of M3_IDS) expect(m.lessonById(id), id).toBeUndefined();
    expect(m.MODULES).not.toContain("Foundations");
  });

  it("the flag shows them", async () => {
    const m = await load("1");
    expect(m.LESSONS).toHaveLength(36);
    expect(m.lessonById("b-05-disp")?.draft).toBe(true);
  });

  it("with drafts hidden, nothing follows lesson 28 and lesson 9 follows lesson 8", async () => {
    const m = await load("");
    expect(m.nextLesson("l28-day-one")).toBeUndefined();
    expect(m.nextLesson("l08-first-edit")?.number).toBe(9);
  });
});
