import { describe, expect, it } from "vitest";
import { MemoryAdapter } from "@/persistence/storage";
import { loadCatalog, resetCatalog, saveCatalog } from "@/persistence/catalogStore";
import { loadProgress, resetProgress, saveProgress, updateLesson } from "@/persistence/progressStore";
import { deleteMember, getMember } from "@/catalog/catalog";

describe("catalogStore", () => {
  it("seeds on first load and persists changes per userid", () => {
    const s = new MemoryAdapter();
    const c = loadCatalog(s, "user01");
    expect(getMember(c, "USER01.JCL", "HELLO")).toBeDefined();
    const changed = deleteMember(c, "USER01.JCL", "HELLO").catalog;
    saveCatalog(s, "USER01", changed);
    expect(getMember(loadCatalog(s, "USER01"), "USER01.JCL", "HELLO")).toBeUndefined();
    expect(getMember(loadCatalog(s, "OTHER"), "OTHER.JCL", "HELLO")).toBeDefined();
  });
  it("resets to seed", () => {
    const s = new MemoryAdapter();
    const c = loadCatalog(s, "USER01");
    saveCatalog(s, "USER01", deleteMember(c, "USER01.JCL", "HELLO").catalog);
    expect(getMember(resetCatalog(s, "USER01"), "USER01.JCL", "HELLO")).toBeDefined();
  });
});

describe("progressStore", () => {
  it("stores lesson progress", () => {
    const s = new MemoryAdapter();
    let p = loadProgress(s);
    p = updateLesson(p, "l1", { status: "completed", attempts: 1 });
    saveProgress(s, p);
    expect(loadProgress(s).lessons.l1.status).toBe("completed");
    expect(resetProgress(s).lessons).toEqual({});
  });
});

describe("profileStore", () => {
  it("persists edit profiles per userid and survives a reload through the store", async () => {
    const { SimulatorStore } = await import("@/state/store");
    const { loadProfiles, sanitizeProfiles } = await import("@/persistence/profileStore");
    const storage = new MemoryAdapter();
    const store = new SimulatorStore(storage, "2026/09/14");
    store.boot();
    store.enter({ userid: "USER01" });
    store.enter({ option: "2" });
    store.enter({ other: "USER01.JCL(HELLO)" });
    store.enter({ command: "CAPS ON" });
    store.enter({ command: "AUTOSAVE OFF PROMPT" });
    expect(loadProfiles(storage, "USER01").JCL).toMatchObject({ caps: true, autosave: "OFF PROMPT" });
    expect(loadProfiles(storage, "OTHER")).toEqual({});

    const again = new SimulatorStore(storage, "2026/09/14");
    again.boot();
    again.enter({ userid: "USER01" });
    expect(again.getState().editProfiles.JCL.caps).toBe(true);
    again.resetEnvironment();
    expect(loadProfiles(storage, "USER01")).toEqual({});
    expect(again.getState().editProfiles).toEqual({});

    // Malformed storage falls back to defaults field by field.
    const bad = sanitizeProfiles({ JCL: { caps: "yes", autosave: "MAYBE", bounds: { left: -3, right: 10 } }, "bad name": {} });
    expect(Object.keys(bad)).toEqual(["JCL"]);
    expect(bad.JCL).toMatchObject({ caps: false, autosave: "ON", bounds: { left: 1, right: 10 } });
  });
});
