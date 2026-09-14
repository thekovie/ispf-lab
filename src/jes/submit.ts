/**
 * Submit JCL to the virtual JES: convert (parseJcl), allocate each step's DDs against the catalog, run the
 * program, write dispositions, and spool JESMSGLG / JESJCL / JESYSMSG plus SYSOUT DDs. The job runs to completion
 * synchronously — there is no queue to wait for, only the result to inspect in SDSF.
 * Reference: docs/10-jes-sdsf.md; message texts follow z/OS MVS System Messages (IEF*, IEFC*, IGD*, CSV*, $HASP*).
 */
import { allocate, deleteDataset, getDataset, parseDsnRef } from "@/catalog/catalog";
import type { Catalog, DsnRef, Recfm, SpaceUnits } from "@/catalog/types";
import { dispStatus, parseJcl, splitParams, type DdStatement, type StepStatement } from "./jcl";
import { runProgram } from "./programs";
import { jobIdFor, type JesState, type Job, type JobOutput, type JobStep } from "./types";

export interface SubmitInput {
  records: string[];
  source?: DsnRef;
  userid: string;
  today: string;
}

export interface SubmitResult {
  jes: JesState;
  catalog: Catalog;
  job: Job;
  /** IKJ56250I-style confirmation */
  message: string;
}

const cc = (n: number) => String(n).padStart(4, "0");

/** DCB / SPACE parameters of a NEW data set → allocation request. */
function allocationFor(dd: DdStatement, name: string, userid: string) {
  const dcb: Record<string, string> = {};
  if (dd.params.DCB) {
    for (const kv of splitParams(dd.params.DCB.replace(/^\(|\)$/g, ""))) {
      const [k, v] = kv.split("=");
      if (k && v) dcb[k.toUpperCase()] = v.toUpperCase();
    }
  }
  const recfmRaw = (dd.params.RECFM ?? dcb.RECFM ?? "FB").toUpperCase();
  const recfm = (["FB", "VB", "F", "V", "U"].includes(recfmRaw) ? recfmRaw : "FB") as Recfm;
  const lrecl = parseInt(dd.params.LRECL ?? dcb.LRECL ?? "80", 10) || 80;
  const space = dd.params.SPACE ? splitParams(dd.params.SPACE.replace(/^\(|\)$/g, "")) : ["TRK", "(1,1)"];
  const unitsRaw = (space[0] ?? "TRK").toUpperCase();
  const spaceUnits: SpaceUnits = unitsRaw.startsWith("CYL") ? "CYLS" : unitsRaw.startsWith("TRK") ? "TRKS" : "BLKS";
  const qty = (space[1] ?? "(1,1)")
    .replace(/^\(|\)$/g, "")
    .split(",")
    .map((n) => parseInt(n, 10) || 0);
  return { name, spaceUnits, primary: qty[0] || 1, secondary: qty[1] ?? 0, dirBlocks: qty[2] ?? 0, recfm, lrecl, volume: "USR001", owner: userid };
}

interface AllocResult {
  catalog: Catalog;
  sysmsg: string[];
  error?: string;
}

