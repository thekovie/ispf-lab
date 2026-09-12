import { describe, expect, it } from "vitest";
import { MemoryAdapter } from "@/persistence/storage";
import { exportCatalog, importCatalog, loadCatalog, resetCatalog, saveCatalog } from "@/persistence/catalogStore";
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
  it("round-trips export/import", () => {
    const c = loadCatalog(new MemoryAdapter(), "USER01");
    expect(importCatalog(exportCatalog(c))).toEqual(c);
    expect(() => importCatalog("{}")).toThrow();
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
