# Original brief (verbatim)

Received 2026-09-11. Reproduced unchanged for traceability; the amendments agreed during planning follow at the end.

---

Build a browser-based educational application called **ISPF Lab**. It is an interactive simulator designed to teach beginners how to navigate IBM z/OS ISPF.

This is NOT a real z/OS emulator, TN3270 client, or mainframe connection. Do not attempt to execute z/OS or connect to a mainframe. Instead, implement a deterministic simulated ISPF environment backed by a virtual data-set catalog.

The goal is to reproduce the interaction model and learning experience of ISPF closely enough that someone can develop navigation and editing muscle memory before using a real z/OS system.

## Technology

Use:

* Next.js with TypeScript
* React
* Tailwind CSS
* Client-side application state
* IndexedDB or localStorage for persistent simulator data and lesson progress
* No database or authentication is required for the initial MVP
* No external mainframe connection

Build the architecture so that a backend and user accounts could be added later.

The application must be responsive enough for laptops and desktops, but prioritize desktop keyboard usage because the simulator represents a terminal-oriented interface.

## Product Structure

The application has two major UI areas.

The left/main area is the simulated ISPF terminal.

The right side is an optional learning panel containing:

* Current lesson
* Objective
* Current step
* Explanation
* Hint
* Progress
* Reset Lesson button

The learning panel can be hidden when using Sandbox Mode.

Provide four application modes:

1. Learn
2. Practice
3. Challenge
4. Sandbox

### Learn Mode

Give the learner step-by-step instructions.

When appropriate, visually indicate the relevant field, but do not automatically perform the action.

Validate what the learner actually does inside the simulator.

Allow multiple legitimate ways to accomplish an objective. For example, if a learner needs to reach DSLIST, entering `3.4` directly or navigating through option `3` and then option `4` should both be accepted.

### Practice Mode

Provide the objective and optional hints but no step-by-step instructions.

### Challenge Mode

Give the user a scenario and validate whether the final simulator state satisfies the objective.

Track:

* completion
* mistakes
* hints used
* optional completion score

Do not make timing the primary scoring metric.

### Sandbox Mode

Provide unrestricted access to the simulated ISPF environment without instructional overlays.

---

# Visual Design

The simulated environment should resemble the appearance and interaction model of a classic 3270/ISPF terminal while still being clean and readable in a modern browser.

Use:

* dark terminal background
* monospace typography
* fixed-width text
* blue/cyan/green/white terminal-like text hierarchy
* rectangular text input areas
* textual separators
* traditional ISPF-style headings
* terminal status/footer area

Do not use IBM logos or claim that the application is an official IBM product.

Display a small disclaimer:

"Educational ISPF training simulator. Not affiliated with or endorsed by IBM."

Do NOT redesign ISPF into a modern file explorer.

The purpose of the application is to teach the unusual keyboard-driven ISPF workflow.

Avoid normal web conventions such as large cards, graphical file icons, folder trees, floating action buttons, or conventional IDE interfaces inside the simulator.

---

# Terminal Engine

Create an internal screen/state engine.

Example screen types:

* LOGIN
* PRIMARY_OPTION_MENU
* UTILITY_SELECTION
* DSLIST_SEARCH
* DSLIST_RESULTS
* DATASET_INFO
* MEMBER_LIST
* EDIT
* BROWSE
* VIEW
* CONFIRM_DELETE
* MESSAGE
* HELP

Each screen should declare:

* title
* fields
* command field
* available actions
* available PF keys
* validator
* navigation behavior

Do not scatter navigation logic across React components.

Use a centralized state machine, reducer, or similarly deterministic state-management architecture.

Example:

SimulatorState {
currentScreen
previousScreens
catalog
activeDataset
activeMember
editorSession
commandHistory
messages
cursorPosition
}

---

# Keyboard Interaction

Support keyboard-first navigation.

Implement:

ENTER:
Process the current command or panel.

TAB:
Move to the next editable ISPF field.

SHIFT+TAB:
Move to the previous field.

Where possible support physical function keys:

F1 = Help
F3 = Exit / End
F7 = Scroll backward/up
F8 = Scroll forward/down
F10 = Left when appropriate
F11 = Right when appropriate
F12 = Cancel when appropriate