/** IEF236I/IEF237I allocation for one step; NEW data sets are created, missing OLD/SHR/MOD ones fail the step. */
function allocateStep(catalog: Catalog, jobName: string, step: StepStatement, userid: string, today: string): AllocResult {
  const sysmsg = [`IEF236I ALLOC. FOR ${jobName} ${step.name}`];
  let cat = catalog;
  for (const dd of step.dds) {
    if (dd.sysout !== undefined || dd.instream || dd.dummy || !dd.params.DSN) {
      sysmsg.push(`IEF237I JES2 ALLOCATED TO ${dd.ddname}`);
      continue;
    }
    const ref = parseDsnRef(dd.params.DSN);
    if (!ref) {
      sysmsg.push(`IEF212I ${jobName} ${step.name} ${dd.ddname} - DATA SET NOT FOUND`);
      return { catalog: cat, sysmsg, error: "DATA SET NOT FOUND" };
    }
    const status = dispStatus(dd.params) || "NEW";
    const existing = getDataset(cat, ref.dsn);
    if (status === "NEW") {
      if (existing) {
        sysmsg.push(`IGD17101I DATA SET ${ref.dsn}`, "NOT DEFINED BECAUSE DUPLICATE NAME EXISTS IN CATALOG");
        return { catalog: cat, sysmsg, error: "DUPLICATE NAME" };
      }
      const r = allocate(cat, allocationFor(dd, ref.dsn, userid), today);
      if (r.error) {
        sysmsg.push(`IEF212I ${jobName} ${step.name} ${dd.ddname} - ${r.error}`);
        return { catalog: cat, sysmsg, error: r.error };
      }
      cat = r.catalog;
      sysmsg.push(`IGD101I SMS ALLOCATED TO DDNAME (${dd.ddname.padEnd(8)})`, `        DSN (${ref.dsn.padEnd(44)})`, "        STORCLAS (USRDATA) MGMTCLAS (STANDARD) DATACLAS (        )");
      continue;
    }
    if (!existing) {
      sysmsg.push(`IEF212I ${jobName} ${step.name} ${dd.ddname} - DATA SET NOT FOUND`);
      return { catalog: cat, sysmsg, error: "DATA SET NOT FOUND" };
    }
    sysmsg.push(`IEF237I ${existing.volume} ALLOCATED TO ${dd.ddname}`);
  }
  return { catalog: cat, sysmsg };
}

/** IEF285I disposition messages after the step; a DELETE disposition removes the data set. */
function disposeStep(catalog: Catalog, step: StepStatement, abended: boolean): { catalog: Catalog; sysmsg: string[] } {
  const sysmsg: string[] = [];
  let cat = catalog;
  for (const dd of step.dds) {
    if (!dd.params.DSN || dd.sysout !== undefined || dd.dummy) continue;
    const ref = parseDsnRef(dd.params.DSN);
    if (!ref || !getDataset(cat, ref.dsn)) continue;
    const disp = dd.params.DISP ?? "";
    const parts = splitParams(disp.startsWith("(") ? disp.slice(1, -1) : disp).map((p) => p.toUpperCase());
    const status = parts[0] || "NEW";
    const normal = parts[1] ?? (status === "NEW" ? "DELETE" : "KEEP");
    const action = abended ? (parts[2] ?? normal) : normal;
    if (action === "DELETE") {
      const r = deleteDataset(cat, ref.dsn);
      if (!r.error) cat = r.catalog;
      sysmsg.push(`IEF285I   ${ref.dsn.padEnd(44)} ${r.error ? "KEPT" : "DELETED"}`);
    } else {
      sysmsg.push(`IEF285I   ${ref.dsn.padEnd(44)} ${action === "CATLG" ? "CATALOGED" : "KEPT"}`);
    }
    sysmsg.push(`IEF285I   VOL SER NOS= ${getDataset(cat, ref.dsn)?.volume ?? "USR001"}.`);
  }
  return { catalog: cat, sysmsg };
}

const flushRow = (jobName: string, step: string) => `-${jobName.padEnd(8)} ${step.padEnd(8)}          FLUSH      0    .00    .00    .0`;

