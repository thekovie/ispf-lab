/**
 * ISPF member statistics (M1b-4, lesson 23). IBM, z/OS ISPF Edit and Edit Macros, "Statistics for PDS members" and STATS:
 * the modification level is incremented by one when the first change is made to the data (once per edit session),
 * stops at 99, and "If STATS mode is off when you save a member, any previous statistics are lost".
 * Evidence: docs/curriculum/evidence/EV-A-ispf-tso.md section 6, existing-lessons-audit.md D23-1, D23-3.
 */
import { describe, expect, it } from "vitest";
import { getMember } from "@/catalog/catalog";
import { Sim } from "./harness";

const HELLO = { dsn: "USER01.JCL", member: "HELLO" };
const stats = (s: Sim) => getMember(s.state.catalog, HELLO.dsn, HELLO.member)!;
const open = () => Sim.loggedOn().cmd("2").enter({ other: "USER01.JCL(HELLO)" });
const change = (s: Sim, text: string) => s.enter({ [`line:${s.state.editor!.lines[2].id}`]: text });

describe("modification level", () => {
  it("is bumped once for the first change of an edit session, not on every save", () => {
    const s = open();
    const before = stats(s).mod ?? 0;
    change(s, "//STEP1    EXEC PGM=IEBGENER").enter({ command: "SAVE" });
    expect(stats(s).mod).toBe(before + 1);
    change(s, "//STEP1    EXEC PGM=SORT").enter({ command: "SAVE" });
    expect(stats(s).mod).toBe(before + 1);
  });

  it("is bumped again by the first change of the next session", () => {
    const s = open();
    const before = stats(s).mod ?? 0;
    change(s, "//STEP1    EXEC PGM=IEBGENER").enter({ command: "SAVE" }).pf(3);
    s.cmd("=2").enter({ other: "USER01.JCL(HELLO)" });
    change(s, "//STEP1    EXEC PGM=SORT").enter({ command: "SAVE" });
    expect(stats(s).mod).toBe(before + 2);
  });

  it("is not bumped by a save with no change", () => {
    const s = open();
    const before = stats(s).mod ?? 0;
    s.enter({ command: "SAVE" });
    expect(stats(s).mod).toBe(before);
  });

  it("stops at 99", () => {
    const s = open();
    const ds = s.state.catalog.datasets["USER01.JCL"];
    s.state = { ...s.state, catalog: { ...s.state.catalog, datasets: { ...s.state.catalog.datasets, "USER01.JCL": { ...ds, members: { ...ds.members, HELLO: { ...ds.members!.HELLO, mod: 99 } } } } } };
    change(s, "//STEP1    EXEC PGM=IEBGENER").enter({ command: "SAVE" });
    expect(stats(s).mod).toBe(99);
  });
});

describe("STATS OFF", () => {
  it("discards the member's previous statistics when it is saved", () => {
    const s = open();
    expect(stats(s).version).toBeDefined();
    s.enter({ command: "STATS OFF" });
    change(s, "//STEP1    EXEC PGM=IEBGENER").enter({ command: "SAVE" });
    const m = stats(s);
    expect(m.records.join("\n")).toContain("IEBGENER");
    expect(m.version).toBeUndefined();
    expect(m.mod).toBeUndefined();
    expect(m.createdAt).toBeUndefined();
    expect(m.modifiedBy).toBeUndefined();
  });

  it("STATS ON creates fresh statistics on the next save", () => {
    const s = open();
    s.enter({ command: "STATS OFF" });
    change(s, "//STEP1    EXEC PGM=IEBGENER").enter({ command: "SAVE" });
    s.enter({ command: "STATS ON" });
    change(s, "//STEP1    EXEC PGM=SORT").enter({ command: "SAVE" });
    expect(stats(s).modifiedBy).toBe("USER01");
    expect(stats(s).version).toBe(1);
  });
});
