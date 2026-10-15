# Lesson authoring and quality standards (Phase 0, Deliverable 7)

Part of the [Phase 0 audit](phase-0-audit.md). These standards apply to every new lesson and to every corrected existing lesson. They extend `CONTRIBUTING.md` ("How to add a lesson") and `docs/05-course-design.md` (runner rules); they do not replace the repository rules in `CLAUDE.md` (pure-TypeScript engine, ISPF-style messages via `fail()`, validators on events and state only, `{HLQ}` placeholder, no personal names, every row within 80 columns, behaviour changes update the behaviour docs and a test).

Ground rules, in priority order:

1. **Technical accuracy beats quantity.** A lesson that cannot cite an IBM source for each material claim is not shippable.
2. **Say what the simulator is.** ISPF Lab is not z/OS, a TN3270 client or an IBM-operated system. Any behaviour that differs from real z/OS must be disclosed in the lesson.
3. **A passing test proves internal consistency, not IBM fidelity.** Never cite a test as evidence of how z/OS behaves.
4. **Write original explanations.** Link to IBM documents; do not reproduce substantial passages. Quotes in evidence files are limited to 25 words.

## 1. Lesson specification template

Every lesson starts as a spec file (Markdown, committed under `docs/curriculum/lessons/<id>.md` or as a PR description) with these sections, before any code is written. The spec is the review artefact.

```
# <id> — <title>

Track / module:           (e.g. B / JCL fundamentals)
Number and stable ID:     (ID never changes once published; e.g. b-jcl-010-disp-defaults)
Audience and difficulty:  beginner | intermediate | advanced
Lesson type:              interactive | conceptual | diagnostic | hybrid
Prerequisites:            lesson IDs, and the state each leaves behind
Estimated time:           minutes
Review status:            draft | source-reviewed | fidelity-reviewed | approved   (see section 9)

## Learning objectives            (2-5, measurable; see section 3)
## Terminology                    (terms introduced; each maps to a glossary entry)
## Conceptual explanation         (original text; every material claim carries [SRC-nnn p.x])
## Worked example                 (fully shown, sourced)
## Guided activity                (step list; see section 4)
## Independent challenge          (see section 5)
## Common mistakes                (and the simulator's response to each)
## Expected results               (exact panel/message text the learner should see)
## Simulator limitations          (what differs from z/OS; shown to the learner)
## References                     (SRC ids, book, release, page or topic URL, verification date)
## Validation design              (events/state checked; false-positive and alternative-workflow analysis)
## Starting state and reset       (data created, data to remove on replay)
```

Machine-readable metadata added to the `Lesson` type in the first infrastructure milestone (see the implementation roadmap):

```ts
{
  id: "b-jcl-010-disp-defaults",   // stable, kebab-case, never reused
  requires: ["l06-allocating"],     // prerequisites (IDs)
  leaves: ["data set X exists"],    // state left behind, for reset logic
  difficulty: "intermediate",
  estimatedMinutes: 15,
  sources: ["SRC-003#disp-defaults", "SRC-019#IEF285I"],
  reviewStatus: "approved",
}
```

## 2. Required source evidence

1. Every technical claim in instructions, hints, explanations, glossary entries, expected results and simulated messages needs a source row in [verified-sources.md](verified-sources.md) or an evidence appendix: **book, release, topic or printed page, verification date**.
2. Tier 1 (IBM product documentation) is required for commands, syntax, defaults, message IDs and message text. Tier 2 (Redbooks, SHARE) may support concepts and workflow. Tier 3 may not override IBM and may not be the sole support for any claim.
3. A landing page is never sufficient evidence for a command or message.
4. Message IDs and texts must be looked up in the messages books (SRC-016, SRC-019, SRC-021, SRC-028). **Do not coin a message ID.** If the exact text is unverified, use an honest generic simulator message in plain text and mark it `SIMULATED` (see section 7).
5. If a claim cannot be verified, record the gap in `verified-sources.md` section 6 and either drop the claim or label it clearly as a simplification. Never fill from memory, never invent a section number or publication detail.
6. Re-verify when the target release changes. Record the release (z/OS 3.2 at baseline).

## 3. Objective-writing rules

- Use an observable verb: *allocate, identify, predict, locate, correct, explain, compare, interpret*. Avoid *understand, know, learn, be aware of*.
- One behaviour per objective, with the condition and the standard: "Given a JCL error in JESYSMSG, locate the failing DD and name the missing data set."
- 2 to 5 objectives per lesson. If more are needed, split the lesson.
- Every objective maps to at least one guided step **and** one validator check; every validator check maps back to an objective. A step that exists only to move the learner along is a transition, not a task, and must not be scored.
- Objectives must not require unsupported simulator commands. Check the [simulator gap matrix](simulator-gap-matrix.md) before writing them.

## 4. Guided exercise standards

- Each step states **what to do and why**, in one or two sentences, using `{HLQ}` for the user's high-level qualifier.
- Each step has exactly one hint, which nudges without giving the answer outright on the first level, and a short "why" explanation.
- The instruction must match the simulator exactly: run every step by hand (or by a coached walk) and confirm the panel, message and result text quoted in the lesson.
- If the step asks the learner to trigger an error, the scoring engine must not count that error as a mistake.
- Prefer real workflows learners will meet. Accept equivalent legitimate paths (primary command or line command, `=3.4` or menu navigation, `END` or `PF3`) unless the objective is that specific method.
- Do not teach a simulator-only shortcut as if it were z/OS. Label trainer shortcuts (for example `SD` for SDSF, unless IBM documents it).
- Where the lesson depends on prior state, declare it in `requires` and make the starting state self-sufficient (create what is needed, or fail with a clear "complete lesson X first" message) rather than assuming a previous lesson ran.

