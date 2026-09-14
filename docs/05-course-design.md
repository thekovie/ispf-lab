# Course design

Twenty-eight lessons in ten modules. Lessons 1–15 follow IBM Redbook SG24-6366 chapter 4 (logon → menu → PF keys →
data sets → editor) and the Mainframestechhelp topic order (Settings → Utilities 3.1/3.2/3.3/3.4 → member lists →
editor commands). Lessons 16–28 (added with the expansion spec) cover the jump function, RETRIEVE, the editor's
power tools (COLS/BOUNDS, profiles, UNDO, exclude/FLIP), DSLIST and member-list depth, and the batch loop
(SUBMIT → SDSF → JESYSMSG → fix → resubmit) modelled on Redbook SG24-6366 chapter 6. Lesson text uses `{HLQ}`,
resolved to the learner's userid at runtime.

Lesson files: `src/tutorial/lessons/module1.ts` … `module6.ts`, `module7-8.ts`, `module9-10.ts`; registry in
`index.ts`. Site copy derives lesson/module counts from `LESSONS.length` / `MODULES.length`.

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
| 15 | Working in two screens | edit HELLO in screen 1, view COPYJOB in screen 2, swap, end screen 2 | `SCREEN_SPLIT`, `editorOpen` + `activeScreen`, `SCREEN_SWAPPED`, `SCREEN_CLOSED` | ISPF User’s Guide “Split-screen mode” |
| 16 | Jump anywhere with = and RETURN | =2 from DSLIST, =3.4 from Edit, PF4 | `JUMP_EXECUTED{path,from}`, `editorClosed`, `RETURN_EXECUTED` | User’s Guide “Using the jump function” |
| 17 | RETRIEVE and several line commands | two X in one Enter, RESET, F12, re-run 3.4 | `LIST_COMMANDS_PROCESSED`, `LIST_RESET`, `COMMAND_RETRIEVED`, `retrieveStack` | User’s Guide “RETRIEVE”, Vol II 3.4 |
| 18 | Columns matter: COLS and BOUNDS | COLS, BOUNDS 8 72, FIND, RESET in COBOL(HELLO) | `COLS_DISPLAYED`, `BOUNDS_CHANGED`, `EDITOR_FIND`, special lines gone | Edit and Edit Macros “COLS”, “BOUNDS” |
| 19 | Edit profiles | PROFILE, CAPS ON, reopen COPYJOB, CAPS OFF | `=PROF>` present, `PROFILE_CHANGED`, `editProfiles.JCL.caps` | Edit and Edit Macros “PROFILE” |
| 20 | UNDO and edit recovery | D, UNDO, RECOVERY ON, CANCEL | `EDITOR_LINE_DELETED`, `UNDO_EXECUTED`, `PROFILE_CHANGED`, `EDIT_CANCELLED` | Edit and Edit Macros “UNDO”, “RECOVERY” |
| 21 | Excluded lines, FLIP, RESET | X DIVISION ALL, FLIP, RESET | `EDITOR_LINES_EXCLUDED`, `COMMAND_ENTERED FLIP`, `LINES_REDISPLAYED` | Edit and Edit Macros “EXCLUDE”, “FLIP” |
| 22 | DSLIST like an operator | SORT LRECL D, FIND COBOL, EXCLUDE LOADLIB, S, RESET | `LIST_SORTED`, `LIST_FIND`, `LIST_LINES_EXCLUDED`, `DATASET_INFO_VIEWED{short}`, `LIST_RESET` | User’s Guide Vol II 3.4 |
| 23 | Member statistics: I and G | I, G, I on HELLO | `MEMBER_INFO_VIEWED`, `MEMBER_STATS_RESET`, `mod === 0` | User’s Guide “Member list commands” |
| 24 | Submit your first job | read HELLO, SUBMIT, PF3 | `editorOpen`, `JOB_SUBMITTED{from:EDIT}`, `editorClosed` | Redbook §6.1–6.2 |
| 25 | SDSF: where did my job go? | J, =S, ST, S on the job | `JOB_SUBMITTED{from:MEMBER_LIST}`, `JOB_STATUS_OPENED`, `JOB_OUTPUT_OPENED` | Redbook §6.3 |
| 26 | Reading job output | TSO SUBMIT SORTJOB, ?, S SORTOUT, S JESMSGLG | `JOB_SUBMITTED{from:TSO_COMMAND}`, `onScreen(SDSF_JOB_DS)`, `JOB_OUTPUT_OPENED{ddname}` | Redbook §6.4 |
| 27 | Debug a JCL ERROR | PAYRPT → JCL ERROR → JESYSMSG → SJ → fix → SUBMIT → PF3 | `JCL_ERROR_GENERATED`, `JOB_OUTPUT_OPENED{JESYSMSG}`, `editorHasLine`, `JOB_COMPLETED{OUTPUT,0}`, member fixed | Redbook §6.4, IEF212I |
| 28 | Day-One challenge | make PAYRPT run to CC 0000 and read SYSUT2 | Challenge: catalog member fixed + successful `{HLQ}P` job in `state.jes` + editor closed (state only) | brief |

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

**Failure-based learning, per mode** (`LearningPanel#MessageNote`): the panel always shows the short ISPF message;
the coach adds the long explanation in Learn and Sandbox, shows only the short text plus a nudge to PF1/EXPLAIN in
Practice, and nothing extra in Challenge (mistakes are still counted from `MESSAGE_SHOWN` errors).

`LearningPanel.tsx`: LESSON n / mode, title, module, Objective, Current task, Why?, Hint (button), Progress (n/m,
bar, step list), Note (detour), Restart, Teaches. On completion: Next lesson / Restart, and the score in Challenge.

## Glossary

`src/tutorial/explain.ts`: 32 entries with `summary`, `detail`, optional flagged `analogy`, and a `readMore`
pointer into `docs/08-resources.md`. Reached via the Explain button, `EXPLAIN <term>` on any command line, or
`/lab?explain=<term>`.

## Adding a lesson

See CONTRIBUTING.md → "How to add a lesson".