PF-key behavior may vary by screen.

Display the available PF-key labels at the bottom of each terminal screen.

Because browsers may intercept some function keys, also provide a clickable PF-key strip below the terminal.

Clicking an on-screen PF key must perform exactly the same internal action as the corresponding keyboard shortcut.

---

# ISPF Primary Option Menu

Implement an ISPF-style Primary Option Menu.

At minimum expose:

0 Settings
1 View
2 Edit
3 Utilities
4 Foreground
5 Batch
6 Command

Only options required for the MVP need to be functional.

Options not implemented should display a terminal-style message such as:

"OPTION NOT AVAILABLE IN THIS TRAINING MODULE"

The command/input line should support direct navigation.

For example:

`3`

opens Utilities.

`3.4`

opens the Data Set List utility directly.

---

# Utilities

Implement the Utilities Selection panel.

At minimum include:

1 Library
2 Data Set
3 Move/Copy
4 Dslist

The initial MVP primarily needs option 4.

---

# Data Set List Utility

Implement an ISPF-style DSLIST screen.

The user should be able to enter a Dsname Level.

Examples:

KOVIE

KOVIE.*

KOVIE.JCL

Return matching simulated data sets.

Display relevant metadata such as:

* data-set name
* DSORG
* RECFM
* LRECL
* volume

Support a useful MVP subset of line commands:

E = Edit
B = Browse
V = View
M = Member List
D = Delete
R = Rename

Implement confirmation when deleting data where appropriate.

Allow PDS data sets and sequential data sets to behave differently.

Opening E/B/V against a partitioned data set should allow the user to reach its member list.

---

# Virtual Data Set Catalog

Do not use the actual host filesystem as the primary model.

Implement a virtual mainframe catalog.

Example data model:

Dataset {
id: string
name: string
datasetType: "PDS" | "PS"
dsorg: "PO" | "PS"
recfm: "FB" | "VB"
lrecl: number
volume: string
readOnly: boolean
members?: Record<string, Member>
records?: string[]
}

Member {
name: string
records: string[]
createdAt?: string
modifiedAt?: string
}

Seed the simulator with realistic example data.

Create at least:

KOVIE.JCL

* HELLO
* COPYJOB
* SORTJOB

KOVIE.COBOL

* HELLO
* CUSTOMER

KOVIE.REXX

* TEST01
* HELLO

KOVIE.DATA

* CUSTOMER
* EMPLOYEE

SYS1.PARMLIB

* IEASYS00
* COMMND00
* PROG00

System libraries such as SYS1.PARMLIB should initially be read-only.

Dataset contents should persist locally so a learner's modifications survive page refreshes.

Provide a "Reset Training Environment" option that restores the original seed catalog.

---

# Member Lists

For PDS data sets, implement an ISPF-style member list.

Support:

B = Browse
C = Copy member
D = Delete member
E = Edit member
M = Move member
R = Rename member
V = View member

Provide confirmation for destructive actions when appropriate.

The user should be able to create a new member by specifying a nonexistent member through the Edit workflow when appropriate.

---

# ISPF Editor

The ISPF Editor is a major feature of the project and must not be replaced with a standard textarea or modern code editor.

Build a purpose-made record-oriented editor.

Show:

* data-set/member name
* command field
* current columns
* prefix/line-command area
* six-digit sequence/line-number area
* fixed-width records
* Top of Data marker
* Bottom of Data marker
* scrolling information

Example:

EDIT       KOVIE.JCL(HELLO)                  Columns 00001 00072

Command ===> _________________________________ Scroll ===> PAGE

****** ************************ Top of Data **************************
000001 //HELLO   JOB (ACCT),'HELLO WORLD'
000002 //STEP1   EXEC PGM=IEFBR14
000003 //
****** *********************** Bottom of Data ***********************

The user must be able to directly overwrite characters in records.

Do not make every record a visually distinct modern input box.

It should visually resemble editing records in a terminal.

---

# Editor Line Commands

Implement a command parser for the prefix/sequence area.

Initial commands:

I
I<number>
D
D<number>
DD ... DD
R
R<number>
RR ... RR
C
C<number>
CC ... CC
M
M<number>
MM ... MM
A
B
X
XX ... XX

