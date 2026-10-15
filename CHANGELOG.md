# Changelog

All notable changes to ISPF Lab. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Multiple-choice check questions for conceptual steps (ADR 0018); lesson 30 uses three.
- `Lesson.draft`: draft lessons are hidden from learners unless `NEXT_PUBLIC_SHOW_DRAFT_LESSONS=1` (`next dev` and tests set it). The display order of lessons is now separate from their numbers.
- Draft lessons 29-36 (Scroll amount; TSO/E, ISPF, JES and SDSF; sequential data sets, PDS and PDSE; reading a job; building a job; DISP; return codes and abends; batch troubleshooting), awaiting review.
- Optional `requires` and `sources` on lessons. Lesson 13 shows a non-blocking "Before you start" note until lesson 6 is completed.

### Changed
- A typed `MAX` in the Edit Scroll field applies to one scroll only; an empty existing member or data set opens with input lines too, and they stay until data is typed; the Edit entry panel has a working Command line; `/*` with a comment ends in-stream data; DISP=MOD on a library member no longer overwrites it; SORT control statements with a missing comma, unbalanced parenthesis or unknown format give ICE007A; IEF236I is not printed before a failed allocation; two SDSF help lines no longer overflow 80 columns.
- Lesson 24 and the SUBMIT glossary entry say the TSO SUBMIT command reports `JOB name(JOBnnnnn) SUBMITTED` (JES assigns the number).
- A new, empty member opens with five empty input lines (marked quotes) that vanish unused; JESYSMSG statement numbers match the JESJCL listing; a trailing `/*` is accepted; `DISP=MOD` creates or appends; valid DD keywords STORCLAS, DATACLAS, MGMTCLAS, LABEL, FREE and DSNTYPE are no longer errors; ICE007A prints `SYNTAX ERROR`.
- PF3 on the first panel of lessons 5, 7-10 and 12 now returns to the Primary Option Menu (the menu is kept under the starting screen).
- Errors a lesson tells the learner to provoke (lesson 1 invalid option, lesson 7 `SAVE` in Browse) no longer count as mistakes.
- Lesson 28's Day-One data set is described as nonexistent, not uncataloged; the PAYRPT seed comment no longer rules out creating it.
- Editor `SUBMIT` refuses operands (`SUBMIT OPERANDS NOT SUPPORTED`) instead of ignoring them; the Progress-page environment reset also clears the JES.
- Lesson and glossary statements that IBM's documentation contradicts were corrected (pop-ups, PF3 counts, Browse, MODIFIED,
  AUTOSAVE, screen limit, jump/RETURN, BNDS, CAPS, RECOVERY, undo, SDSF option letter), and Edit SUBMIT and SDSF SJ are described as
  IBM does (ADR 0015).
- IBM resource links point at the z/OS 3.2 manuals; a CI workflow runs `pnpm check` and `pnpm build`.

### Fixed
- Lessons 5, 6, 9, 11, 17, 21, 27 and 28 now check what they ask; lesson 28's Challenge accepts any repair that makes the job run.
- Message ids: `IEF374I` has no return code; `IEFC019I` and `ICE056A` replace the non-existent `IEFC606I` and `ICE026A`.
- DSLIST `S` omits the directory blocks and member count of a PDS (not the space figures); `SORT LRECL` sorts descending by default.
- The member modification level rises once per edit session (max 99), and saving with `STATS OFF` discards the statistics.
- Challenge mode could be completed without doing the lesson (18 lessons by a few cheap actions, 7 by none) or on
  leftover data; it now needs a completion guard plus an outcome check per lesson (ADR 0016).
- Restarting a lesson, switching mode or starting another lesson silently discarded unsaved editor work; it now asks first,
  and only when something would be lost.
- Starting a lesson while another ran in Challenge mode could mark the previous lesson completed in saved progress.
- Switching mode or restarting now re-applies a lesson's starting state; lessons 3, 6, 12, 13, 17-21, 23 and 25 replay
  without dead ends; starting a lesson closes split screens and an open editor.

### Added
- Phase 0 curriculum audit package in `docs/curriculum/` (audit, lessons audit, verified sources and evidence,
  curriculum and implementation roadmaps, simulator gap matrix, lesson authoring standards). Documentation only.
- Lessons 16–28 in four new modules (Navigation mastery, Editor power tools, Lists in depth, Batch jobs and SDSF),
  ending with the Day-One challenge; `resetJobs` lesson start option; coach shows the long ISPF message by mode.
