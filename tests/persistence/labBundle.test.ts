import { describe, expect, it } from "vitest";
import { MemoryAdapter } from "@/persistence/storage";
import { applyBundle, buildBundle, parseBundle, serializeBundle, validateCatalog, BundleError } from "@/persistence/labBundle";
import { loadCatalog, saveCatalog } from "@/persistence/catalogStore";
import { loadProfiles, saveProfiles } from "@/persistence/profileStore";
import { loadProgress, saveProgress, updateLesson, EMPTY_PROGRESS } from "@/persistence/progressStore";
import { loadSettings, saveSettings } from "@/persistence/settingsStore";
import { defaultProfile } from "@/editor/profile";
import { deleteMember, getMember } from "@/catalog/catalog";

function populated() {
  const s = new MemoryAdapter();
  const c = loadCatalog(s, "USER01");
  saveCatalog(s, "USER01", deleteMember(c, "USER01.JCL", "HELLO").catalog);
  saveProfiles(s, "USER01", { JCL: { ...defaultProfile("JCL"), caps: true, autosave: "OFF PROMPT" } });
  saveProgress(s, updateLesson(EMPTY_PROGRESS, "l01-logon", { status: "completed", attempts: 2 }));
  saveSettings(s, { pfKeysShown: false, insertMode: true, scrollDefault: "HALF" });
  return s;
}

describe("labBundle", () => {
  it("round-trips catalog, profiles, progress and settings into a fresh browser", () => {
    const src = populated();
    const json = serializeBundle(buildBundle(src, "user01", new Date("2026-09-14T00:00:00Z")));
    const parsed = JSON.parse(json);
    expect(parsed).toMatchObject({ format: "ispf-lab", version: 2, userid: "USER01", exportedAt: "2026-09-14T00:00:00.000Z" });

    const dst = new MemoryAdapter();
    const { bundle, migratedFrom } = parseBundle(json);
    const summary = applyBundle(dst, bundle, migratedFrom);
    expect(summary).toMatchObject({ userid: "USER01", profiles: 1, lessons: 1, jobs: 0, migratedFrom: undefined });
    expect(summary.datasets).toBeGreaterThan(5);
    expect(getMember(loadCatalog(dst, "USER01"), "USER01.JCL", "HELLO")).toBeUndefined();
    expect(getMember(loadCatalog(dst, "USER01"), "USER01.JCL", "COPYJOB")).toBeDefined();
    expect(loadProfiles(dst, "USER01").JCL).toMatchObject({ caps: true, autosave: "OFF PROMPT" });
    expect(loadProgress(dst).lessons["l01-logon"]).toMatchObject({ status: "completed", attempts: 2 });
    expect(loadSettings(dst)).toEqual({ pfKeysShown: false, insertMode: true, scrollDefault: "HALF" });
  });
  it("migrates the v0.1 catalog-only export", () => {
    const c = loadCatalog(new MemoryAdapter(), "USER01");
    const legacy = JSON.stringify({ app: "ispf-lab", exportedAt: "2026-09-12T00:00:00Z", catalog: c });
    const { bundle, migratedFrom } = parseBundle(legacy);
    expect(migratedFrom).toBe(1);
    expect(bundle.userid).toBe("USER01");
    expect(bundle.catalog).toEqual(c);
    expect(bundle.editProfiles).toEqual({});
    expect(bundle.progress.lessons).toEqual({});
    expect(bundle.jobs.jobs).toEqual([]);
  });
  it("rejects foreign, malformed and oversized files with readable reasons", () => {
    expect(() => parseBundle("not json")).toThrow(BundleError);
    expect(() => parseBundle("{}")).toThrow(/not an ISPF Lab export/);
    expect(() => parseBundle(JSON.stringify({ format: "ispf-lab", version: 99 }))).toThrow(/unsupported export version/);
    expect(() => parseBundle(JSON.stringify({ format: "ispf-lab", version: 2, userid: "USER01", catalog: { version: 1, datasets: { "BAD NAME": {} } } }))).toThrow(/invalid data set name/);
    expect(() => parseBundle(JSON.stringify({ format: "ispf-lab", version: 2, userid: "USER01", catalog: { version: 1, datasets: { "A.B": { datasetType: "PDS", recfm: "FB", lrecl: 80, members: { X: { name: "X", records: [1] } } } } } }))).toThrow(/array of strings/);
    expect(() => parseBundle(JSON.stringify({ format: "ispf-lab", version: 2, userid: "bad userid!", catalog: { version: 1, datasets: {} } }))).toThrow(/invalid userid/);
    expect(() => parseBundle(" ".repeat(5 * 1024 * 1024 + 1))).toThrow(/5 MB/);
  });
  it("rebuilds data sets from known fields only, dropping unknown keys and fixing derived ones", () => {
    const c = validateCatalog({
      version: 1,
      hlq: "user01",
      datasets: {
        "user01.x": { name: "user01.x", datasetType: "PDS", recfm: "FB", lrecl: 80, dsorg: "PS", members: { hello: { name: "hello", records: ["a"], extra: 1 } }, __proto__: { evil: true }, injected: "x" },
        "USER01.S": { datasetType: "PS", recfm: "VB", lrecl: 255, records: ["r1"] },
      },
    });
    const pds = c.datasets["USER01.X"];
    expect(pds.dsorg).toBe("PO");
    expect(Object.keys(pds)).not.toContain("injected");
    expect(pds.members?.HELLO.records).toEqual(["a"]);
    expect(Object.keys(pds.members!.HELLO)).not.toContain("extra");
    expect(c.datasets["USER01.S"]).toMatchObject({ dsorg: "PS", owner: "USER01", volume: "USR001", records: ["r1"] });
  });
});