Expected examples:

`I`
inserts one blank record.

`I5`
inserts five blank records.

`D`
deletes one record.

`D5`
deletes five records starting at that record.

A `DD` entered on two records deletes the entire block.

`R`
repeats a record.

`C` followed by `A` copies the selected record after the destination record.

`C` followed by `B` copies it before the destination.

`M` with `A/B` works similarly but removes the source.

Provide terminal-style messages for invalid or incomplete commands.

For example:

"DESTINATION REQUIRED"

"INVALID LINE COMMAND"

"BLOCK COMMAND INCOMPLETE"

Do not silently ignore mistakes.

---

# Editor Primary Commands

Implement a parser for commands entered into:

Command ===>

Support initially:

SAVE
CANCEL
FIND
CHANGE
RESET
UP
DOWN
LEFT
RIGHT

SAVE:
Persist the working editor buffer to the virtual catalog without closing the editor.

CANCEL:
Discard unsaved modifications and exit the editor.

PF3/END behavior should save modified data before returning when the simulated configuration calls for normal ISPF edit completion.

Track dirty/unsaved editor state.

FIND should search the current member.

Example:

FIND "HELLO"

CHANGE should support basic replacement.

Example:

CHANGE "HELLO" "WORLD"

Implement command abbreviations only when intentionally supported by the command parser.

---

# Browse and View

Browse should not allow editing.

View should initially also prevent persistent modification unless a later training module requires more nuanced behavior.

Use the same terminal-style viewer/editor infrastructure rather than creating an unrelated interface.

---

# Tutorial Engine

The tutorial system must be architecturally separate from the simulator.

Every meaningful simulator action should produce a semantic event.

Examples:

SCREEN_OPENED
OPTION_SELECTED
COMMAND_ENTERED
PF_KEY_PRESSED
DATASET_SEARCHED
DATASET_OPENED
MEMBER_OPENED
MEMBER_CREATED
MEMBER_RENAMED
MEMBER_DELETED
EDITOR_LINE_INSERTED
EDITOR_LINE_DELETED
EDITOR_TEXT_CHANGED
MEMBER_SAVED
EDIT_CANCELLED

Tutorial lessons should subscribe to these actions or inspect simulator state.

Do not validate lessons by checking arbitrary React DOM elements.

Create declarative lesson definitions.

Example structure:

Lesson {
id
title
description
objectives
startingState
steps
}

LessonStep {
id
instruction
explanation
hint
validator
}

A lesson should be able to validate either an event or resulting simulator state.

---

# Initial Lessons

Implement these starter lessons.

Lesson 1 — Meet ISPF

Teach:

* panels
* input fields
* command fields
* Enter
* PF keys

Lesson 2 — Navigating ISPF

Goal:

Reach the Data Set List Utility.

Teach:

* primary menu options
* Utilities
* direct option `3.4`
* PF3 to return

Lesson 3 — Finding Your Data Sets

Goal:

Display all KOVIE data sets.

Teach:

* high-level qualifier
* Dsname Level
* data-set naming hierarchy

Lesson 4 — Data Sets and Members

Goal:

Open KOVIE.JCL and inspect its members.

Explain the difference between:

KOVIE.JCL

and

KOVIE.JCL(HELLO)

Lesson 5 — Browse versus Edit

Have the learner browse HELLO first and then reopen it in Edit.

Lesson 6 — Editing Your First Member

Goal:

Change a specified line inside KOVIE.JCL(HELLO) and save it.

Lesson 7 — Line Commands

Require the learner to:

* insert a record
* delete a record
* repeat a record

Lesson 8 — Copy and Move

Require C/M with A/B destinations.

Lesson 9 — Managing Members

Require:

* creating a member
* renaming the member
* deleting a member

Lesson 10 — Final Navigation Challenge

Give only this high-level task:

"Locate KOVIE.JCL(COPYJOB), add the requested JCL statement, and save the member."

Do not tell the learner which menus or commands to use.

Validate the final catalog state.

---

# Coaching UI

For Learn Mode, display a collapsible side panel.

Example:

LESSON 3
Finding Your Data Sets

Objective
Find all data sets belonging to your user.

Current Task
Open the Data Set List Utility.

