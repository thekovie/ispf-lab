import { describe, expect, it } from "vitest";
import { parseJcl } from "@/jes/jcl";
import { maxRcText, submitJob } from "@/jes/submit";
import { EMPTY_JES } from "@/jes/types";
import { buildSeed } from "@/catalog/seed";
import { getDataset, readRecords } from "@/catalog/catalog";

const HELLO = ["//USER01H  JOB (ACCT),'HELLO WORLD',CLASS=A,MSGCLASS=X,", "//             NOTIFY=&SYSUID", "//STEP1    EXEC PGM=IEFBR14", "//"];
const out = (r: ReturnType<typeof submitJob>, dd: string) => r.job.outputs.find((o) => o.ddname === dd)!.records.join("\n");
const submit = (records: string[], catalog = buildSeed("USER01"), jes = EMPTY_JES) => submitJob(jes, catalog, { records, userid: "USER01", today: "2026/09/14" });

describe("parseJcl", () => {
  it("recognises JOB / EXEC / DD with continuation, comments and in-stream data", () => {
    const p = parseJcl(["//J1 JOB (A),'X',CLASS=A,", "//   MSGCLASS=X", "//* comment", "//S1 EXEC PGM=SORT", "//SYSIN DD *", "  SORT FIELDS=(1,10,CH,A)", "/*", "//SORTOUT DD SYSOUT=*   trailing comment", "//"]);
    expect(p.errors).toEqual([]);
    expect(p.jobName).toBe("J1");
    expect(p.jobParams).toMatchObject({ CLASS: "A", MSGCLASS: "X" });
    expect(p.steps[0].program).toBe("SORT");
    expect(p.steps[0].dds[0].instream).toEqual(["  SORT FIELDS=(1,10,CH,A)"]);
    expect(p.steps[0].dds[1].sysout).toBe("*");
    expect(p.listing.some((l) => l.includes("//S1 EXEC"))).toBe(true);
  });
  it("reports the classic converter errors with statement lines", () => {
    expect(parseJcl(["//J JOB", "//S EXCE PGM=IEFBR14"]).errors).toEqual([{ line: 2, id: "IEFC605I", text: "UNIDENTIFIED OPERATION FIELD" }]);
    expect(parseJcl(["//J JOB (A),", "//S EXEC PGM=IEFBR14"]).errors[0]).toMatchObject({ id: "IEFC621I" });
    expect(parseJcl(["//J JOB", "//S EXEC PGM=IEFBR14,FOO=1"]).errors[0]).toMatchObject({ id: "IEFC630I", text: "UNIDENTIFIED KEYWORD FOO" });
    expect(parseJcl(["//S EXEC PGM=IEFBR14"]).errors[0]).toMatchObject({ id: "IEFC019I", text: "MISPLACED EXEC STATEMENT" });
    expect(parseJcl(["//J JOB", "//DD1 DD DUMMY"]).errors[0]).toMatchObject({ id: "IEFC019I", text: "MISPLACED DD STATEMENT" });
    expect(parseJcl([]).errors[0]).toMatchObject({ id: "IEFC452I" });
  });
});

