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
    expect(parseJcl(["//S EXEC PGM=IEFBR14"]).errors[0]).toMatchObject({ id: "IEFC606I" });
    expect(parseJcl(["//J JOB", "//DD1 DD DUMMY"]).errors[0]).toMatchObject({ id: "IEFC606I", text: "MISPLACED DD STATEMENT" });
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
