/**
 * Seed catalog, templated on the learner's logon userid (HLQ).
 * Reference: docs/03-ispf-behaviour-reference.md §Seed catalog, ADR 0004.
 */
import type { Catalog, Dataset, Member } from "./types";

const SEED_DATE = "2024/01/15";
const pad80 = (s: string) => s.padEnd(80).slice(0, 80);

function member(name: string, records: string[], owner: string): Member {
  return {
    name,
    records: records.map(pad80),
    createdAt: SEED_DATE,
    modifiedAt: SEED_DATE,
    modifiedBy: owner,
    version: 1,
    mod: 0,
  };
}

function pds(name: string, owner: string, members: Member[], opts: Partial<Dataset> = {}): Dataset {
  return {
    id: name,
    name,
    datasetType: "PDS",
    dsorg: "PO",
    recfm: "FB",
    lrecl: 80,
    blksize: 27920,
    volume: "USR001",
    readOnly: false,
    spaceUnits: "TRKS",
    primary: 15,
    secondary: 5,
    dirBlocks: 10,
    createdAt: SEED_DATE,
    owner,
    members: Object.fromEntries(members.map((m) => [m.name, m])),
    ...opts,
  };
}

function ps(name: string, owner: string, records: string[], opts: Partial<Dataset> = {}): Dataset {
  return {
    id: name,
    name,
    datasetType: "PS",
    dsorg: "PS",
    recfm: "FB",
    lrecl: 80,
    blksize: 27920,
    volume: "USR001",
    readOnly: false,
    spaceUnits: "TRKS",
    primary: 5,
    secondary: 2,
    dirBlocks: 0,
    createdAt: SEED_DATE,
    owner,
    records: records.map(pad80),
    ...opts,
  };
}

