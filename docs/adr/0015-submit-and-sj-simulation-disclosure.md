# 0015 — Edit SUBMIT matches IBM; SDSF SJ/SE are disclosed simplifications

Date: 2026-10-15 · Status: Accepted (decision D2 of the M0 acceptance review). Corrects a consequence of ADR 0012.

## Context
ADR 0012, the glossary and `docs/10-jes-sdsf.md` say real ISPF submits the data set on disk, so an unsaved change is
not submitted, and describe the simulator's behaviour (submit the editor buffer) as a deliberate deviation. The M0
review checked this against the z/OS 3.2 *ISPF Edit and Edit Macros* manual (SC19-3621-70):

- Edit `SUBMIT` "submits the member or data set you are editing", with label, `X` and `NX` operands; the command
  summary says it "submits the data you are editing". The "will submit the updated data set, not the copy being
  browsed" wording belongs to **Browse** SUBMIT (User's Guide Vol II). IBM does not say whether unsaved edits are
  included.
- SDSF: `SJ` edits the JCL held for the job; "changes you make to the data are not saved". `SE` edits output data sets
  and `X` is Print. The simulator's `SJ` and `SE` share a branch and open the **saved** member.

## Decision
1. The simulator keeps submitting the editor buffer. This is consistent with IBM's wording, so it is **not** labelled a
   deviation. Documentation will say only what IBM says and will not assert the unsaved case.
2. The SDSF `SJ`/`SE` difference is a **disclosed simplification**: lessons and the glossary will state that real SDSF
   edits a copy that is not saved to the PDS member, while this simulator opens the saved member. Both fix routes
   (via `SJ` or via Edit option 2, then resubmit) stay valid.
3. No SDSF redesign now. Reading the JCL JES holds for the job, a correct `SE` and `X`, and writing nothing back to the
   member are deferred to the simulator-extension milestone (M4) and need an approved lesson.

## Consequences
- The wording changes are made in M1b; behaviour does not change in M1a.
- `tests/engine/sdsf.test.ts` and `tests/tutorial/lessons.test.ts` currently lock in the old premise; they are
  updated together with the wording.
- Open for expert confirmation: unsaved edits and `SJ` write-back (see `docs/curriculum/m0-acceptance-review.md` C.2).