Why?
ISPF option 3.4 is commonly used to find and work with data sets.

Hint
Start with Utilities.

Progress
2 / 7

[Show Hint]
[Restart Lesson]

When the learner performs a correct action, transition immediately to the next instructional step.

When they perform a valid ISPF action that is not the expected tutorial action, do not break the simulator. Allow the action and optionally explain how to return to the objective.

When an action is invalid according to ISPF behavior, display the simulated terminal error rather than an artificial web validation error.

---

# Explain Mode

When the learner requests an explanation for something such as:

3.4
E
M
PF3
HLQ
PDS
member

display a concise educational explanation.

Keep explanations beginner-friendly but technically accurate.

Teach z/OS terminology rather than replacing it with generic PC terminology.

For example, prefer:

"partitioned data set"

over:

"folder"

Explain analogies where useful, but make it clear that a PDS is not literally a folder.

---

# Progress

Store locally:

* completed lessons
* current lesson
* hints used
* challenges completed
* lesson attempts

Show a simple Learning Progress screen outside the terminal.

Do not introduce accounts or cloud synchronization in the MVP.

---

# Architecture Requirements

Separate the application into at least these conceptual layers:

1. Terminal renderer
2. ISPF screen/navigation engine
3. Virtual data-set catalog
4. Command parsers
5. ISPF editor engine
6. Tutorial engine
7. Persistence layer
8. Application shell

The simulator must function independently from tutorials.

I should be able to enter Sandbox Mode and use the same simulator without any lesson running.

Likewise, a lesson should interact with the simulator through semantic actions/state rather than manipulating UI elements directly.

---

# Testing

Add unit tests for the important command semantics.

Tests should include:

* searching DSLIST
* opening a PDS
* opening a sequential data set
* deleting a member
* renaming a member
* inserting editor lines
* deleting editor lines
* DD blocks
* copying with C/A
* copying with C/B
* moving with M/A
* SAVE
* CANCEL
* lesson validation

Also test navigation such as:

Primary Menu -> 3 -> Utilities -> 4 -> DSLIST

and:

Primary Menu -> 3.4 -> DSLIST

Both routes should reach the same simulator state.

---

# MVP Completion Criteria

The MVP is considered complete when a new user can:

1. Open the application.
2. Start an introductory lesson.
3. Navigate an ISPF-style Primary Option Menu.
4. Reach option 3.4.
5. Search the simulated catalog.
6. Open KOVIE.JCL.
7. display its members.
8. Edit KOVIE.JCL(HELLO).
9. Insert/delete/edit records using ISPF conventions.
10. SAVE the member.
11. Exit back through the ISPF panels.
12. Complete a lesson whose engine independently verifies those actions.
13. Refresh the webpage and retain their modified training environment and learning progress.
14. Reset the environment to the original seed state.

Focus on making this workflow polished before adding JCL execution, SDSF, TSO emulation, authentication, social functionality, achievements, or additional mainframe subsystems.

The simulator should feel like a training environment, not like a normal website wearing a green-terminal theme.

---

## Amendments agreed during planning (2026-09-11)

1. "Let us not use Kovie that is my name." → the logon userid is the HLQ; the seed is templated (`USER01` by
   default). Every `KOVIE` above reads as `<HLQ>` in the product.
2. "Make sure allow the user to make new files, make everything local using the browser storage. Make it feel like a
   full functional ISPF." → 3.2 Allocate/Rename/Delete, 3.3 Move/Copy, 3.1 Library, option 6 TSO subset, member
   creation; all persisted in localStorage.
3. "There should be an interactive course of it. Find resources which one provides the best guide on how to navigate
   ISPF." → 14-lesson course modelled on the guides in `docs/08-resources.md`.
4. "Make a landing page as well, make it educational but the design looks like you are in the 'mainframe' or
   terminal-like design… For mobile users, block them from interacting the app, tell them to use a desktop or laptop
   to try the 'emulator' but of course they can still access the landing page." → `/` landing, desktop gate on `/lab`.
5. "Log all docs made, decision making, phases, what were made so that this could be collaborated with other users as
   well." → `docs/00-project-log.md`, ADRs, CONTRIBUTING, CHANGELOG, issue templates.