describe("submitJob", () => {
  it("runs IEFBR14 to CC 0000 with the three JES data sets", () => {
    const r = submit(HELLO);
    expect(r.job).toMatchObject({ id: "JOB00001", jobName: "USER01H", owner: "USER01", status: "OUTPUT", maxRc: 0 });
    expect(maxRcText(r.job)).toBe("CC 0000");
    expect(r.message).toBe("IKJ56250I JOB USER01H(JOB00001) SUBMITTED");
    expect(r.job.outputs.map((o) => o.ddname)).toEqual(["JESMSGLG", "JESJCL", "JESYSMSG"]);
    expect(out(r, "JESMSGLG")).toContain("$HASP373 USER01H  STARTED");
    expect(out(r, "JESMSGLG")).toContain("$HASP395 USER01H  ENDED - RC=0000");
    expect(out(r, "JESYSMSG")).toContain("IEF142I USER01H STEP1 - STEP WAS EXECUTED - COND CODE 0000");
    expect(out(r, "JESJCL")).toContain("EXEC PGM=IEFBR14");
    expect(r.jes.nextJobNumber).toBe(2);
    expect(r.jes.log.at(-1)).toContain("$HASP395");
  });
  it("IEFBR14 with DISP=(NEW,CATLG) allocates a data set; (OLD,DELETE) removes it", () => {
    const alloc = submit(["//J JOB", "//S EXEC PGM=IEFBR14", "//NEW DD DSN=USER01.NEW.PS,DISP=(NEW,CATLG,DELETE),SPACE=(TRK,(1,1)),", "//  DCB=(RECFM=FB,LRECL=100)", "//"]);
    const ds = getDataset(alloc.catalog, "USER01.NEW.PS")!;
    expect(ds).toMatchObject({ datasetType: "PS", lrecl: 100, recfm: "FB" });
    expect(out(alloc, "JESYSMSG")).toContain("USER01.NEW.PS                                CATALOGED");
    const del = submit(["//J JOB", "//S EXEC PGM=IEFBR14", "//OLD DD DSN=USER01.NEW.PS,DISP=(OLD,DELETE)", "//"], alloc.catalog, alloc.jes);
    expect(getDataset(del.catalog, "USER01.NEW.PS")).toBeUndefined();
    expect(del.job.id).toBe("JOB00002");
  });
  it("IEBGENER copies a data set into a SYSOUT DD and into a new data set", () => {
    const r = submit(["//J JOB", "//COPY EXEC PGM=IEBGENER", "//SYSPRINT DD SYSOUT=*", "//SYSIN DD DUMMY", "//SYSUT1 DD DSN=USER01.NOTES.TXT,DISP=SHR", "//SYSUT2 DD SYSOUT=*", "//"]);
    expect(r.job.maxRc).toBe(0);
    const notes = readRecords(r.catalog, { dsn: "USER01.NOTES.TXT" }).records!;
    expect(r.job.outputs.find((o) => o.ddname === "SYSUT2")!.records).toEqual(notes);
    expect(out(r, "SYSPRINT")).toContain("PROCESSING ENDED AT EOD");
    const toDs = submit(["//J JOB", "//COPY EXEC PGM=IEBGENER", "//SYSPRINT DD SYSOUT=*", "//SYSIN DD DUMMY", "//SYSUT1 DD DSN=USER01.NOTES.TXT,DISP=SHR", "//SYSUT2 DD DSN=USER01.NOTES.BKUP,DISP=(NEW,CATLG,DELETE),", "//   SPACE=(TRK,(5,2))", "//"]);
    expect(readRecords(toDs.catalog, { dsn: "USER01.NOTES.BKUP" }).records!.map((x) => x.trimEnd())).toEqual(notes.map((x) => x.trimEnd()));
  });
  it("SORT orders SORTIN into SORTOUT; a bad control statement gives RC 16", () => {
    const r = submit(["//J JOB", "//S EXEC PGM=SORT", "//SYSOUT DD SYSOUT=*", "//SORTIN DD *", "BBB", "AAA", "CCC", "/*", "//SORTOUT DD SYSOUT=*", "//SYSIN DD *", "  SORT FIELDS=(1,3,CH,D)", "/*", "//"]);
    expect(r.job.maxRc).toBe(0);
    expect(r.job.outputs.find((o) => o.ddname === "SORTOUT")!.records).toEqual(["CCC", "BBB", "AAA"]);
    const bad = submit(["//J JOB", "//S EXEC PGM=SORT", "//SYSOUT DD SYSOUT=*", "//SORTIN DD DUMMY", "//SORTOUT DD SYSOUT=*", "//SYSIN DD *", "  SORT FIELDZ=(1,3)", "/*", "//"]);
    expect(bad.job.maxRc).toBe(16);
    expect(out(bad, "SYSOUT")).toContain("ICE007A");
  });
  it("IDCAMS LISTCAT prints catalog entries", () => {
    const r = submit(["//J JOB", "//S EXEC PGM=IDCAMS", "//SYSPRINT DD SYSOUT=*", "//SYSIN DD *", "  LISTCAT LEVEL(USER01)", "/*", "//"]);
    expect(r.job.maxRc).toBe(0);
    expect(out(r, "SYSPRINT")).toContain("NONVSAM ------- USER01.JCL");
  });
  it("a JCL error is not run: JCL ERROR status, IEFC452I, statement messages in JESYSMSG", () => {
    const r = submit(["//J JOB", "//S EXCE PGM=IEFBR14", "//"]);
    expect(r.job.status).toBe("JCL_ERROR");
    expect(maxRcText(r.job)).toBe("JCL ERROR");
    expect(out(r, "JESMSGLG")).toContain("IEFC452I J - JOB NOT RUN - JCL ERROR");
    expect(out(r, "JESYSMSG")).toContain("2 IEFC605I UNIDENTIFIED OPERATION FIELD");
    expect(r.job.steps.every((s) => !s.executed)).toBe(true);
  });
  it("a missing data set fails allocation: IEF212I, step not executed, JCL ERROR", () => {
    const r = submit(["//J JOB", "//S1 EXEC PGM=IEBGENER", "//SYSPRINT DD SYSOUT=*", "//SYSIN DD DUMMY", "//SYSUT1 DD DSN=USER01.PAYROLL.DATA,DISP=SHR", "//SYSUT2 DD SYSOUT=*", "//S2 EXEC PGM=IEFBR14", "//"]);
    expect(r.job.status).toBe("JCL_ERROR");
    expect(out(r, "JESYSMSG")).toContain("IEF212I J S1 SYSUT1 - DATA SET NOT FOUND");
    expect(out(r, "JESYSMSG")).toContain("IEF272I J S1 - STEP WAS NOT EXECUTED");
    expect(r.job.steps.map((s) => s.executed)).toEqual([false, false]);
  });
  it("an unknown program abends S806 and flushes later steps", () => {
    const r = submit(["//J JOB", "//S1 EXEC PGM=IEFBR15", "//S2 EXEC PGM=IEFBR14", "//"]);
    expect(r.job.status).toBe("OUTPUT");
    expect(maxRcText(r.job)).toBe("ABEND S806");
    expect(out(r, "JESYSMSG")).toContain("CSV003I REQUESTED MODULE IEFBR15 NOT FOUND");
    expect(out(r, "JESMSGLG")).toContain("$HASP395 J        ENDED - ABEND=S806");
    expect(r.job.steps).toMatchObject([{ abend: "S806", executed: true }, { executed: false }]);
  });
});

