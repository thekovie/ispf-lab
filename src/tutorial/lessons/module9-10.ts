/**
 * Module 9 - Lists in depth (lessons 22-23). Module 10 - Batch jobs and SDSF (lessons 24-28).
 * Modelled on z/OS ISPF User's Guide Vol II (DSLIST, member lists), Redbook SG24-6366 ch. 6 (JCL, JES, SDSF),
 * z/OS MVS System Messages (IEF212I, IEFC452I). SDSF here is simulated; see docs/10-jes-sdsf.md.
 */
import { getMember, readRecords } from "@/catalog/catalog";
import { allOf, anyOf, dslistShowing, editorClosed, editorHasLine, editorOpen, eventIs, memberListOpen, onScreen } from "../validators";
import type { Lesson, LessonContext, Validator } from "../types";

/** The learner's PAYRPT job ran successfully (state only, so Challenge mode can check it). */
const payrptSucceeded: Validator = ({ state }) => state.jes.jobs.some((j) => j.jobName === `${state.userid}P` && j.status === "OUTPUT" && j.maxRc === 0 && !j.abend);

/** PAYRPT in the catalog reads EMPLOYEE data instead of the uncataloged payroll data set. */
const payrptFixed: Validator = (ctx: LessonContext) => {
  const r = readRecords(ctx.state.catalog, { dsn: `${ctx.hlq}.JCL`, member: "PAYRPT" });
  if (!r.records) return false;
  const text = r.records.join("\n");
  return !text.includes("PAYROLL.DATA") && /DATA\(EMPLOYEE\)/.test(text);
};

