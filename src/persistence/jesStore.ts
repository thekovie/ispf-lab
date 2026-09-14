/**
 * Virtual JES state (jobs and their spool output) per userid: ispf-lab:jes:v1:<USERID>.
 * Reference: docs/10-jes-sdsf.md. Stored separately from the catalog so a catalog reset does not purge jobs.
 */
import { EMPTY_JES, type JesState, type Job, type JobOutput, type JobStep } from "@/jes/types";
import { KEYS } from "./keys";
import type { StorageAdapter } from "./storage";

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);

function sanitizeJob(raw: unknown): Job | null {
  if (!isObj(raw) || typeof raw.id !== "string" || !/^JOB\d{5}$/.test(raw.id) || typeof raw.jobName !== "string") return null;
  const steps: JobStep[] = Array.isArray(raw.steps)
    ? raw.steps.filter(isObj).map((s) => ({ name: String(s.name ?? ""), program: String(s.program ?? ""), rc: typeof s.rc === "number" ? s.rc : undefined, abend: typeof s.abend === "string" ? s.abend : undefined, executed: s.executed === true }))
    : [];
  const outputs: JobOutput[] = Array.isArray(raw.outputs)
    ? raw.outputs.filter(isObj).map((o) => ({ ddname: String(o.ddname ?? "SYSOUT"), stepName: typeof o.stepName === "string" ? o.stepName : undefined, records: strs(o.records) }))
    : [];
  const source = isObj(raw.source) && typeof raw.source.dsn === "string" ? { dsn: raw.source.dsn, member: typeof raw.source.member === "string" ? raw.source.member : undefined } : undefined;
  return {
    id: raw.id,
    number: num(raw.number, parseInt(raw.id.slice(3), 10)),
    jobName: raw.jobName,
    owner: String(raw.owner ?? ""),
    class: String(raw.class ?? "A"),
    msgclass: String(raw.msgclass ?? "X"),
    source,
    submittedOn: String(raw.submittedOn ?? ""),
    sequence: num(raw.sequence, 1),
    status: raw.status === "JCL_ERROR" ? "JCL_ERROR" : "OUTPUT",
    maxRc: typeof raw.maxRc === "number" ? raw.maxRc : undefined,
    abend: typeof raw.abend === "string" ? raw.abend : undefined,
    steps,
    outputs,
    jcl: strs(raw.jcl),
  };
}

/** Validate a stored / imported JES state field by field. */
export function sanitizeJes(raw: unknown): JesState {
  if (!isObj(raw) || raw.version !== 1) return EMPTY_JES;
  const jobs = Array.isArray(raw.jobs) ? raw.jobs.map(sanitizeJob).filter((j): j is Job => j !== null) : [];
  const maxNumber = jobs.reduce((m, j) => Math.max(m, j.number), 0);
  return { version: 1, nextJobNumber: Math.max(num(raw.nextJobNumber, 1), maxNumber + 1), jobs, log: strs(raw.log).slice(-500) };
}

export function loadJes(storage: StorageAdapter, userid: string): JesState {
  return sanitizeJes(storage.get<unknown>(KEYS.jes(userid)));
}

export function saveJes(storage: StorageAdapter, userid: string, jes: JesState): void {
  storage.set(KEYS.jes(userid), jes);
}

export function resetJes(storage: StorageAdapter, userid: string): void {
  storage.remove(KEYS.jes(userid));
}
