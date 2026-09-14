import { describe, expect, it } from "vitest";
import { buildSeed } from "@/catalog/seed";
import {
  MSG,
  allocate,
  copyMember,
  deleteDataset,
  deleteMember,
  getDataset,
  getMember,
  isValidDsname,
  parseDsnRef,
  readRecords,
  renameDataset,
  renameMember,
  saveRecords,
  searchLevel,
} from "@/catalog/catalog";

const HLQ = "USER01";
const seed = () => buildSeed(HLQ);
const W = { today: "2026/09/11", userid: HLQ };

describe("seed", () => {
  it("is templated on the userid and contains the required libraries", () => {
    const c = seed();
    expect(Object.keys(c.datasets)).toEqual(
      expect.arrayContaining([`${HLQ}.JCL`, `${HLQ}.COBOL`, `${HLQ}.REXX`, `${HLQ}.DATA`, "SYS1.PARMLIB"]),
    );
    expect(Object.keys(getDataset(c, `${HLQ}.JCL`)!.members!)).toEqual(["HELLO", "COPYJOB", "PAYRPT", "SORTJOB"]);
    expect(getDataset(c, "SYS1.PARMLIB")!.readOnly).toBe(true);
  });
  it("contains no personal names", () => {
    expect(JSON.stringify(buildSeed("ABC"))).not.toMatch(/KOVIE/i);
  });
});

describe("searchLevel (DSLIST Dsname Level)", () => {
  it("matches all data sets for a bare HLQ", () => {
    const names = searchLevel(seed(), HLQ).map((d) => d.name);
    expect(names).toContain(`${HLQ}.JCL`);
    expect(names).toContain(`${HLQ}.NOTES.TXT`);
    expect(names).not.toContain("SYS1.PARMLIB");
  });
  it("treats HLQ.* like HLQ", () => {
    expect(searchLevel(seed(), `${HLQ}.*`).length).toBe(searchLevel(seed(), HLQ).length);
  });
  it("matches an exact data set and its descendants", () => {
    expect(searchLevel(seed(), `${HLQ}.JCL`).map((d) => d.name)).toEqual([`${HLQ}.JCL`]);
    expect(searchLevel(seed(), `${HLQ}.NOTES`).map((d) => d.name)).toEqual([`${HLQ}.NOTES.TXT`]);
  });
  it("supports * wildcard inside a qualifier and lowercase input", () => {
    expect(searchLevel(seed(), "sys1.p*").map((d) => d.name)).toEqual(["SYS1.PARMLIB", "SYS1.PROCLIB"]);
  });
  it("returns nothing for empty or unmatched level", () => {
    expect(searchLevel(seed(), "")).toEqual([]);
    expect(searchLevel(seed(), "NOBODY")).toEqual([]);
  });
});

describe("dsname parsing", () => {
  it("parses DSN(MEMBER)", () => {
    expect(parseDsnRef(`${HLQ}.jcl(hello)`)).toEqual({ dsn: `${HLQ}.JCL`, member: "HELLO" });
    expect(parseDsnRef("'" + HLQ + ".JCL'")).toEqual({ dsn: `${HLQ}.JCL`, member: undefined });
    expect(parseDsnRef("BAD..NAME")).toBeNull();
  });
  it("validates qualifier rules", () => {
    expect(isValidDsname("A.B.C")).toBe(true);
    expect(isValidDsname("1ABC.DEF")).toBe(false);
    expect(isValidDsname("ABCDEFGHI.X")).toBe(false);
  });
});

describe("opening data sets", () => {
  it("reads a PDS member", () => {
    const r = readRecords(seed(), { dsn: `${HLQ}.JCL`, member: "HELLO" });
    expect(r.records![0]).toMatch(/^\/\/USER01H\s+JOB/);
  });
  it("reads a sequential data set without member", () => {
    const r = readRecords(seed(), { dsn: `${HLQ}.NOTES.TXT` });
    expect(r.records!.length).toBe(5);
  });
  it("errors for a missing member", () => {
    expect(readRecords(seed(), { dsn: `${HLQ}.JCL`, member: "NOPE" }).error).toBe(MSG.MEMBER_NOT_FOUND);
  });
});

describe("member operations", () => {
  it("deletes a member immutably", () => {
    const c = seed();
    const { catalog, error } = deleteMember(c, `${HLQ}.JCL`, "SORTJOB");
    expect(error).toBeUndefined();
    expect(getMember(catalog, `${HLQ}.JCL`, "SORTJOB")).toBeUndefined();
    expect(getMember(c, `${HLQ}.JCL`, "SORTJOB")).toBeDefined();
  });
  it("renames a member", () => {
    const { catalog } = renameMember(seed(), `${HLQ}.JCL`, "HELLO", "HELLO2");
    expect(getMember(catalog, `${HLQ}.JCL`, "HELLO")).toBeUndefined();
    expect(getMember(catalog, `${HLQ}.JCL`, "HELLO2")!.name).toBe("HELLO2");
  });
  it("refuses to rename onto an existing member", () => {
    expect(renameMember(seed(), `${HLQ}.JCL`, "HELLO", "COPYJOB").error).toBe(MSG.MEMBER_EXISTS);
  });
  it("refuses writes to read-only libraries", () => {
    expect(deleteMember(seed(), "SYS1.PARMLIB", "PROG00").error).toBe(MSG.READ_ONLY);
    expect(saveRecords(seed(), { dsn: "SYS1.PARMLIB", member: "PROG00" }, ["X"], W).error).toBe(MSG.READ_ONLY);
  });
  it("creates a new member on save and pads to LRECL", () => {
    const r = saveRecords(seed(), { dsn: `${HLQ}.JCL`, member: "NEWMEM" }, ["//NEW JOB"], W);
    expect(r.created).toBe(true);
    const m = getMember(r.catalog, `${HLQ}.JCL`, "NEWMEM")!;
    expect(m.records[0].length).toBe(80);
    expect(m.modifiedBy).toBe(HLQ);
  });
  it("bumps the mod level on re-save", () => {
    const r1 = saveRecords(seed(), { dsn: `${HLQ}.JCL`, member: "HELLO" }, ["A"], W);
    expect(getMember(r1.catalog, `${HLQ}.JCL`, "HELLO")!.mod).toBe(1);
  });
});

