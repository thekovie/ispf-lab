# Changelog

All notable changes to ISPF Lab. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
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