- Virtual JES and SDSF (SIMULATED): SUBMIT from Edit, `J` on member lists, `TSO SUBMIT`; JCL recogniser with the
  classic IEFC errors; IEFBR14/IEBGENER/SORT/IDCAMS; JESMSGLG/JESJCL/JESYSMSG; primary option S with ST/O/LOG,
  `?`/`S`/`P`/`SJ` actions, OWNER/PREFIX/SORT; seed member `<HLQ>.JCL(PAYRPT)` (Day-One challenge); jobs persisted
  per userid and included in Export Lab; eight glossary terms.
- Export Lab / Import Lab on the Progress page: one validated JSON bundle (v2) with catalog, edit profiles, lesson
  progress and settings; the earlier catalog-only export is migrated on import.
- DSLIST: line commands S (short information), CO/MO (3.3 prefilled, whole-data-set copy/move), X/NX, Z, =;
  primary SORT/FIND/RFIND/EXCLUDE/RESET. Member list: I (Member Information panel), G (reset statistics), =, J
  placeholder. Both lists process every line command per Enter, suspending around panels and resuming on PF3.
- Editor: UNDO (SETUNDO/RECOVERY), persistent edit profiles per data-set type, `=COLS>`/`=BNDS>`/`=PROF>`
  special lines, BOUNDS honoured by FIND/CHANGE/EXCLUDE, NUMBER/UNNUM, STATS ON|OFF, AUTOSAVE ON|OFF PROMPT|NOPROMPT
  with the *Edit - Save or Cancel Changes* panel, FLIP, RESET EXCLUDED|SPECIAL|COMMAND|LABEL; RETRIEVE / F12 command
  retrieval on non-editor panels; eleven new glossary terms.
- Jump function `=option` from any panel (system command layer), `RETURN` / PF4, F4 in every legend; F12 documented
  as Cancel in Edit / Retrieve elsewhere; keylist glossary entry; lspf listed as a reference.

### Changed
- PF3 is no longer described as unconditionally saving: it ends, and saves when AUTOSAVE is ON.
- Line endings normalised to LF via `.gitattributes`.
- Split-screen mode: PF2 SPLIT, PF9 SWAP, START, SWAP n/PREV/LIST, SWAPBAR row, per-screen panel stacks and
  editor sessions, PF3 ends a screen; lesson 15 "Working in two screens"; glossary entries SPLIT and SWAP.

## [0.1.0] — 2026-09-12 — MVP

### Added
- Simulated ISPF: TSO/E LOGON, Primary Option Menu, Settings (0), View/Edit entry (1/2), Utilities (3) with
  3.1 Library, 3.2 Data Set (Allocate/Rename/Delete/Information), 3.3 Move/Copy, 3.4 DSLIST, Command Shell (6),
  Help (PF1). Unimplemented options answer `OPTION NOT AVAILABLE IN THIS TRAINING MODULE`.
- Member lists with E B V D R C M S line commands, `S NEWNAME` creation, confirmation and rename panels.
- ISPF editor: overtype records, prefix-area line commands (I In D Dn DD R Rn RR C Cn CC M Mn MM A An B Bn X Xn XX
  S F L COLS TS LC UC ( ) < >), primary commands (SAVE CANCEL END FIND RFIND CHANGE RCHANGE EXCLUDE RESET LOCATE TOP
  BOTTOM UP DOWN LEFT RIGHT CAPS NUM HEX COLS CREATE REPLACE COPY PROFILE EXPLAIN), Browse (read-only) and View
  (no SAVE), terminal-style messages, PF3 saves / PF12 cancels.
- Virtual catalog templated on the logon userid; read-only SYS1 libraries; persistence in localStorage per userid;
  Reset Training Environment; JSON export/import.
- Tutorial engine with 14 lessons in 5 modules; Learn / Practice / Challenge / Sandbox modes; scoring; coach panel;
  Explain glossary (32 terms); Learning Progress page; Resources page.
- Terminal renderer with keyboard-first interaction, clickable PF strip, 3270 status line, Insert toggle.
- Landing page in ISPF panel style with a live engine-driven demo; desktop gate for `/lab/*`.
- 127 Vitest tests across catalog, persistence, parsers, editor, engine and tutorial layers.
- SEO and identity: title template, Open Graph/Twitter cards with a generated 1200×630 image, canonical URLs,
  robots.txt, sitemap.xml, web manifest, JSON-LD (WebApplication, Course, FAQPage), and a generated icon set
  (favicon.ico 16/32/48, 512 px icon, Apple touch icon, PWA icons) via `pnpm icons`.
- Documentation set: project log, PRD, architecture, behaviour reference, editor commands, course design, design
  direction, testing, resources, ADRs 0001–0008, original brief, contributing guide, issue templates.