describe("column 72", () => {
  it("ignores columns 73-80, so a long line with a trailing comma reports IEFC621I", () => {
    const p = parseJcl(["//J JOB", "//S EXEC PGM=IEFBR14", "//SYSUT2 DD DSN=USER01.NOTES.BKUP,DISP=(NEW,CATLG,DELETE),SPACE=(TRK,(5,2))", "//"]);
    expect(p.errors[0]).toMatchObject({ line: 3, id: "IEFC621I" });
  });
});

describe("message ids that IBM documents (M1b-4, EV-B)", () => {
  const sysmsg = (r: ReturnType<typeof submitJob>) => out(r, "JESYSMSG");

  it("IEF374I carries the step statistics and no return code", () => {
    const line = sysmsg(submit(HELLO)).split("\n").find((l) => l.startsWith("IEF374I"))!;
    expect(line).toMatch(/^IEF374I STEP\/STEP1\s+\/STOP\s+\S+ CPU 0MIN 00\.01SEC SRB 0MIN 00\.00SEC VIRT 4K SYS 180K EXT 4K SYS 9424K$/);
    expect(line).not.toContain("RC=");
  });

  it("the return code is on IEF142I, as IBM documents", () => {
    expect(sysmsg(submit(HELLO))).toContain("IEF142I USER01H STEP1 - STEP WAS EXECUTED - COND CODE 0000");
  });

  it("a missing SORTIN DD is ICE056A, not the non-existent ICE026A", () => {
    const r = submit(["//J JOB", "//S EXEC PGM=SORT", "//SYSOUT DD SYSOUT=*", "//SORTOUT DD SYSOUT=*", "//SYSIN DD *", "  SORT FIELDS=(1,3,CH,A)", "/*", "//"]);
    const text = out(r, "SYSOUT");
    expect(text).toContain("ICE056A SORTIN NOT DEFINED");
    expect(text).not.toContain("ICE026A");
  });

  it("a misplaced statement is IEFC019I; IEFC606I does not exist", () => {
    const ids = [...parseJcl(["//S EXEC PGM=IEFBR14"]).errors, ...parseJcl(["//J JOB", "//DD1 DD DUMMY"]).errors, ...parseJcl(["//J JOB", "//J2 JOB"]).errors].map((e) => e.id);
    expect(ids).toEqual(["IEFC019I", "IEFC019I", "IEFC019I"]);
  });
});

