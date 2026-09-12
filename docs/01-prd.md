# Product requirements — ISPF Lab

Distilled from `docs/spec/original-brief.md` plus the changes agreed during planning. The brief wins on any
detail not covered here.

## Problem

People who need to work on IBM z/OS meet ISPF cold: a keyboard-driven, panel-based interface with conventions
(option numbers, PF keys, line commands typed over line numbers, "nothing happens until Enter") that no modern UI
prepares them for. Access to a real system is scarce, expensive, and risky for a beginner.

## Goal

A browser-based, deterministic **simulator** of the ISPF interaction model plus an **interactive course** that
verifies what the learner actually does, so that navigation and editing muscle memory transfers to a real system.

## Non-goals (MVP)

- Not a z/OS emulator, TN3270 client or mainframe connection.
- No JCL execution, SDSF, TSO emulation beyond a small option-6 subset, accounts, cloud sync, achievements, social features.
- No modern-file-explorer redesign of ISPF.

## Users

- Students and new hires learning z/OS (primary).
- Instructors who want a safe environment for exercises.
- Experienced mainframers who want to report fidelity gaps (contributors).

## Modes

| Mode | Behaviour |
|---|---|
| Learn | Step-by-step instructions, "why", hints, field highlighting; validated by simulator events/state |
| Practice | Objective + hints on request; no step text |
| Challenge | Task only; final state validated; score = 100 − 10·mistakes − 15·hints (time is not scored) |
| Sandbox | Full simulator, no lesson, no coach panel |

## Functional scope

- TSO/E LOGON (any userid → HLQ), Primary Option Menu, options 0, 1, 2, 3 (3.1, 3.2 incl. Allocate, 3.3, 3.4), 6;
  unimplemented options answer `OPTION NOT AVAILABLE IN THIS TRAINING MODULE`.
- DSLIST with Dsname Level search and line commands E B V M I D R (+S); member lists with E B V D R C M S and
  `S NEWNAME` creation; confirmation panels for destructive actions.
- ISPF editor: record-oriented, overtype, prefix-area line commands (I D R C M A B X + blocks + extras), primary
  commands (SAVE CANCEL FIND CHANGE RESET UP DOWN LEFT RIGHT + extras), Browse (read-only), View (no SAVE).
- Virtual catalog seeded per userid; persisted in localStorage; Reset Training Environment; export/import JSON.
- 14 lessons in 5 modules; Explain glossary; Learning Progress page; Resources page.
- Landing page (educational, terminal styled) usable on mobile; simulator gated to desktop-class viewports.

## MVP completion criteria (from the brief)

A new user can: open the app → start a lesson → navigate the Primary Option Menu → reach 3.4 → search the catalog →
open `<HLQ>.JCL` → list members → edit `HELLO` → insert/delete/edit records → SAVE → exit through the panels →
complete a lesson verified by the engine → refresh and keep environment and progress → reset to seed.

All fourteen are exercised by `tests/engine/*.test.ts` and `tests/tutorial/lessons.test.ts`, and were walked in a
browser (see `docs/00-project-log.md` Phases 6–8).

## Constraints

- Desktop keyboard first; browsers intercept some F-keys, so a clickable PF strip must perform the identical action.
- Terminal error messages, never web validation dialogs, for invalid ISPF actions.
- z/OS terminology throughout ("partitioned data set", not "folder"); analogies flagged as analogies.
- Disclaimer everywhere: "Educational ISPF training simulator. Not affiliated with or endorsed by IBM."
- Architecture must allow a backend/accounts later (storage adapter, pure engine, event stream).