## 5. Challenge standards

- A challenge assesses the **objective**, not repetition of the guided commands. Provide a new but equivalent situation (different member or data set, a fault to find) and no step list.
- **Every lesson defines its own `challenge`.** The default "last step's validator" is retired because it completes on the first action when the final condition is already true (see GAP-60).
- The challenge validator must be false at the moment the challenge starts. Reset the scenario on entering Challenge mode (re-apply the starting state) and snapshot a baseline so that only work done during the challenge can satisfy it.
- Validate **outcome plus necessary evidence of method** only where the method is the objective (for example "read SYSUT2" is checked with an event when reading output is the point). If the outcome is the objective, state-only validation is acceptable, but then the objective text must say "outcome only".
- Accept every legitimate route to the outcome (see section 6). Reject only routes that skip the learning objective.
- No reliance on unsaved editor buffers unless the lesson is explicitly about the unsaved/saved distinction.
- Scoring is per mode (Learn, Practice, Challenge), ignores instructed errors, and never exposes the answer in the failure message.

## 6. Validation requirements

Every validator is reviewed against this checklist and the result recorded in the spec ("Validation design"):

| Check | Requirement |
|---|---|
| Event vs state | Prefer an event when the action is the point; use state when the result is the point. State-only validators must not auto-pass on stale data |
| False positives | List every action that could satisfy the validator without the intended behaviour (any `D`, any `R`, any `EDIT_CANCELLED`, leftover data, comment text matching a regex). Tighten until none remain |
| Rejected alternatives | List legitimate alternative workflows and confirm each passes (create-then-catalog vs fix-the-JCL, `SUB` vs `SUBMIT`, `PF3` vs `END`) |
| Regex / text matching | Match parsed structure (statement, DD, parameter), not raw text anywhere in the member. Ignore comment lines. Case-insensitive where ISPF is |
| Determinism | No wall-clock or random input. Job ids, dates and timings come from the seed or the clock injected by tests |
| Isolation | The lesson works on first run, on replay, after switching modes, and after a different lesson ran. Declare data created and data removed on reset |
| Idempotent reset | Restart deletes learner-created data sets and members the lesson created, restores seed members, clears the job queue if the lesson uses JES |
| Tests | Add: a coached walk (happy path), at least one negative case per false-positive risk, a replay test, a Challenge-baseline test (does not complete before any action) |

## 7. Simulator fidelity checklist

Before a lesson is approved, complete this checklist for every simulator behaviour it exercises:

- [ ] The behaviour is listed in the [gap matrix](simulator-gap-matrix.md) with a class (FULLY SUPPORTED or SIMULATED WITH DOCUMENTED LIMITATIONS are acceptable; REQUIRES TECHNICAL CORRECTION and UNSUPPORTED block approval).
- [ ] Every message the learner can see is either verified (ID and text) or marked `SIMULATED` in the lesson's limitations section.
- [ ] Constant or fabricated values (CPU time, EXCP counts, "Used" tracks, `00:00` times) are labelled as simulated or avoided.
- [ ] Differences from real z/OS are stated in the lesson in plain words (for example "real SDSF `SJ` edits a copy of the JCL; changes are not saved to the PDS member").
- [ ] No unsupported command, option or JCL keyword is required. Valid-but-unsupported features give "not supported in this module", never an invented error.
- [ ] Output fits 80 columns.
- [ ] Behaviour changes updated `docs/03-ispf-behaviour-reference.md` and/or `docs/04-editor-commands.md` and have a test.

## 8. Source review checklist

- [ ] Each claim has an SRC id and page or topic; the SRC row exists and is VERIFIED (topic), not just landing.
- [ ] Release stated; version-sensitive material (for example the 2011 Redbook screens) is cross-checked against a current IBM manual.
- [ ] Quotes are 25 words or fewer; explanations are original.
- [ ] No claim relies solely on Tier 3.
- [ ] Message IDs/texts were looked up, not recalled.
- [ ] Defaults and "always/never/most systems" wording is supported, or rewritten as "typically" / "site-configurable" with the source.
- [ ] Open questions are listed in `verified-sources.md` section 6.

## 9. Approval criteria and review status

| Status | Requirements |
|---|---|
| `draft` | Spec exists; claims may be unsourced |
| `source-reviewed` | Section 8 checklist passed by a reviewer other than the author |
| `fidelity-reviewed` | Section 7 checklist passed; a second person ran the lesson in all three modes, replayed it, and tried at least two alternative workflows and two wrong answers |
| `approved` | Tests added and green (`pnpm check`); project log, changelog and behaviour docs updated; accessibility spot-check (keyboard only, no field announced by internal id); expert review recorded for any item the evidence marked "expert review recommended" |

A lesson may be published only at `approved`. Existing lessons are labelled `REVIEW NOT COMPLETED` until audited and re-reviewed; lessons classified `CORRECTION REQUIRED` in the [existing lessons audit](existing-lessons-audit.md) must not be promoted until their corrections are merged and re-reviewed.

## 10. Common defects found in the baseline audit (use as a review prompt)

- A teaching sentence states a real-system fact the IBM documentation contradicts or does not support ("ISPF never pops up dialogs", "no undo in classic Edit", "`SJ` writes back to the member").
- A validator completes on stale state or on a bare navigation (editor closed, on the menu, any `D`).
- A challenge defaults to the last step's check.
- Replaying a lesson dead-ends because the data it creates is never removed.
- A message ID that does not exist (for example `IEFC606I`, `ICE026A`) or a field layout invented to look authentic.
- A lesson depends on another lesson's side effects with no declared prerequisite.
- A test locks in a behaviour that was never checked against IBM.