export function submitJob(jes: JesState, catalog: Catalog, input: SubmitInput): SubmitResult {
  const parsed = parseJcl(input.records);
  const number = jes.nextJobNumber;
  const id = jobIdFor(number);
  const jobName = parsed.jobName ?? "NONAME";
  const owner = input.userid.toUpperCase();
  const jobClass = (parsed.jobParams.CLASS ?? "A").toUpperCase();
  const msgclass = (parsed.jobParams.MSGCLASS ?? "X").toUpperCase();
  const sequence = jes.jobs.filter((j) => j.submittedOn === input.today).length + 1;
  const day = input.today;
  const msglg: string[] = [
    "1                    J E S 2  J O B  L O G  --  S Y S T E M  S Y S 1  --  N O D E  I S P F L A B",
    "0",
    ` ${day} $HASP100 ${jobName.padEnd(8)} ON INTRDR                            FROM TSU00001 ${owner}`,
    ` ${day} IRR010I  USERID ${owner.padEnd(8)} IS ASSIGNED TO THIS JOB.`,
  ];
  const jesjcl = [...parsed.listing];
  const sysmsg: string[] = [];
  const steps: JobStep[] = [];
  const outputs: JobOutput[] = [];
  let cat = catalog;
  let status: Job["status"] = "OUTPUT";
  let maxRc: number | undefined;
  let abend: string | undefined;

  if (parsed.errors.length > 0) {
    status = "JCL_ERROR";
    sysmsg.push(" STMT NO. MESSAGE");
    for (const e of parsed.errors) sysmsg.push(`${String(e.line).padStart(8)} ${e.id} ${e.text}`);
    msglg.push(` ${day} IEFC452I ${jobName} - JOB NOT RUN - JCL ERROR`);
    for (const st of parsed.steps) steps.push({ name: st.name, program: st.program ?? st.proc ?? "", executed: false });
  } else {
    msglg.push(` ${day} ICH70001I ${owner.padEnd(8)} LAST ACCESS AT 00:00:00 ON ${day}`, ` ${day} $HASP373 ${jobName.padEnd(8)} STARTED - INIT 1    - CLASS ${jobClass} - SYS SYS1`, ` ${day} IEF403I ${jobName} - STARTED`);
    const table: string[] = ["-                                     --TIMINGS (MINS.)--", "-JOBNAME  STEPNAME PROCSTEP    RC   EXCP    CPU    SRB  CLOCK"];
    sysmsg.push(`IEF375I  JOB/${jobName.padEnd(8)}/START ${day}`);
    let flushed = false;
    for (const st of parsed.steps) {
      const program = st.program ?? st.proc ?? "";
      if (flushed) {
        steps.push({ name: st.name, program, executed: false });
        sysmsg.push(`IEF272I ${jobName} ${st.name} - STEP WAS NOT EXECUTED`);
        table.push(flushRow(jobName, st.name));
        continue;
      }
      if (!st.program) {
        // cataloged procedures are not simulated
        sysmsg.push(`IEFC612I PROCEDURE ${st.proc} WAS NOT FOUND`, `IEF272I ${jobName} ${st.name} - STEP WAS NOT EXECUTED`);
        steps.push({ name: st.name, program, executed: false });
        table.push(flushRow(jobName, st.name));
        status = "JCL_ERROR";
        flushed = true;
        continue;
      }
      const alloc = allocateStep(cat, jobName, st, owner, day);
      sysmsg.push(...alloc.sysmsg);
      cat = alloc.catalog;
      if (alloc.error) {
        sysmsg.push(`IEF272I ${jobName} ${st.name} - STEP WAS NOT EXECUTED`);
        steps.push({ name: st.name, program, executed: false });
        table.push(flushRow(jobName, st.name));
        status = "JCL_ERROR";
        flushed = true;
        continue;
      }
      sysmsg.push(`IEF373I STEP/${st.name.padEnd(8)}/START ${day}`);
      const run = runProgram({ catalog: cat, userid: owner, today: day, jobName, step: st });
      cat = run.catalog;
      for (const o of run.sysout) outputs.push({ ddname: o.ddname, stepName: st.name, records: o.records });
      sysmsg.push(...run.messages);
      if (run.abend) {
        sysmsg.push(`IEF450I ${jobName} ${st.name} - ABEND=${run.abend} U0000 REASON=00000004`);
        table.push(`-${jobName.padEnd(8)} ${st.name.padEnd(8)}          *${run.abend}     8    .00    .00    .0`);
        steps.push({ name: st.name, program, abend: run.abend, executed: true });
        abend = run.abend;
        flushed = true;
      } else {
        const rc = run.rc ?? 0;
        sysmsg.push(`IEF142I ${jobName} ${st.name} - STEP WAS EXECUTED - COND CODE ${cc(rc)}`);
        table.push(`-${jobName.padEnd(8)} ${st.name.padEnd(8)}          ${cc(rc).slice(2)}     ${String(8 + st.dds.length).padStart(3)}    .00    .00    .0`);
        steps.push({ name: st.name, program, rc, executed: true });
        maxRc = Math.max(maxRc ?? 0, rc);
      }
      const disp = disposeStep(cat, st, !!run.abend);
      cat = disp.catalog;
      sysmsg.push(...disp.sysmsg, `IEF374I STEP/${st.name.padEnd(8)}/STOP  ${day} RC=${cc(run.rc ?? 0)}`);
    }
    sysmsg.push(`IEF376I  JOB/${jobName.padEnd(8)}/STOP  ${day} CPU=0MIN 00.01SEC`);
    const ended = abend ? `ABEND=${abend}` : status === "JCL_ERROR" ? "JCL ERROR" : `RC=${cc(maxRc ?? 0)}`;
    msglg.push(...table, ` ${day} IEF404I ${jobName} - ENDED`, `-${jobName.padEnd(8)} ENDED.  NAME-${(parsed.jobParams["1"] ?? "").replace(/'/g, "").padEnd(20)} TOTAL CPU TIME=   .00  TOTAL ELAPSED TIME=   .0`, ` ${day} $HASP395 ${jobName.padEnd(8)} ENDED - ${ended}`);
  }
  msglg.push("0------ JES2 JOB STATISTICS ------", `-  ${String(input.records.length).padStart(9)} CARDS READ`, `-  ${String(sysmsg.length + jesjcl.length + msglg.length + 3).padStart(9)} SYSOUT PRINT RECORDS`);

  const job: Job = {
    id,
    number,
    jobName,
    owner,
    class: jobClass,
    msgclass,
    source: input.source,
    submittedOn: day,
    sequence,
    status,
    maxRc: status === "JCL_ERROR" ? undefined : maxRc,
    abend,
    steps,
    outputs: [{ ddname: "JESMSGLG", records: msglg }, { ddname: "JESJCL", records: jesjcl }, { ddname: "JESYSMSG", records: sysmsg }, ...outputs],
    jcl: input.records,
  };
  const ended = abend ? `ABEND=${abend}` : status === "JCL_ERROR" ? "JCL ERROR" : `RC=${cc(maxRc ?? 0)}`;
  const logLines =
    parsed.errors.length > 0
      ? [`${day} $HASP100 ${jobName.padEnd(8)} ON INTRDR  FROM ${owner}`, `${day} IEFC452I ${jobName} - JOB NOT RUN - JCL ERROR`]
      : [`${day} $HASP100 ${jobName.padEnd(8)} ON INTRDR  FROM ${owner}`, `${day} $HASP373 ${jobName.padEnd(8)} STARTED - INIT 1 - CLASS ${jobClass}`, `${day} IEF403I ${jobName} - STARTED`, `${day} IEF404I ${jobName} - ENDED`, `${day} $HASP395 ${jobName.padEnd(8)} ENDED - ${ended}`];
  return {
    jes: { ...jes, nextJobNumber: number + 1, jobs: [...jes.jobs, job], log: [...jes.log, ...logLines].slice(-500) },
    catalog: cat,
    job,
    message: `IKJ56250I JOB ${jobName}(${id}) SUBMITTED`,
  };
}

/** SDSF Max-RC column text. */
export function maxRcText(job: Job): string {
  if (job.status === "JCL_ERROR") return "JCL ERROR";
  if (job.abend) return `ABEND ${job.abend}`;
  return `CC ${cc(job.maxRc ?? 0)}`;
}

export function purgeJob(jes: JesState, id: string): JesState {
  return { ...jes, jobs: jes.jobs.filter((j) => j.id !== id) };
}
