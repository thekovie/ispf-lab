/**
 * Virtual JES: jobs, steps, spooled output. Everything is simulated and deterministic — a submitted job runs to
 * completion inside the reducer. Reference: docs/10-jes-sdsf.md; IBM z/OS JCL Reference, JES2 Messages.
 */
import type { DsnRef } from "@/catalog/types";

/** Where SDSF shows the job: OUTPUT = ran (see maxRc / abend); JCL_ERROR = converter/allocation failure. */
export type JobStatus = "OUTPUT" | "JCL_ERROR";

export interface JobStep {
  name: string;
  program: string;
  /** condition code; undefined when the step did not execute (flushed after an error) */
  rc?: number;
  abend?: string;
  executed: boolean;
}

/** One spool data set (JESMSGLG, JESJCL, JESYSMSG, or a SYSOUT DD of a step). */
export interface JobOutput {
  ddname: string;
  stepName?: string;
  records: string[];
}

export interface Job {
  /** JOB00001 … */
  id: string;
  number: number;
  jobName: string;
  owner: string;
  class: string;
  msgclass: string;
  /** the data set the JCL came from, when submitted from a member; undefined for an unsaved editor buffer */
  source?: DsnRef;
  submittedOn: string;
  /** sequence within the day, used as a stable stand-in for the submit time */
  sequence: number;
  status: JobStatus;
  maxRc?: number;
  abend?: string;
  steps: JobStep[];
  outputs: JobOutput[];
  jcl: string[];
}

export interface JesState {
  version: 1;
  nextJobNumber: number;
  jobs: Job[];
  /** accumulated $HASP / IEF messages, newest last (SDSF LOG) */
  log: string[];
}

export const EMPTY_JES: JesState = { version: 1, nextJobNumber: 1, jobs: [], log: [] };

export const jobIdFor = (n: number): string => `JOB${String(n).padStart(5, "0")}`;
