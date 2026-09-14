/**
 * Engine-side JES actions shared by the editor SUBMIT, the member-list J, TSO SUBMIT and SDSF:
 * submit records, open spool output in Browse, purge.
 * Reference: docs/10-jes-sdsf.md.
 */
import type { DsnRef } from "@/catalog/types";
import { openSession } from "@/editor/session";
import { purgeJob, submitJob } from "@/jes/submit";
import type { Job } from "@/jes/types";
import { fail, push } from "./navigation";
import type { ScreenId, SimEvent, SimulatorState, StepResult } from "./types";

/** Submit JCL records; the job runs to completion and the confirmation becomes the panel message. */
export function submitRecords(state: SimulatorState, records: string[], source: DsnRef | undefined, from: ScreenId): StepResult {
  if (records.every((r) => r.trim() === "")) return fail(state, "NOTHING TO SUBMIT", "The data to submit is empty.");
  const r = submitJob(state.jes, state.catalog, { records, source, userid: state.userid, today: state.today });
  const events: SimEvent[] = [
    { type: "JOB_SUBMITTED", jobId: r.job.id, jobName: r.job.jobName, source, from },
    { type: "JOB_COMPLETED", jobId: r.job.id, jobName: r.job.jobName, status: r.job.status, maxRc: r.job.maxRc, abend: r.job.abend },
  ];
  if (r.job.status === "JCL_ERROR") events.push({ type: "JCL_ERROR_GENERATED", jobId: r.job.id, jobName: r.job.jobName });
  return {
    state: {
      ...state,
      jes: r.jes,
      catalog: r.catalog,
      message: { short: `JOB ${r.job.jobName}(${r.job.id}) SUBMITTED`, long: `${r.message}. The job has already run: check its status and output in SDSF (option S).`, severity: "info" },
    },
    events,
  };
}

export function findJob(state: SimulatorState, jobId: string): Job | undefined {
  return state.jes.jobs.find((j) => j.id === jobId.toUpperCase());
}

/** Open one spool data set (or all of them) of a job in Browse. */
export function browseJobOutput(state: SimulatorState, job: Job, ddname?: string): StepResult {
  const outputs = ddname ? job.outputs.filter((o) => o.ddname === ddname) : job.outputs;
  if (outputs.length === 0) return fail(state, "NO OUTPUT", `${job.id} has no spool data set named ${ddname ?? ""}.`);
  const records = ddname ? outputs[0].records : outputs.flatMap((o) => [`********************************* ${o.ddname.padEnd(8)} ${o.stepName ?? "JES2"} *********************************`, ...o.records]);
  const session = openSession({
    mode: "BROWSE",
    dsn: `${job.jobName}.${job.id}`,
    member: ddname,
    lrecl: Math.max(80, ...records.map((r) => r.length)),
    readOnly: true,
    records,
    scrollAmount: state.settings.scrollDefault,
  });
  return push({ ...state, activeDataset: session.dsn, activeMember: ddname, editor: session }, { id: "BROWSE" }, [{ type: "JOB_OUTPUT_OPENED", jobId: job.id, ddname }]);
}

export function purge(state: SimulatorState, jobId: string): StepResult {
  const job = findJob(state, jobId);
  if (!job) return fail(state, "JOB NOT FOUND");
  return {
    state: { ...state, jes: purgeJob(state.jes, job.id), message: { short: `${job.id} PURGED`, long: `${job.jobName}(${job.id}) and its output were removed from the spool.`, severity: "info" } },
    events: [{ type: "JOB_PURGED", jobId: job.id }],
  };
}