const ALLOC = { spaceUnits: "TRKS" as const, primary: 5, secondary: 1, dirBlocks: 10, recfm: "FB" as const, lrecl: 80, owner: HLQ };

describe("data set operations", () => {
  it("allocates a PDS when directory blocks > 0", () => {
    const r = allocate(seed(), { ...ALLOC, name: `${HLQ}.TEST.JCL` }, W.today);
    expect(r.error).toBeUndefined();
    const ds = getDataset(r.catalog, `${HLQ}.TEST.JCL`)!;
    expect(ds.datasetType).toBe("PDS");
    expect(ds.dsorg).toBe("PO");
    expect(ds.blksize).toBe(27920);
    expect(searchLevel(r.catalog, HLQ).map((d) => d.name)).toContain(`${HLQ}.TEST.JCL`);
  });
  it("allocates a PS when directory blocks = 0", () => {
    const r = allocate(seed(), { ...ALLOC, name: `${HLQ}.SEQ`, spaceUnits: "CYLS", dirBlocks: 0, recfm: "VB", lrecl: 255 }, W.today);
    expect(getDataset(r.catalog, `${HLQ}.SEQ`)!.dsorg).toBe("PS");
  });
  it("rejects duplicates and bad names", () => {
    expect(allocate(seed(), { ...ALLOC, name: `${HLQ}.JCL` }, W.today).error).toBe(MSG.ALREADY_EXISTS);
    expect(allocate(seed(), { ...ALLOC, name: "TOOLONGQUALIFIER.X" }, W.today).error).toBe(MSG.INVALID_DSNAME);
    expect(allocate(seed(), { ...ALLOC, name: `${HLQ}.X`, lrecl: 0 }, W.today).error).toBe(MSG.INVALID_LRECL);
  });
  it("deletes and renames data sets, guarding read-only", () => {
    expect(deleteDataset(seed(), `${HLQ}.LOADLIB`).catalog.datasets[`${HLQ}.LOADLIB`]).toBeUndefined();
    expect(deleteDataset(seed(), "SYS1.PARMLIB").error).toBe(MSG.READ_ONLY);
    const r = renameDataset(seed(), `${HLQ}.NOTES.TXT`, `${HLQ}.NOTES.OLD`);
    expect(getDataset(r.catalog, `${HLQ}.NOTES.OLD`)!.records!.length).toBe(5);
    expect(getDataset(r.catalog, `${HLQ}.NOTES.TXT`)).toBeUndefined();
  });
});

describe("copy / move across data sets", () => {
  const withTarget = () => allocate(seed(), { ...ALLOC, name: `${HLQ}.TEST.JCL` }, W.today).catalog;

  it("copies a member keeping the source", () => {
    const r = copyMember(withTarget(), { dsn: `${HLQ}.JCL`, member: "HELLO" }, { dsn: `${HLQ}.TEST.JCL` }, W);
    expect(r.error).toBeUndefined();
    expect(getMember(r.catalog, `${HLQ}.TEST.JCL`, "HELLO")).toBeDefined();
    expect(getMember(r.catalog, `${HLQ}.JCL`, "HELLO")).toBeDefined();
  });
  it("moves a member removing the source", () => {
    const r = copyMember(withTarget(), { dsn: `${HLQ}.JCL`, member: "HELLO" }, { dsn: `${HLQ}.TEST.JCL`, member: "HI" }, { ...W, move: true });
    expect(getMember(r.catalog, `${HLQ}.TEST.JCL`, "HI")).toBeDefined();
    expect(getMember(r.catalog, `${HLQ}.JCL`, "HELLO")).toBeUndefined();
  });
  it("refuses to overwrite without replace", () => {
    const c = copyMember(withTarget(), { dsn: `${HLQ}.JCL`, member: "HELLO" }, { dsn: `${HLQ}.TEST.JCL` }, W).catalog;
    expect(copyMember(c, { dsn: `${HLQ}.JCL`, member: "HELLO" }, { dsn: `${HLQ}.TEST.JCL` }, W).error).toBe(MSG.MEMBER_EXISTS);
  });
  it("copies a sequential data set into a member", () => {
    const r = copyMember(withTarget(), { dsn: `${HLQ}.NOTES.TXT` }, { dsn: `${HLQ}.TEST.JCL`, member: "NOTES" }, W);
    expect(getMember(r.catalog, `${HLQ}.TEST.JCL`, "NOTES")!.records.length).toBe(5);
  });
});