describe("statement numbers and the trailing /* (GAP-37, GAP-38; lesson b-03)", () => {
  // IBM numbers the JESJCL listing by statement; comments and continuation records are not numbered (EV-B 1.4).
  const JCL = [
    "//USER01X  JOB (ACCT),'X',CLASS=A,",
    "//             MSGCLASS=X",
    "//* A COMMENT",
    "//STEP1    EXEC PGM=IEFBR14",
    "//BAD      DD  FOO=1",
    "//",
  ];

  it("JESYSMSG reports the statement number that JESJCL prints, not the record number", () => {
    const r = submit(JCL);
    const jcl = out(r, "JESJCL").split("\n");
    const badNo = jcl.find((l) => l.includes("//BAD"))!.trim().split(/\s+/)[0];
    expect(badNo).toBe("3");
    const msg = out(r, "JESYSMSG").split("\n");
    const line = msg.find((l) => l.includes("IEFC630I"))!;
    expect(line.trim().split(/\s+/)[0]).toBe(badNo);
  });

  it("a continuation error points at the statement that was being continued", () => {
    const r = submit(["//USER01X  JOB (ACCT),'X',CLASS=A,", "//* NOT A CONTINUATION", "//S EXEC PGM=IEFBR14", "//"]);
    const msg = out(r, "JESYSMSG").split("\n").find((l) => l.includes("IEFC621I"))!;
    expect(msg.trim().split(/\s+/)[0]).toBe("1");
  });

  it("a trailing /* after the last step is accepted", () => {
    expect(parseJcl(["//J JOB", "//S EXEC PGM=IEFBR14", "/*"]).errors).toEqual([]);
    const r = submit(["//USER01X JOB (ACCT),'X',CLASS=A", "//S EXEC PGM=IEFBR14", "/*"]);
    expect(r.job.status).toBe("OUTPUT");
    expect(r.job.maxRc).toBe(0);
  });

  it("in-stream data still ends at /* and later JCL still runs", () => {
    const p = parseJcl(["//J JOB", "//S EXEC PGM=SORT", "//SYSIN DD *", "  SORT FIELDS=(1,3,CH,A)", "/*", "//SORTOUT DD SYSOUT=*", "//"]);
    expect(p.errors).toEqual([]);
    expect(p.steps[0].dds.map((d) => d.ddname)).toEqual(["SYSIN", "SORTOUT"]);
  });

  it("text that is not JCL and not /* is still IEFC605I", () => {
    expect(parseJcl(["//J JOB", "//S EXEC PGM=IEFBR14", "HELLO"]).errors[0]).toMatchObject({ id: "IEFC605I" });
  });
});