export function buildSeed(hlqRaw: string): Catalog {
  const hlq = hlqRaw.toUpperCase();
  const u = hlq;
  const datasets: Dataset[] = [
    pds(`${u}.JCL`, u, [
      member("HELLO", [
        `//${u}H   JOB (ACCT),'HELLO WORLD',CLASS=A,MSGCLASS=X,`,
        "//             NOTIFY=&SYSUID",
        "//STEP1    EXEC PGM=IEFBR14",
        "//",
      ], u),
      member("COPYJOB", [
        `//${u}C   JOB (ACCT),'COPY DATA',CLASS=A,MSGCLASS=X,`,
        "//             NOTIFY=&SYSUID",
        "//*",
        "//* COPY A SEQUENTIAL DATA SET WITH IEBGENER",
        "//*",
        "//COPY     EXEC PGM=IEBGENER",
        "//SYSPRINT DD  SYSOUT=*",
        "//SYSIN    DD  DUMMY",
        `//SYSUT1   DD  DSN=${u}.NOTES.TXT,DISP=SHR`,
        `//SYSUT2   DD  DSN=${u}.NOTES.BKUP,DISP=(NEW,CATLG,DELETE),`,
        "//             SPACE=(TRK,(5,2)),UNIT=SYSDA,",
        "//             DCB=(RECFM=FB,LRECL=80,BLKSIZE=27920)",
        "//",
      ], u),
      member("PAYRPT", [
        `//${u}P   JOB (ACCT),'PAYROLL REPORT',CLASS=A,MSGCLASS=X,`,
        "//             NOTIFY=&SYSUID",
        "//*",
        "//* DAY-ONE CHALLENGE: THIS JOB ENDS WITH A JCL ERROR. FIND OUT WHY IN",
        "//* SDSF (JESYSMSG), FIX THE JCL AND RESUBMIT UNTIL IT ENDS WITH CC 0000.",
        "//*",
        "//REPORT   EXEC PGM=IEBGENER",
        "//SYSPRINT DD  SYSOUT=*",
        "//SYSIN    DD  DUMMY",
        `//SYSUT1   DD  DSN=${u}.PAYROLL.DATA,DISP=SHR`,
        "//SYSUT2   DD  SYSOUT=*",
        "//",
      ], u),
      member("SORTJOB", [
        `//${u}S   JOB (ACCT),'SORT DATA',CLASS=A,MSGCLASS=X,`,
        "//             NOTIFY=&SYSUID",
        "//SORT     EXEC PGM=SORT",
        "//SYSOUT   DD  SYSOUT=*",
        `//SORTIN   DD  DSN=${u}.DATA(EMPLOYEE),DISP=SHR`,
        "//SORTOUT  DD  SYSOUT=*",
        "//SYSIN    DD  *",
        "  SORT FIELDS=(1,10,CH,A)",
        "/*",
        "//",
      ], u),
    ]),
    pds(`${u}.COBOL`, u, [
      member("HELLO", [
        "       IDENTIFICATION DIVISION.",
        "       PROGRAM-ID. HELLO.",
        "       ENVIRONMENT DIVISION.",
        "       DATA DIVISION.",
        "       PROCEDURE DIVISION.",
        "           DISPLAY 'HELLO FROM Z/OS'.",
        "           STOP RUN.",
      ], u),
      member("CUSTOMER", [
        "       IDENTIFICATION DIVISION.",
        "       PROGRAM-ID. CUSTOMER.",
        "       DATA DIVISION.",
        "       WORKING-STORAGE SECTION.",
        "       01  WS-CUSTOMER.",
        "           05  WS-CUST-ID     PIC 9(6).",
        "           05  WS-CUST-NAME   PIC X(30).",
        "           05  WS-CUST-BAL    PIC S9(7)V99.",
        "       PROCEDURE DIVISION.",
        "           DISPLAY 'CUSTOMER MAINTENANCE'.",
        "           STOP RUN.",
      ], u),
    ]),
    pds(`${u}.REXX`, u, [
      member("TEST01", [
        "/* REXX - simple test exec */",
        "SAY 'TEST01 STARTED'",
        "DO I = 1 TO 3",
        "   SAY 'ITERATION' I",
        "END",
        "SAY 'TEST01 ENDED'",
        "EXIT 0",
      ], u),
      member("HELLO", [
        "/* REXX */",
        "SAY 'HELLO FROM REXX'",
        "EXIT 0",
      ], u),
    ]),
    pds(`${u}.DATA`, u, [
      member("CUSTOMER", [
        "000001JANE DOE                      0001250.00",
        "000002JOHN SMITH                    0000320.50",
        "000003ACME SUPPLIES INC             0012400.00",
        "000004GLOBAL FREIGHT                0000000.00",
      ], u),
      member("EMPLOYEE", [
        "E00001ADAMS       ACCOUNTING  2019/03/01",
        "E00002BAKER       OPERATIONS  2021/07/15",
        "E00003CHEN        SYSTEMS     2018/11/30",
        "E00004DIAZ        SYSTEMS     2022/02/14",
      ], u),
    ]),
    ps(`${u}.NOTES.TXT`, u, [
      "TRAINING NOTES",
      "==============",
      "A sequential data set (DSORG=PS) has records but no members.",
      "Use Browse (B) to look, Edit (E) to change.",
      "PF3 returns to the previous panel.",
    ]),
    pds(`${u}.LOADLIB`, u, [], { recfm: "U", lrecl: 0, blksize: 32760, dirBlocks: 20 }),
    pds("SYS1.PARMLIB", "SYS1", [
      member("IEASYS00", [
        "CLOCK=00,",
        "CMD=00,",
        "CON=00,",
        "LNK=00,",
        "LPA=00,",
        "MAXUSER=500,",
        "PROG=00,",
        "SMF=00",
      ], "SYS1"),
      member("COMMND00", [
        "COM='START JES2'",
        "COM='START VTAM'",
        "COM='START TSO'",
      ], "SYS1"),
      member("PROG00", [
        "APF FORMAT(DYNAMIC)",
        "APF ADD DSNAME(SYS1.LINKLIB) VOLUME(SYSRES)",
        "LNKLST DEFINE NAME(LNKLST00)",
        "LNKLST ADD NAME(LNKLST00) DSN(SYS1.LINKLIB)",
        "LNKLST ACTIVATE NAME(LNKLST00)",
      ], "SYS1"),
    ], { volume: "SYSRES", readOnly: true, primary: 100, secondary: 10, dirBlocks: 100 }),
    pds("SYS1.PROCLIB", "SYS1", [
      member("COBUCL", [
        "//COBUCL   PROC",
        "//COB      EXEC PGM=IGYCRCTL,REGION=0M",
        "//STEPLIB  DD  DSN=IGY.SIGYCOMP,DISP=SHR",
        "//SYSPRINT DD  SYSOUT=*",
        "//SYSLIN   DD  DSN=&&LOADSET,DISP=(MOD,PASS),UNIT=SYSDA,",
        "//             SPACE=(TRK,(3,3))",
        "//LKED     EXEC PGM=IEWL,COND=(8,LT,COB)",
        "//SYSLIN   DD  DSN=&&LOADSET,DISP=(OLD,DELETE)",
        "//SYSLMOD  DD  DSN=&&GOSET(GO),DISP=(MOD,PASS),UNIT=SYSDA,",
        "//             SPACE=(TRK,(10,10,1))",
      ], "SYS1"),
      member("SORTD", [
        "//SORTD    PROC",
        "//SORT     EXEC PGM=SORT",
        "//SYSOUT   DD  SYSOUT=*",
      ], "SYS1"),
    ], { volume: "SYSRES", readOnly: true, primary: 50, secondary: 10, dirBlocks: 50 }),
  ];
  return {
    version: 1,
    hlq,
    datasets: Object.fromEntries(datasets.map((d) => [d.name, d])),
  };
}
