# 0012 — Jobs run to completion synchronously inside the reducer; SDSF is a simulated, labelled read model

Date: 2026-09-15 · Status: Accepted

## Context
Learners need the submit → SDSF → read JESYSMSG → fix → resubmit loop. A faithful JES has queues, initiators and
time; the engine is a pure, deterministic reducer with no clock beyond `today`.

## Options
1. Asynchronous job states (INPUT → EXECUTING → OUTPUT) advanced by a timer in React — non-deterministic tests,
   time-dependent lesson validators, and React logic in the engine's domain.
2. Run the job to completion in `submitJob` and store the finished `Job` (status OUTPUT or JCL_ERROR) in
   `state.jes`; SDSF panels are pure views over it.

## Decision
Option 2. `src/jes/submit.ts` converts, allocates, runs the four supported programs, applies dispositions and
spools JESMSGLG/JESJCL/JESYSMSG with IBM message ids. Failures are modelled where they teach something: converter
errors (IEFC6xxI → JCL ERROR), allocation failures (IEF212I → JCL ERROR with flushed steps), missing modules
(S806 abend). SDSF is reached by option `S` (site-dependent letter, documented) and every title is marked
`(SIMULATED)`. Job state is persisted per userid under its own key and included in the lab bundle.

## Consequences
- Tests and lesson validators are deterministic (`JOB_COMPLETED{status,maxRc}` fires on submit).
- "Wait for the job" is not part of the learning loop; the docs and glossary say real jobs queue.
- The editor submits its buffer (unsaved JCL runs) — a deliberate, documented deviation for experimentation.