describe("DISP=MOD (GAP-36; lesson b-05; EV-B 1.1)", () => {
  const job = (...dd: string[]) => ["//USER01D  JOB (ACCT),'DISP',CLASS=A,MSGCLASS=X", "//STEP1    EXEC PGM=IEBGENER", "//SYSPRINT DD  SYSOUT=*", "//SYSIN    DD  DUMMY", ...dd, "//"];
  const COPY_IN = ["//SYSUT1   DD  *", "FIRST", "/*"];
  const sysut2 = (disp: string) => [`//SYSUT2   DD  DSN=USER01.DISP.OUT,DISP=${disp},`, "//             SPACE=(TRK,(1,1)),DCB=(RECFM=FB,LRECL=80)"];
  const run = (cat: ReturnType<typeof buildSeed>, ...dd: string[]) => submitJob(EMPTY_JES, cat, { records: job(...dd), userid: "USER01", today: "2026/10/15" });
  const text = (cat: ReturnType<typeof buildSeed>) => (getDataset(cat, "USER01.DISP.OUT")?.records ?? []).map((r) => r.trimEnd());

  it("MOD of a data set that does not exist creates it (IBM: assumed created in this step)", () => {
    const r = run(buildSeed("USER01"), ...COPY_IN, ...sysut2("(MOD,CATLG)"));
    expect(r.job.status).toBe("OUTPUT");
    expect(r.job.maxRc).toBe(0);
    expect(text(r.catalog)).toEqual(["FIRST"]);
    expect(out(r, "JESYSMSG")).toContain("IEF285I   USER01.DISP.OUT");
  });

  it("MOD of an existing sequential data set adds the records after the last one", () => {
    const first = run(buildSeed("USER01"), ...COPY_IN, ...sysut2("(NEW,CATLG)"));
    const again = run(first.catalog, "//SYSUT1   DD  *", "SECOND", "/*", ...sysut2("MOD"));
    expect(again.job.maxRc).toBe(0);
    expect(text(again.catalog)).toEqual(["FIRST", "SECOND"]);
  });

  it("OLD replaces the records (the pointer is at the start); SHR is not for writing here but behaves the same", () => {
    const first = run(buildSeed("USER01"), ...COPY_IN, ...sysut2("(NEW,CATLG)"));
    const again = run(first.catalog, "//SYSUT1   DD  *", "SECOND", "/*", ...sysut2("OLD"));
    expect(text(again.catalog)).toEqual(["SECOND"]);
  });

  it("NEW,CATLG then NEW again is a duplicate-name failure and keeps the first", () => {
    const first = run(buildSeed("USER01"), ...COPY_IN, ...sysut2("(NEW,CATLG)"));
    const again = run(first.catalog, "//SYSUT1   DD  *", "SECOND", "/*", ...sysut2("(NEW,CATLG)"));
    expect(again.job.status).toBe("JCL_ERROR");
    expect(text(again.catalog)).toEqual(["FIRST"]);
  });
});

describe("valid DD keywords the simulator ignores are not errors (GAP-33)", () => {
  it.each(["STORCLAS=USRDATA", "DATACLAS=DC1", "MGMTCLAS=STANDARD", "LABEL=(1,SL)", "FREE=CLOSE", "DSNTYPE=LIBRARY"])("%s", (kw) => {
    const p = parseJcl(["//J JOB", "//S EXEC PGM=IEFBR14", `//D DD DSN=USER01.X.Y,DISP=SHR,${kw}`, "//"]);
    expect(p.errors).toEqual([]);
  });

  it("a keyword that is not a DD keyword is still IEFC630I", () => {
    expect(parseJcl(["//J JOB", "//S EXEC PGM=IEFBR14", "//D DD DSN=USER01.X.Y,FOO=1", "//"]).errors[0]).toMatchObject({ id: "IEFC630I" });
  });
});