export const lesson22: Lesson = {
  id: "l22-dslist-advanced",
  number: 22,
  module: "Lists in depth",
  title: "DSLIST like an operator: SORT, FIND, EXCLUDE, S",
  description: "Sort and search a data set list, hide what you do not need, and use S for a quick look at attributes.",
  objective: "In DSLIST for {HLQ}: SORT LRECL D, FIND COBOL, EXCLUDE LOADLIB, S on {HLQ}.JCL, then RESET.",
  teaches: ["SORT field [A|D] reorders the list", "FIND / RFIND (PF5) search names", "EXCLUDE hides rows; RESET restores", "S = short information, I = full information"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" } },
  steps: [
    {
      id: "open-dslist",
      instruction: "Open DSLIST for {HLQ}.",
      hint: "3.4, Enter, {HLQ}, Enter.",
      validator: dslistShowing((level, ctx) => level.toUpperCase().startsWith(ctx.hlq)),
    },
    {
      id: "sort",
      instruction: "Type SORT LRECL D. The longest records come first (the load library with RECFM U shows 0).",
      hint: "SORT LRECL D, Enter.",
      validator: eventIs("LIST_SORTED"),
    },
    {
      id: "find",
      instruction: "Type FIND COBOL. The cursor moves to {HLQ}.COBOL; PF5 would find the next match.",
      hint: "FIND COBOL, Enter.",
      validator: eventIs("LIST_FIND", (e) => e.found),
    },
    {
      id: "exclude",
      instruction: "Type EXCLUDE LOADLIB. The row is replaced by a 'Not Displayed' marker; NX on it - or RESET - brings it back.",
      hint: "EXCLUDE LOADLIB, Enter.",
      validator: eventIs("LIST_LINES_EXCLUDED"),
    },
    {
      id: "short-info",
      instruction: "Type S next to {HLQ}.JCL. Short information shows the attributes without the space figures; I shows everything.",
      hint: "S in the command column of {HLQ}.JCL, Enter.",
      validator: eventIs("DATASET_INFO_VIEWED", (e) => e.short === true),
    },
    {
      id: "reset",
      instruction: "Press PF3 back to the list and type RESET.",
      hint: "F3, then RESET, Enter.",
      validator: eventIs("LIST_RESET"),
    },
  ],
};

export const lesson23: Lesson = {
  id: "l23-member-info",
  number: 23,
  module: "Lists in depth",
  title: "Member statistics: I and G",
  description: "Read the ISPF statistics of a member and reset them.",
  objective: "On the member list of {HLQ}.JCL, show the statistics of HELLO with I, reset them with G, and look again.",
  teaches: ["ISPF statistics live in the PDS directory", "I shows VV.MM, created, changed, size, user", "G resets them to 01.00 / today / you", "STATS OFF in the profile stops the editor updating them"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" } },
  steps: [
    {
      id: "member-list",
      instruction: "Open the member list of {HLQ}.JCL (option 2 with the library name, or 3.4 and M).",
      hint: "2, Enter, {HLQ}.JCL, Enter.",
      validator: memberListOpen("{HLQ}.JCL"),
    },
    {
      id: "info",
      instruction: "Type I next to HELLO. The Member Information panel shows Version.Mod, Created, Last changed, sizes and the last user.",
      explanation: "Every save with STATS ON bumps the modification level and stamps your userid - the audit trail operators rely on.",
      hint: "I in the command column of HELLO, Enter.",
      validator: eventIs("MEMBER_INFO_VIEWED", (e) => e.member === "HELLO"),
    },
    {
      id: "reset-stats",
      instruction: "Press PF3, then type G next to HELLO to reset its statistics.",
      hint: "F3, then G on HELLO, Enter.",
      validator: eventIs("MEMBER_STATS_RESET", (e) => e.member === "HELLO"),
    },
    {
      id: "info-again",
      instruction: "Type I on HELLO again: Version.Mod is now 01.00, created and changed today, by you.",
      hint: "I on HELLO, Enter.",
      validator: allOf(
        eventIs("MEMBER_INFO_VIEWED", (e) => e.member === "HELLO"),
        (ctx) => getMember(ctx.state.catalog, `${ctx.hlq}.JCL`, "HELLO")?.mod === 0,
      ),
    },
    {
      id: "leave",
      instruction: "Press PF3 back to the member list.",
      hint: "F3.",
      validator: onScreen("MEMBER_LIST"),
    },
  ],
};

export const lesson24: Lesson = {
  id: "l24-submit",
  number: 24,
  module: "Batch jobs and SDSF",
  title: "Submit your first job",
  description: "Read a tiny JCL job and hand it to JES with SUBMIT.",
  objective: "Open {HLQ}.JCL(HELLO) in Edit, read the JOB and EXEC statements, SUBMIT it, and note the job id in the message.",
  teaches: ["//name JOB, //step EXEC PGM=, //dd DD", "SUBMIT sends the JCL to JES", "JES answers JOB name(JOBnnnnn) SUBMITTED", "The job id is how you find the job in SDSF"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" }, resetJobs: true, resetMembers: [{ dsn: "{HLQ}.JCL", member: "HELLO" }] },
  steps: [
    {
      id: "open-hello",
      instruction: "Open {HLQ}.JCL(HELLO) in Edit and read it: a JOB statement (name, accounting, CLASS, MSGCLASS), one EXEC step running IEFBR14, and a null // at the end.",
      explanation: "IEFBR14 is the classic do-nothing program: it returns 0 immediately. Jobs like this exist to let JCL allocate or delete data sets.",
      hint: "2, Enter, {HLQ}.JCL(HELLO), Enter.",
      validator: editorOpen("{HLQ}.JCL", "HELLO", "EDIT"),
    },
    {
      id: "submit",
      instruction: "Type SUBMIT on the command line. The message says JOB {HLQ}H(JOB0000n) SUBMITTED.",
      explanation: "On z/OS the job now waits in JES's input queue until an initiator of its class is free. In this simulator it runs at once, so its output is ready to look at.",
      hint: "SUBMIT (or SUB), Enter.",
      validator: eventIs("JOB_SUBMITTED", (e) => e.from === "EDIT"),
    },
    {
      id: "leave",
      instruction: "Press PF3 to leave the editor. Next lesson: finding the job in SDSF.",
      hint: "F3.",
      validator: editorClosed,
    },
  ],
};

export const lesson25: Lesson = {
  id: "l25-sdsf-status",
  number: 25,
  module: "Batch jobs and SDSF",
  title: "SDSF: where did my job go?",
  description: "Submit from a member list with J, open SDSF, read the status panel and browse the job output.",
  objective: "Submit {HLQ}.JCL(HELLO) with J, jump to SDSF with =S, open ST, find the job with CC 0000 and browse its output with S.",
  teaches: ["J on a member list submits it", "SDSF ST lists your jobs: JOBNAME, JobID, Owner, Max-RC", "CC 0000 means every step ended with condition code 0", "S browses all the job's output"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" }, resetJobs: true },
  steps: [
    {
      id: "member-list",
      instruction: "Open the member list of {HLQ}.JCL.",
      hint: "2, Enter, {HLQ}.JCL, Enter.",
      validator: memberListOpen("{HLQ}.JCL"),
    },
    {
      id: "submit-j",
      instruction: "Type J next to HELLO and press Enter. The member is submitted without opening it.",
      hint: "J in the command column of HELLO, Enter.",
      validator: eventIs("JOB_SUBMITTED", (e) => e.from === "MEMBER_LIST"),
    },
    {
      id: "open-sdsf",
      instruction: "Type =S to jump to SDSF (the option letter varies by site - S, SD or M.5), then ST for the status of your jobs.",
      explanation: "SDSF is the window onto JES. ST shows every job you own; OWNER * would show everyone's on a real system.",
      hint: "=S, Enter, then ST, Enter.",
      validator: eventIs("JOB_STATUS_OPENED"),
    },
    {
      id: "browse",
      instruction: "Find {HLQ}H with Max-RC CC 0000 and type S in its NP column. All the job's output opens in Browse: JESMSGLG, JESJCL and JESYSMSG one after the other.",
      explanation: "$HASP373 STARTED ... IEF142I STEP WAS EXECUTED - COND CODE 0000 ... $HASP395 ENDED - RC=0000: that is a healthy job log.",
      hint: "S next to the job, Enter.",
      validator: eventIs("JOB_OUTPUT_OPENED", (e) => !e.ddname),
    },
    {
      id: "leave",
      instruction: "Press PF3 to return to the status panel, then PF3 again to the SDSF menu.",
      hint: "F3, F3.",
      validator: onScreen("SDSF_MENU"),
    },
  ],
};

export const lesson26: Lesson = {
  id: "l26-job-output",
  number: 26,
  module: "Batch jobs and SDSF",
  title: "Reading job output data set by data set",
  description: "Use ? to list the spool data sets of a job and read the one you need.",
  objective: "Submit {HLQ}.JCL(SORTJOB) with TSO SUBMIT, open SDSF ST, list its data sets with ?, browse SORTOUT, then JESMSGLG.",
  teaches: ["TSO SUBMIT dsn(member) from any command line", "? lists JESMSGLG, JESJCL, JESYSMSG and the SYSOUT DDs", "Program output lives in the DD the program wrote to", "JESMSGLG has the step return codes"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" }, resetJobs: true },
  steps: [
    {
      id: "tso-submit",
      instruction: "On the Option line type TSO SUBMIT JCL(SORTJOB) and press Enter. The unquoted name gets your userid in front.",
      hint: "TSO SUBMIT JCL(SORTJOB), Enter.",
      validator: eventIs("JOB_SUBMITTED", (e) => e.from === "TSO_COMMAND"),
    },
    {
      id: "sdsf",
      instruction: "Go to SDSF (=S) and open ST.",
      hint: "=S, Enter, ST, Enter.",
      validator: eventIs("JOB_STATUS_OPENED"),
    },
    {
      id: "question",
      instruction: "Type ? next to {HLQ}S. The job data set panel lists JESMSGLG, JESJCL, JESYSMSG, SYSOUT and SORTOUT.",
      explanation: "Every DD with SYSOUT=* becomes a spool data set. SORT wrote the sorted records to SORTOUT and its own messages to SYSOUT.",
      hint: "? in the NP column of the job, Enter.",
      validator: onScreen("SDSF_JOB_DS"),
    },
    {
      id: "sortout",
      instruction: "Type S next to SORTOUT: the employee records, sorted.",
      hint: "S next to SORTOUT, Enter.",
      validator: eventIs("JOB_OUTPUT_OPENED", (e) => e.ddname === "SORTOUT"),
    },
    {
      id: "jesmsglg",
      instruction: "Press PF3 and browse JESMSGLG. Find the line with RC=0000 (or the timings table with the step return code).",
      hint: "F3, then S next to JESMSGLG, Enter.",
      validator: eventIs("JOB_OUTPUT_OPENED", (e) => e.ddname === "JESMSGLG"),
    },
    {
      id: "leave",
      instruction: "Press PF3 back to the data set list.",
      hint: "F3.",
      validator: onScreen("SDSF_JOB_DS"),
    },
  ],
};

export const lesson27: Lesson = {
  id: "l27-jcl-error",
  number: 27,
  module: "Batch jobs and SDSF",
  title: "Debug a JCL ERROR",
  description: "Submit a job that fails, read JESYSMSG to find out why, fix the JCL from SDSF with SJ and resubmit.",
  objective: "Submit {HLQ}.JCL(PAYRPT), see JCL ERROR in SDSF, read IEF212I in JESYSMSG, fix the SYSUT1 data set name with SJ, resubmit and get CC 0000.",
  teaches: ["JCL ERROR = the job never ran (or a step was skipped)", "JESYSMSG names the statement and the reason", "IEF212I DATA SET NOT FOUND: the DSN is wrong or not cataloged", "SJ opens the submitted JCL in Edit"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" }, resetJobs: true, resetMembers: [{ dsn: "{HLQ}.JCL", member: "PAYRPT" }] },
  steps: [
    {
      id: "submit",
      instruction: "Submit {HLQ}.JCL(PAYRPT) any way you like (J on the member list, SUBMIT in Edit, or TSO SUBMIT JCL(PAYRPT)).",
      hint: "TSO SUBMIT JCL(PAYRPT) on the Option line is quickest.",
      validator: eventIs("JCL_ERROR_GENERATED"),
    },
    {
      id: "status",
      instruction: "Open SDSF ST (=S then ST). The job {HLQ}P shows Max-RC JCL ERROR.",
      hint: "=S, Enter, ST, Enter.",
      validator: eventIs("JOB_STATUS_OPENED"),
    },
    {
      id: "jesysmsg",
      instruction: "Type ? on the job, then S next to JESYSMSG. Read the IEF212I line: which DD, which data set?",
      explanation: "IEF212I jobname step ddname - DATA SET NOT FOUND is an allocation failure: JES converted the JCL fine, but when the step started the data set did not exist in the catalog. IEF272I then says the step was not executed.",
      hint: "?, Enter, then S next to JESYSMSG.",
      validator: eventIs("JOB_OUTPUT_OPENED", (e) => e.ddname === "JESYSMSG"),
    },
    {
      id: "sj",
      instruction: "Press PF3 twice back to ST and type SJ next to the job. The JCL that was submitted opens in Edit.",
      hint: "F3, F3, then SJ on the job, Enter.",
      validator: editorOpen("{HLQ}.JCL", "PAYRPT", "EDIT"),
    },
    {
      id: "fix",
      instruction: "Change the SYSUT1 data set name from {HLQ}.PAYROLL.DATA to {HLQ}.DATA(EMPLOYEE) - overtype it, or use C PAYROLL.DATA DATA(EMPLOYEE).",
      hint: "C PAYROLL.DATA DATA(EMPLOYEE), Enter.",
      validator: allOf(editorHasLine((t) => /DATA\(EMPLOYEE\)/.test(t)), editorOpen("{HLQ}.JCL", "PAYRPT")),
    },
    {
      id: "resubmit",
      instruction: "Type SUBMIT. This time the job ends with CC 0000.",
      hint: "SUBMIT, Enter.",
      validator: eventIs("JOB_COMPLETED", (e) => e.status === "OUTPUT" && e.maxRc === 0),
    },
    {
      id: "save",
      instruction: "Press PF3 to save the corrected member and return to SDSF.",
      hint: "F3.",
      validator: allOf(editorClosed, payrptFixed),
    },
  ],
};

export const lesson28: Lesson = {
  id: "l28-day-one",
  number: 28,
  module: "Batch jobs and SDSF",
  title: "Day-One challenge: the payroll report",
  description: "Everything together: find the job, run it, diagnose the failure, fix it, prove it works.",
  objective: "Make {HLQ}.JCL(PAYRPT) run to CC 0000 and look at its report in SYSUT2 - by whatever route you choose.",
  teaches: ["Navigating with =, 3.4 and member lists", "Submitting and reading SDSF", "Diagnosing IEF212I", "Editing and saving JCL"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" }, resetJobs: true, resetMembers: [{ dsn: "{HLQ}.JCL", member: "PAYRPT" }] },
  steps: [
    {
      id: "run-it",
      instruction: "Submit {HLQ}.JCL(PAYRPT) and see how it ends.",
      hint: "TSO SUBMIT JCL(PAYRPT), then =S and ST.",
      validator: anyOf(eventIs("JCL_ERROR_GENERATED"), payrptSucceeded),
    },
    {
      id: "diagnose",
      instruction: "Find the reason in the job's output (JESYSMSG).",
      hint: "? on the job, S next to JESYSMSG: IEF212I names the data set.",
      validator: anyOf(eventIs("JOB_OUTPUT_OPENED", (e) => e.ddname === "JESYSMSG"), payrptSucceeded),
    },
    {
      id: "fix-and-save",
      instruction: "Fix the JCL so SYSUT1 reads {HLQ}.DATA(EMPLOYEE), save it, and resubmit until the job ends CC 0000.",
      hint: "SJ from SDSF or Edit the member; C PAYROLL.DATA DATA(EMPLOYEE); SUBMIT; F3.",
      validator: allOf(payrptFixed, payrptSucceeded, editorClosed),
    },
    {
      id: "report",
      instruction: "In SDSF, open the successful job's data sets with ? and browse SYSUT2 - the payroll report.",
      hint: "=S, ST, ? on the CC 0000 job, S next to SYSUT2.",
      validator: eventIs("JOB_OUTPUT_OPENED", (e) => e.ddname === "SYSUT2"),
    },
  ],
  challenge: {
    task: "Make {HLQ}.JCL(PAYRPT) run to CC 0000 (fix the SYSUT1 data set name, save the member, resubmit). Only the result counts.",
    validator: allOf(payrptFixed, payrptSucceeded, editorClosed),
  },
};
