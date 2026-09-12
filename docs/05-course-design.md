# Course design

Fourteen lessons in five modules. The order follows IBM Redbook SG24-6366 chapter 4 (logon → menu → PF keys →
data sets → editor) and the Mainframestechhelp topic order (Settings → Utilities 3.1/3.2/3.3/3.4 → member lists →
editor commands). Lesson text uses `{HLQ}`, resolved to the learner's userid at runtime.

Lesson files: `src/tutorial/lessons/module1.ts` … `module5.ts`; registry in `index.ts`.

| # | Lesson | Objective | Validated by (key validators) | Modelled on |
|---|---|---|---|---|
| 1 | Meet ISPF | logon, PF1, PF3, read a message | `LOGGED_ON`, `onScreen(HELP)`, `MESSAGE_SHOWN INVALID OPTION`, PF3 on HELP | Redbook §4.3–4.4 |
| 2 | Navigating ISPF | reach 3.4 two ways, unwind with PF3 | `onScreen(UTILITY_SELECTION)`, `onScreen(DSLIST_SEARCH)`, `onScreen(PRIMARY_OPTION_MENU)` — path-agnostic | Redbook §4.4, Mainframe Master menu |
| 3 | Settings and TSO commands | change scroll amount; `LISTCAT LEVEL({HLQ})` | `SETTING_CHANGED`, `TSO_COMMAND_ENTERED` | Mainframestechhelp Settings; Redbook §4.2 |
| 4 | Finding your data sets | list all `{HLQ}` data sets, narrow to `{HLQ}.JCL` | `dslistShowing(level)` | Redbook ch. 5 |
| 5 | Data sets and members | I information, M member list | `onScreen(DATASET_INFO)`, `memberListOpen` | Redbook §5.4 |
| 6 | Allocating a data set | 3.2 A → `{HLQ}.TEST.JCL` PDS FB/80/10 dir blocks | `DATASET_ALLOCATED`, `datasetExists` | Mainframe Master 3.2 |
| 7 | Browse versus Edit | B then E on HELLO | `editorOpen(mode)` | ISPF User's Guide |
| 8 | Editing your first member | overtype IEFBR14→IEBGENER, SAVE, PF3 | `editorHasLine`, `MEMBER_SAVED`, `memberSatisfies` + `editorClosed` | ISPF Edit manual |
| 9 | Line commands | I, fill, D, R, PF3 | `EDITOR_LINE_INSERTED/DELETED/REPEATED`, `savedMember` | SHARE lab |
| 10 | Copy and move | C+A, C+B, MM+A, CANCEL | `EDITOR_LINES_COPIED{dest}`, `EDITOR_LINES_MOVED`, `EDIT_CANCELLED` | SHARE lab |
| 11 | FIND and CHANGE | FIND, PF5 to bottom, CHANGE ALL, X/RESET, PF3 | `EDITOR_FIND`, `*BOTTOM OF DATA REACHED*`, `editorHasLine`, `EDITOR_LINES_EXCLUDED` | ISPF Edit manual |
| 12 | Managing members | S SCRATCH → SAVE → R DRAFT → D | `editorOpen`, `memberExists`, `MEMBER_RENAMED`, `MEMBER_DELETED` | Mainframestechhelp Library |
| 13 | Copying across data sets | 3.3 copy, member-list C, 3.2 D | `MEMBER_COPIED{to}`, `DATASET_DELETED` | Mainframestechhelp Move/Copy |
| 14 | Final navigation challenge | add `//STEP2   EXEC PGM=IEFBR14` to COPYJOB and save | `memberSatisfies` on the catalog only | brief |

## Step anatomy

`instruction` (Learn), `explanation` ("Why?"), `hint` (revealed on request; counts against the score),
`validator`, optional `highlightField` (Learn only; pulses the field in the terminal).

## Runner rules (`src/tutorial/engine.ts`)

- A validator receives each event of the batch, then the resulting state; any pass advances the step.
- Several consecutive steps may pass in one batch (typing `3.4` satisfies "open Utilities" and "open DSLIST").
- `MESSAGE_SHOWN{severity:error}` counts as a mistake in every mode; hints count when revealed.
- A valid ISPF action that does not advance the lesson is recorded as a *detour* and shown as a gentle note
  in Learn mode — the simulator is never blocked.
- Challenge mode ignores steps and checks `lesson.challenge.validator` (or the last step) after every action.
- Score = max(0, 100 − 10·mistakes − 15·hints). Time is not scored.
- `startingState.screen` is opened with a cleared stack; `resetMembers` restores those members from the seed so
  a lesson always starts from known data without touching the learner's other work.

## Coaching UI

`LearningPanel.tsx`: LESSON n / mode, title, module, Objective, Current task, Why?, Hint (button), Progress (n/m,
bar, step list), Note (detour), Restart, Teaches. On completion: Next lesson / Restart, and the score in Challenge.

## Glossary

`src/tutorial/explain.ts`: 32 entries with `summary`, `detail`, optional flagged `analogy`, and a `readMore`
pointer into `docs/08-resources.md`. Reached via the Explain button, `EXPLAIN <term>` on any command line, or
`/lab?explain=<term>`.

## Adding a lesson

See CONTRIBUTING.md → "How to add a lesson".