describe("DFSORT critical syntax error (EV-B ICE007A; lesson b-06)", () => {
  const bad = (control: string) => ["//USER01R  JOB (ACCT),'RC',CLASS=A,MSGCLASS=X", "//S EXEC PGM=SORT", "//SYSOUT DD SYSOUT=*", "//SORTIN DD DUMMY", "//SORTOUT DD SYSOUT=*", "//SYSIN DD *", control, "/*", "//"];

  it("a bad control statement prints ICE007A with IBM's text, ends RC 16, and the job still ends normally", () => {
    const r = submit(bad("  SORT FIELDZ=(1,3,CH,A)"));
    expect(out(r, "SYSOUT")).toContain("ICE007A SYNTAX ERROR");
    expect(out(r, "SYSOUT")).not.toContain("ON CONTROL STATEMENT");
    expect(r.job.maxRc).toBe(16);
    expect(r.job.status).toBe("OUTPUT");
  });

  it("a nonzero return code does not stop the next step (no COND)", () => {
    const r = submit(["//USER01R  JOB (ACCT),'RC',CLASS=A", "//STEP1 EXEC PGM=IEFBR14", "//STEP2 EXEC PGM=SORT", "//SYSOUT DD SYSOUT=*", "//SORTIN DD DUMMY", "//SORTOUT DD SYSOUT=*", "//SYSIN DD *", "  SORT FIELDZ=(1,3,CH,A)", "/*", "//STEP3 EXEC PGM=IEFBR14", "//"]);
    expect(r.job.steps.map((s) => [s.name, s.executed, s.rc])).toEqual([["STEP1", true, 0], ["STEP2", true, 16], ["STEP3", true, 0]]);
    const iefs = out(r, "JESYSMSG").split("\n").filter((l) => l.startsWith("IEF142I"));
    expect(iefs.map((l) => l.match(/COND CODE (\d+)/)![1])).toEqual(["0000", "0016", "0000"]);
  });

  it("an abend, unlike a return code, flushes the later steps", () => {
    const r = submit(["//USER01A  JOB (ACCT),'ABEND',CLASS=A", "//STEP1 EXEC PGM=IEFBR14", "//STEP2 EXEC PGM=NOPROG", "//STEP3 EXEC PGM=IEFBR14", "//"]);
    expect(r.job.abend).toBe("S806");
    expect(r.job.steps.map((s) => [s.name, s.executed])).toEqual([["STEP1", true], ["STEP2", true], ["STEP3", false]]);
    expect(out(r, "JESYSMSG")).toContain("IEF272I USER01A STEP3 - STEP WAS NOT EXECUTED");
  });
});

describe("delimiter statement and statement numbers (M3 fidelity review; JCL Reference 'Delimiter statement' p.309-310, null statement p.459)", () => {
  it("/* with a comment ends in-stream data (IBM example 1) and later JCL still runs", () => {
    const p = parseJcl(["//J JOB", "//S EXEC PGM=SORT", "//SYSIN DD *", "  SORT FIELDS=(1,3,CH,A)", "/*        END OF DATA", "//SORTOUT DD SYSOUT=*", "//"]);
    expect(p.errors).toEqual([]);
    expect(p.steps[0].dds[0].instream).toEqual(["  SORT FIELDS=(1,3,CH,A)"]);
    expect(p.steps[0].dds.map((d) => d.ddname)).toEqual(["SYSIN", "SORTOUT"]);
  });

  it("a trailing /* with a comment is accepted", () => {
    expect(parseJcl(["//J JOB", "//S EXEC PGM=IEFBR14", "/* END"]).errors).toEqual([]);
  });

  it("a trailing /* followed by the null statement is accepted (IBM's own null-statement example)", () => {
    expect(parseJcl(["//J JOB", "//S EXEC PGM=IEFBR14", "/*", "//"]).errors).toEqual([]);
  });

  it("/* in the middle of a job is still an error", () => {
    expect(parseJcl(["//J JOB", "/*", "//S EXEC PGM=IEFBR14", "//"]).errors[0]).toMatchObject({ id: "IEFC605I" });
  });

  it("STMT NO. never decreases and a stray text line is numbered in the listing, so it points at itself", () => {
    const r = submit(["//USER01X  JOB (ACCT),'X',CLASS=A", "//* c", "STRAY", "//S EXEC PGM=IEFBR14,FOO=1", "//"]);
    const jcl = out(r, "JESJCL").split("\n");
    const numbers = out(r, "JESYSMSG")
      .split("\n")
      .filter((l) => /IEFC\d+I/.test(l))
      .map((l) => Number(l.trim().split(/\s+/)[0]));
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    const stray = jcl.find((l) => l.includes("STRAY"))!.trim().split(/\s+/)[0];
    const msg = out(r, "JESYSMSG").split("\n").find((l) => l.includes("IEFC605I"))!;
    expect(msg.trim().split(/\s+/)[0]).toBe(stray);
  });
});

describe("DISP=MOD on libraries (JCL Reference DISP MOD p.154)", () => {
  const job = (dsn: string) => ["//USER01D  JOB (ACCT),'MOD',CLASS=A,MSGCLASS=X", "//STEP1    EXEC PGM=IEBGENER", "//SYSPRINT DD  SYSOUT=*", "//SYSIN    DD  DUMMY", "//SYSUT1   DD  *", "NEW TEXT", "/*", `//SYSUT2   DD  DSN=${dsn},DISP=MOD`, "//"];
  const run = (dsn: string) => submit(job(dsn));

  it("MOD on an existing member does not overwrite it (IBM terminates the job)", () => {
    const before = readRecords(buildSeed("USER01"), { dsn: "USER01.JCL", member: "HELLO" } as never).records;
    const r = run("USER01.JCL(HELLO)");
    expect(r.job.maxRc).not.toBe(0);
    expect(readRecords(r.catalog, { dsn: "USER01.JCL", member: "HELLO" } as never).records).toEqual(before);
    expect(out(r, "SYSPRINT")).toMatch(/MOD/);
  });

  it("MOD on a member that does not exist creates it", () => {
    const r = run("USER01.JCL(NEWM)");
    expect(r.job.maxRc).toBe(0);
    expect(readRecords(r.catalog, { dsn: "USER01.JCL", member: "NEWM" } as never).records?.[0].trimEnd()).toBe("NEW TEXT");
  });

  it("MOD on a library with no member name fails with a clear message and leaves the library alone", () => {
    const r = run("USER01.JCL");
    expect(r.job.maxRc).not.toBe(0);
    expect(out(r, "SYSPRINT")).toMatch(/MEMBER/);
  });
});

describe("DFSORT control statements the simulator now rejects (ICE007A causes listed by IBM: missing comma, unbalanced parenthesis, invalid format type)", () => {
  const sortJob = (control: string) => ["//USER01R  JOB (ACCT),'RC',CLASS=A,MSGCLASS=X", "//S EXEC PGM=SORT", "//SYSOUT DD SYSOUT=*", "//SORTIN DD DUMMY", "//SORTOUT DD SYSOUT=*", "//SYSIN DD *", control, "/*", "//"];

  it.each(["  SORT FIELDS=(1,3,CH A)", "  SORT FIELDS=(1,3,CH,A", "  SORT FIELDS=(1,3,XX,A)", "  SORT FIELDS=(1,3,CH)", "  SORT FIELDS=(1 3,CH,A)"])("%s ends RC 16 with ICE007A", (control) => {
    const r = submit(sortJob(control));
    expect(out(r, "SYSOUT")).toContain("ICE007A SYNTAX ERROR");
    expect(r.job.maxRc).toBe(16);
  });

  it.each(["  SORT FIELDS=(1,3,CH,A)", "  SORT FIELDS=(1,3,CH,D)", "  SORT FIELDS=COPY", "  SORT FIELDS=(1,3,CH,A,10,4,ZD,D)"])("%s still runs with RC 0", (control) => {
    const r = submit(sortJob(control));
    expect(r.job.maxRc).toBe(0);
  });
});

describe("IEF236I means the allocation succeeded (System Messages Vol 8, IEF236I)", () => {
  it("a step whose allocation fails prints IEF212I and no IEF236I", () => {
    const r = submit(["//USER01Q  JOB (ACCT),'X',CLASS=A,MSGCLASS=X", "//STEP1    EXEC PGM=IEFBR14", "//OUT      DD  DSN=USER01.NOTES.TXTT,DISP=SHR", "//"]);
    const msg = out(r, "JESYSMSG");
    expect(msg).toContain("IEF212I USER01Q STEP1 OUT - DATA SET NOT FOUND");
    expect(msg).not.toContain("IEF236I");
  });

  it("a step whose allocation works still prints IEF236I", () => {
    expect(out(submit(HELLO), "JESYSMSG")).toContain("IEF236I");
  });
});
