# Existing lessons audit (Phase 0, Deliverable 2)

Part of the [Phase 0 audit](phase-0-audit.md). Baseline commit `e97a91b842cc1c525c9694adf3533695bf57f82c`. Audit dates 2026-10-14 and 2026-10-15. All 28 lessons in the registry (`src/tutorial/lessons/index.ts`, 10 modules, 137 steps) were audited individually. **Nothing in `src/` or `tests/` was changed.**

## 1. Method

For each lesson the auditor read the lesson definition (instructions, explanations, hints, validators, starting state), the glossary entries it uses, the engine and `TutorialProvider` paths that run it, the simulator code each step depends on, and the relevant tests. Claims were checked against IBM documentation (z/OS 3.2 unless stated) recorded in [verified-sources.md](verified-sources.md) and the evidence appendices [EV-A](evidence/EV-A-ispf-tso.md), [EV-B](evidence/EV-B-jcl-jes-messages.md), [EV-C](evidence/EV-C-sdsf-registry.md). Where the auditors read additional IBM passages themselves from the same z/OS 3.2 PDFs, the citation is marked `OWN-READ` / "own grep" with the book and printed page (about ±1 page). Anything not covered by an IBM page is marked **INSUFFICIENT EVIDENCE**; nothing is filled from memory. A passing test was never treated as evidence of IBM behaviour.

Behaviour of the lesson runner was also **probed**: small Vitest scripts, kept outside the repo while the audit ran, drove the real simulator and runner (for example "start Challenge mode, send one unrelated key, check whether the lesson completed"). The scripts are preserved as text in [evidence/probes/](evidence/probes/) (`*.probe.ts.txt`). To re-run: copy a script and `vitest.config.mjs.txt` into an empty scratch folder outside the repo, rename them (`*.probe.ts`, `vitest.config.mjs`), and run `vitest` there. The config aliases `@` and `@tests` to this repo's `src` and `tests`. Findings marked "probe" were reproduced this way; findings marked "code-read" were not.

**Status vocabulary** (from the brief): VERIFIED · VERIFIED WITH LIMITATIONS · CORRECTION REQUIRED · INSUFFICIENT EVIDENCE · REVIEW NOT COMPLETED. A lesson with any confirmed defect is CORRECTION REQUIRED.

**Severity and priority.** Priority: P0 teaches a dangerous or blocking falsehood, or blocks or falsely grants completion; P1 an IBM-contradicted statement taught as fact, or a materially broken assessment; P2 a fidelity or validation weakness a learner can hit; P3 polish. Severity: Critical / High / Medium / Low as given in each lesson's field.

## 2. Result

| Status | Count |
|---|---|
| VERIFIED | 0 |
| VERIFIED WITH LIMITATIONS | 0 |
| **CORRECTION REQUIRED** | **28** |
| INSUFFICIENT EVIDENCE | 0 |
| REVIEW NOT COMPLETED | 0 |

How to read "28 of 28":

- **27 of 28** lessons contain at least one statement or simulator behaviour that IBM documentation contradicts, does not support, or that the simulator misrepresents. **Lesson 21** is the exception: its content matches IBM; its defects are all in validation (a step can be skipped and the Challenge completes on any first action).
- **18 of 28** lessons have a Challenge that completes with three or fewer unrelated actions from a fresh start (independently reproduced by the M0 review; 7 need no action at all: L2, 3, 13, 15, 18, 21, 24). Another 4 (L6, L8, L14, L28) depend on leftover state. Six (L1, 4, 11, 12, 26, 27) could not be shortcut in the review's tests. The cause is that only L14 and L28 define their own `challenge` and the rest fall back to the last step's validator (usually a cleanup check such as "editor closed" or "on the menu"). *(The first version of this audit said "at least 25 of 28"; this was over-stated and is corrected by M0 review condition C1.)*
- The lesson **content that survives** is substantial and several detailed behaviours were confirmed correct (see the "Positive findings" in each section and appendix A). The classification is strict by design: "VERIFIED" requires every material claim to be sourced and every assessment path to be sound.

| # | ID | Title | Status | Confirmed defects | Top issue |
|---|---|---|---|---|---|
| 1 | l01-meet-ispf | Meet ISPF | CORRECTION REQUIRED | 4 | "ISPF never pops up dialog boxes" is false; the invalid option the lesson asks for costs 10 points |
| 2 | l02-navigating | Navigating ISPF | CORRECTION REQUIRED | 3 | Typed `3.4` "takes two PF3s" contradicts IBM (dotted path bypasses the Utility menu); test locks it in; Challenge completes on first key |
| 3 | l03-settings-tso | Settings and TSO | CORRECTION REQUIRED | 5 | Option 0 "Default scroll amount" is not an IBM setting; replay dead-ends if already HALF; LISTCAT not checked |
| 4 | l04-finding-data-sets | Finding your data sets | CORRECTION REQUIRED | 4 | Dsname Level "name prefix" ignores the 3.2 "Include Additional Qualifiers" option; default columns differ |
| 5 | l05-data-sets-and-members | Data sets and members | CORRECTION REQUIRED | 4 | PF3 is a no-op at lesson start; any `I` passes; "statistics updated every save" overstated |
| 6 | l06-allocating | Allocating | CORRECTION REQUIRED | 4 | Replay dead-ends (DATA SET ALREADY EXISTS); validator checks the name only; Challenge trivial |
| 7 | l07-browse-vs-edit | Browse vs Edit | CORRECTION REQUIRED | 4 | Browse drawn with line numbers and a prefix area that IBM does not have; SAVE-in-Browse probe is a scored mistake |
| 8 | l08-first-edit | First edit | CORRECTION REQUIRED | 4 | "MODIFIED" flag and "AUTOSAVE default on most systems" unsupported; lowercase accepted |
| 9 | l09-line-commands | Line commands | CORRECTION REQUIRED | 4 | Step 6 dead-ends if already saved; the lesson saves a broken JOB card; any `D`/`R` passes |
| 10 | l10-copy-move | Copy and move | CORRECTION REQUIRED | 3 | Challenge completes on any CANCEL; "MOVE/COPY IS PENDING" wording vs IBM |
| 11 | l11-find-change | FIND and CHANGE | CORRECTION REQUIRED | 6 | Step 5 auto-passes; quoting rule incomplete; CHANGE also turns `WS-CUSTOMER` into `WS-CLIENTOMER` |
| 12 | l12-managing-members | Managing members | CORRECTION REQUIRED | 4 | New member created on PF3 as well as SAVE; leftovers dead-end replays |
| 13 | l13-copy-across | Copy across | CORRECTION REQUIRED | 5 | Challenge passes instantly when TEST.JCL is absent; replay dead-ends |
| 14 | l14-final-challenge | Final challenge | CORRECTION REQUIRED | 2 (1 withdrawn by M0 review) | Completes on leftover state after Learn → Challenge; no check that the original steps survive. (`finalCheck` leniency is disclosed in the objective: withdrawn, P3) |
| 15 | l15-split-screen | Two screens | CORRECTION REQUIRED | 5 | Challenge passes on any first action; "up to 8 screens" wrong (8 is the default, 32 the maximum) |
| 16 | l16-jump-return | Jump and RETURN | CORRECTION REQUIRED | 3 | Challenge completes with `=3.4` then RETURN/PF4 (reproduced); "`=option` is RETURN then the option" is a simplification (P2) |
| 17 | l17-retrieve-multi | RETRIEVE and multi-command | CORRECTION REQUIRED | 4 | Step 5 completes after the first PF3, before the re-run; Challenge passes on typing `3.4` |
| 18 | l18-cols-bounds | COLS and BOUNDS | CORRECTION REQUIRED | 8 | Primary BOUNDS with no operand resets (does not show an editable line); "BOUNDS 1 72 restores the default" wrong; bounds leak into later lessons |
| 19 | l19-profiles | Edit profiles | CORRECTION REQUIRED | 7 | CAPS has no fixed default (set from the data on each open); real PROFILE shows five `=PROF>` lines |
| 20 | l20-undo-recovery | UNDO and recovery | CORRECTION REQUIRED | 7 | "RECOVERY journals keystrokes / keeps UNDO available" wrong; glossary says "no undo" |
| 21 | l21-exclude-flip | Exclude, FLIP | CORRECTION REQUIRED (validation only) | 4 | Typing only `FLIP` skips the EXCLUDE step; Challenge passes on any first action |
| 22 | l22-dslist-advanced | DSLIST advanced | CORRECTION REQUIRED | 4 | S vs I description inverted vs IBM; NX unreachable on the marker; SORT default direction |
| 23 | l23-member-info | Member stats I and G | CORRECTION REQUIRED | 7 | STATS OFF, per-save mod bump and "audit trail" taught against IBM; G has no Reset panel |
| 24 | l24-submit | First job | CORRECTION REQUIRED | 6 | "Real ISPF submits the disk copy" claim unsupported (IBM: "the member or data set you are editing"); Challenge trivial |
| 25 | l25-sdsf-status | SDSF status | CORRECTION REQUIRED | 8 | `SD`/`M.5` entry claim, OWNER default claim, HELLO not reset, JESMSGLG time/job id, Challenge trivial |
| 26 | l26-job-output | Job output DDs | CORRECTION REQUIRED | 7 | SORTOUT identical to SORTIN (no sort visible); TSO name qualification overclaim; log/IEF374I/ICE fidelity |
| 27 | l27-jcl-error | Debug a JCL ERROR | CORRECTION REQUIRED | 9 | SJ/PF3 "saves the fix" but IBM says SJ edits are not saved; Challenge completes with zero jobs submitted |
| 28 | l28-day-one | Day-One challenge | CORRECTION REQUIRED | 7 | Challenge is state-only (SYSUT2 never checked), rejects a valid PAYROLL.DATA repair, completes on stale state; wrong IEF212I hint |

## 3. Consolidated findings (highest consequence first)

1. **Challenge mode does not assess most lessons (P0, assessment integrity).** `feedEvents` evaluates the last step's validator after every action (`src/tutorial/engine.ts:41-46`). Because most last steps are cleanup checks, Challenge completes with no action or a few cheap actions in 18 lessons (independently reproduced) and can complete on leftover state in 4 more; `setMode` keeps the data, so Learn → Challenge can finish immediately (code-read for L8, L14, L28). Fix (revised by the M0 review and decision D3): a generic completion guard plus outcome-based Challenge validators validated against shortcut and alternative-route tests, not a repeat of every Learn step.
2. **Replay dead ends and hidden coupling (P0).** Nothing deletes learner-created data (L6 `TEST.JCL`, L12 `SCRATCH`/`DRAFT`, L13), lessons leave seed members edited (L8/L9 HELLO is broken by L9 and not reset by L25), and no lesson resets edit profiles (L18 BOUNDS, L19 CAPS, L20 RECOVERY leak forward). Six lessons start with an empty panel stack, so PF3 does nothing and hints such as "Option 2" error out.
3. **A single unsupported premise carries L24, L27 and L28 (P1).** The "real ISPF submits the on-disk copy" claim is unsupported (EV-A §1); and "SJ opens the submitted JCL, PF3 saves it back to the member" contradicts IBM ("changes you make to the data are not saved", EV-C c4). The simulator's `SJ` actually opens the **current catalog member**, not the JCL JES held (probe).
4. **Statements taught as fact that IBM contradicts (P1).** Pop-ups (L1); typed `3.4` PF3 count (L2); option 0 scroll (L3); Browse line numbers/prefix (L7); MODIFIED flag (L8); CAPS default, BNDS/`=PROF>` layout, RECOVERY/UNDO wording (L18-L20); S vs I, STATS OFF and per-save mod level (L22-L23); SD/M.5 and OWNER default (L25); "IEF212I names the data set" (L27, L28). Each cites an EV row in its section.
5. **Validators with false positives or rejected valid routes (P1-P2).** Any `I` (L5), name-only allocation check (L6), any `D`/`R` (L9), any CANCEL (L10, L20), auto-passing exclusion step (L11), `finalCheck` placement hole (L14), single-PF3 completion (L17), FLIP-alone (L21), comment-line match and case-sensitive regex (L27), `payrptFixed` rejecting creation of `PAYROLL.DATA` (L28).
6. **Scoring penalises instructed errors (P2).** L1 (invalid option) and L7 (SAVE in Browse) require an error message that then counts as a mistake (`engine.ts:38`).
7. **Fabricated or inexact message IDs and layouts in job output (P0/P1 per GAP-42).** `IEFC606I` and `ICE026A` do not exist; IEF374I carries `RC=`; JESMSGLG lines lack time and job id. See the [gap matrix](simulator-gap-matrix.md).
8. **Tests encode defects (P1).** Examples: `lessons.test.ts:64-68` asserts two PF3s after typed `3.4`; `sdsf.test.ts:56-71` locks the SJ write-back; `sdsf.test.ts:8-9` locks the buffer-SUBMIT premise; `lessons.test.ts:371-380` locks the state-only Challenge for L28.
9. **Documentation records simulator behaviour as if it were IBM behaviour (P2).** `docs/03` and `docs/04` state "Defaults: CAPS OFF", two `=PROF>` lines, BOUNDS with no operand, "Maximum 8"; "deviation" notes exist only for a few commands.
10. **Message texts are unverified everywhere ISPF is concerned.** The ISPF Messages and Codes book (SC19-3622-70) was not read; every ISPF message text in lessons 1-21 is INSUFFICIENT EVIDENCE. Required before ISPF message IDs are added.

## 4. Lessons 1 to 14

The sections below are the auditors' reports verbatim (cross-lesson notes follow in appendix A). Each lesson section carries the thirteen required fields: lesson number and ID; module and title; learning objectives; source files; technical accuracy status; educational quality findings; simulator fidelity findings; validation and assessment findings; verified reference IDs and exact topics; confirmed deviations; recommended correction; priority and severity; evidence and rationale.

### Lesson 1 - l01-meet-ispf

**Module and title:** Module 1 "Getting around" - "Meet ISPF"

**Learning objectives (from code):** Log on and reach the Primary Option Menu, use PF1 and PF3. Teaches: what a panel is; input fields and the command/option line; Enter processes the panel; PF1 help, PF3 end (module1.ts:15-16).

**Source files:** src/tutorial/lessons/module1.ts:9-57; src/tutorial/validators.ts:14-28; src/tutorial/engine.ts:34-68; src/engine/screens/login.ts:9-77; src/engine/screens/primaryMenu.ts:27-98; src/engine/screens/help.ts:22-47; src/engine/reducer.ts:49-74; src/engine/navigation.ts:22-24; src/state/TutorialProvider.tsx:95-120; tests/tutorial/lessons.test.ts (L1 not covered by a dedicated test).

**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- E1 (confirmed, module1.ts:44) Step 4 explanation says "ISPF never pops up dialog boxes". The same step then says PF1 shows a longer message, and the lab itself shows pop-up style panels later (Confirm Delete, Rename, Copy Entry). Teaches a false absolute to a first-time learner.
- E2 (confirmed, module1.ts:43-47 + engine.ts:38) The lesson instructs the learner to type an invalid option; `fail()` emits `MESSAGE_SHOWN severity:"error"` and `feedEvents` counts every error event as a mistake (-10 points) in every mode. So the only way to pass step 4 is to be penalised. Hint says "it is the lesson" but the score does not.
- E3 (confirmed) Step 5 says "Press Enter with an empty Option line to clear the message" but nothing validates that; only PF3 on HELP is checked (module1.ts:54). The first-time-learner "keyboard first" objective is not assessed.
- E4 "You will press it hundreds of times a day" (module1.ts:37) is rhetoric; no source, harmless.
- E5 Step 1 "type your own name, up to 7 characters": 7-char limit is enforced in the sim (login.ts:9) but no IBM source for TSO userid length was found in EV-A/EV-C or my reads -> INSUFFICIENT EVIDENCE for the 7-character statement.

**Simulator fidelity findings**
- F1 (confirmed) PF1 always pushes a static HELP screen (reducer.ts:61-65). Real ISPF: first HELP after a short message shows the long message (pop-up by default), a second HELP opens the tutorial (EV-A §5 "PF1 / long messages", UG1 p.9-10). The lesson text "PF1 shows a longer one" (module1.ts:44) is not what the sim does; the long text only appears in the coach panel (LearningPanel.tsx:30), not in the terminal.
- F2 Primary Option Menu omits option 8 and shows "Release . : ISPF LAB", "Time. . . : --:--" (primaryMenu.ts:12-25, 57-58). Educational simplification, disclosed on the panel ("Educational ISPF training simulator"). The real menu has the options listed in UG1 p.5-8 and RB Fig 4-8 (EV-A §5).
- F3 "X or PF3 here logs you off" (primaryMenu.ts:36): IBM says X ends ISPF using log/list defaults, only the active logical screen when split (EV-A §5 "X on the option line", UG1 p.9-10). Exit of ISPF may show the Log/List disposition panel; sim does not. Low.
- F4 Invalid option text `INVALID OPTION`: no ISPF Messages and Codes entry was verified (f54mc00 not in evidence) -> INSUFFICIENT EVIDENCE for the exact message text.

**Validation and assessment findings**
- V1 (confirmed) Step 5 validator `PF_KEY_PRESSED key 3 screen HELP` (module1.ts:54) is reachable only after a HELP screen is open (PF1 or typing HELP), so "bare PF3 on help passes" is true but it cannot be done without opening help; the "Enter on empty line" part of the instruction is unvalidated (false positive on that sub-task, Low).
- V2 Step 3 `onScreen("PRIMARY_OPTION_MENU")` also passes on any path that lands on the POM (state-only check), fine.
- V3 Step 4 validator requires `text === "INVALID OPTION"` exactly; any other bad input that yields a different message (e.g. "TSO" without command, `=99` -> INVALID JUMP DESTINATION via system command) is a rejected valid alternative; `4` gives "OPTION NOT AVAILABLE IN THIS TRAINING MODULE" (navigation.ts:7) - learner who tries a real-but-unimplemented option does not pass and is penalised.
- V4 Challenge mode: no `challenge` property, last step validator = PF3 on HELP: needs a PF1/PF3 pair and is not trivial. OK.
- V5 Scenario isolation: starting state LOGOFF + LOGIN (TutorialProvider.tsx:108-109); no catalog dependency. OK.

**Verified reference IDs and exact topics**
- UG1 SC19-3627-70 "Getting help" (printed p.9-10) - first HELP shows long message in pop-up, second HELP goes to tutorial (EV-A §5).
- UG1 "Function keys" (p.24): F1 Help, F3 End/Exit (EV-A §5).
- UG1 "Ending an ISPF function or ISPF" / "Exit option (X)" (p.9-10) (EV-A §5).
- UG2 SC19-3628-70 "Settings (option 0)" - "Long message in pop-up" (p.29) (EV-A §5 "ISPF uses no pop-ups").
- OWN-READ UG1 Figure 15 "Member List Commands Pop-Up Window (ISRCMLEP)" printed p.83 - pop-up windows exist throughout ISPF.
- TSOUG SA32-0971-70 "Data Set Naming Conventions" p.18-20; "adds the prefix ... sometimes your user ID" (EV-A §7) for "userid becomes HLQ".

**Confirmed deviations**
1. "ISPF never pops up dialog boxes" - IBM: pop-up windows are a documented panel type and an option 0 setting (EV-A §5; UG1 Fig 15). Lesson states the opposite; not disclosed. Real distinction: no GUI modal dialogs, but pop-up panels exist.
2. "PF1 shows a longer one" - real: first PF1 shows the long message in a pop-up, second PF1 enters the tutorial; sim opens a help panel straight away (EV-A §5). Not disclosed.
3. Following step 4 costs 10 points (engine.ts:38). Not disclosed to the learner.
4. "Userid becomes HLQ": true as the default TSO prefix (TSOUG p.18-20: "sometimes your user ID"), not guaranteed; lesson states it as fact (module1.ts:22). Limitation, VERIFIED WITH LIMITATIONS only.

**Recommended correction (minimum viable)**
- module1.ts:44 replace with: "ISPF reports mistakes in the short message at the top right of the panel; PF1 (or HELP) then shows the long explanation." Delete "never pops up dialog boxes".
- Do not count the scripted invalid-option message as a mistake: either exclude by lesson flag or change step 4 to a neutral action (e.g. type HELP).
- Optional: make step 5 validate a PF1/PF3 sequence after an empty Enter, or drop the Enter sentence.

**Priority and severity:** P1 / Medium (false general statement + scoring trap in the very first lesson).

**Evidence and rationale:** module1.ts:44 vs EV-A §5 pop-up row; engine.ts:38 + navigation.ts:22-24 (error severity counted); reducer.ts:61-65 vs EV-A §5 PF1 row; login.ts:9; TutorialProvider.tsx:108-109.

---

### Lesson 2 - l02-navigating

**Module and title:** Module 1 "Getting around" - "Navigating ISPF"

**Learning objectives (from code):** Reach DSLIST (3.4) two ways and return to the POM. Teaches: primary menu options, Utilities (3), direct 3.4 and =3.4, "PF3 unwinds one panel at a time" (module1.ts:65-66).

**Source files:** module1.ts:59-108; src/engine/navigation.ts:58-125 (`frameForPath`, `openPath` push the intermediate menu); src/engine/screens/utilities.ts:35-96; primaryMenu.ts:64-98; src/engine/reducer.ts:31-47; systemCommands.ts:62-99; validators.ts:14-18; engine.ts:34-73; tests/tutorial/lessons.test.ts:53-94.

**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- E1 (confirmed, module1.ts:102-103) "Notice that 3.4 still went through Utilities, so it takes two PF3s ... Even when you jump, ISPF remembers the intermediate menu, so PF3 behaves the same either way." IBM documents the opposite design: typing two selections separated by a period "bypass[es] the second menu". The IBM sample session types `3.3` "bypassing the Utility Selection Menu" and after the copy a single F3 shows the Primary Option Menu (OWN-READ UG1 "Running a sample ISPF session" steps 11-14, printed p.11; "Option selection" p.18-19; EV-A §5 "Typed 3.4 vs via 3 then 4" row). The sample session uses 3.3, not 3.4, so the PF3 count for 3.4 is inferred by identical mechanism, not stated; IBM never says "3.4 returns to the POM with one PF3" literally.
- E2 (confirmed) The lesson teaches the learner to expect two PF3s after a typed 3.4, an expectation that will be wrong on a real system. This is a navigation habit error in the most-used ISPF path.
- E3 Step 3 "Do not look for a Home button - there is none" is wrong in spirit: RETURN/F4 (jump home) exists (UG1 p.49-50, EV-A §5 RETURN) and the sim implements it (reducer.ts:52-53). The sim's own help panel says PF4 returns (help.ts:14). L16 teaches it later; no contradiction in code but the statement "none" is false for real ISPF. Low.
- E4 "=3.4 jumps there directly from any panel" (module1.ts:95): supported (UG1 "Using the jump function" p.58, EV-A §5).
- E5 "ISPF keeps a stack of panels. PF3 pops one" - a mental model; IBM describes END as returning to the previous panel (UG1 p.24 Function keys "Ends the current function"); acceptable as analogy, not an IBM statement.

**Simulator fidelity findings**
- F1 (confirmed) `frameForPath("3.4")` returns `via:[util]` and `openPath` pushes the Utility Selection panel onto the stack (navigation.ts:77-78, 118-121) so a typed `3.4` needs two PF3s. IBM: typed `3.x` bypasses the Utility Selection Panel (OWN-READ UG1 p.18-19, p.11). Deviation undisclosed; docs/03 text not re-verified here. The same push applies to `=3.4` and 3.1/3.2/3.3.
- F2 Utility Selection panel lists items 1-6,8,9,12,14 (utilities.ts:9-20); real panel has more entries. Simplification.
- F3 PF3 on the Utility Selection panel after typed path: sim goes to the Utility panel; real goes straight to POM (see F1).

**Validation and assessment findings**
- V1 `onScreen` validators are path-agnostic (validators.ts:14-18), so step 5 passes for either behaviour; the false claim is therefore not even needed for validation.
- V2 (confirmed) Challenge mode: no `challenge` object, so the last step validator `onScreen("PRIMARY_OPTION_MENU")` is used (engine.ts:42). The starting state is the POM (module1.ts:67) and the store notifies listeners on every dispatch, even with no events (store.ts:61-63 `for (const l of this.eventListeners) l(r.events, ...)`), so the first action in Challenge (even pressing Enter on an empty option line) completes L2 (state-only check). Trivial pass.
- V3 tests/tutorial/lessons.test.ts:64-68 asserts two PF3s after `3.4`; the test encodes the defect and would need updating with the fix.
- V4 Step 2 `onScreen("DSLIST_SEARCH")` also passes on 3.4 typed at step 1 (two steps advance at once) - intended and tested (lessons.test.ts:70-75).

**Verified reference IDs and exact topics**
- UG1 SC19-3627-70 "Option selection" printed p.18-19 (OWN-READ + EV-A §5): "To bypass the second menu, type two selections, separating them with a period".
- UG1 "Running a sample ISPF session" steps 9-14 printed p.11 (OWN-READ): 3 then F3 F3 versus `3.3` "bypassing the Utility Selection Menu" then one F3 to the POM.
- UG1 "Using the jump function" p.58 (EV-A §5); "RETURN" p.49-50 (EV-A §5).

**Confirmed deviations**
1. Typed `3.4` leaves the Utility Selection panel on the stack (sim) vs bypassed (IBM, UG1 p.18-19; sample p.11). Lesson asserts the sim behaviour as ISPF fact (module1.ts:102-103). Not disclosed.
2. "There is no Home button" vs RETURN/PF4 (low).

**Recommended correction (minimum viable)**
- Sim: push the intermediate menu only when the user navigated step by step (typed `3`, then `4`); for dotted paths and jumps open the leaf with the POM as its parent (drop `via` from `openPath`). Update lessons.test.ts:64-68 (typed 3.4 then one PF3 reaches the POM).
- Lesson text: module1.ts:102-103 -> "PF3 once from 3.4: typing 3.4 skips the Utility Selection panel." (After the sim fix.) If the sim is not changed, at minimum delete the explanation sentence and the "two PF3s" claim.
- Challenge: add `challenge: { task, validator }` that requires a visit to DSLIST_SEARCH and then POM (e.g. state-based plus a seen-screen event), otherwise it completes on the first keypress.

**Priority and severity:** P1 / High (false navigation fact on the most-used path, baked into the simulator and a test; trivial Challenge).

**Evidence and rationale:** navigation.ts:77-78,118-121; module1.ts:100-106; lessons.test.ts:64-68; store.ts:61-63; engine.ts:41-46; OWN-READ UG1 p.11, p.18-19.

---

### Lesson 3 - l03-settings-tso

**Module and title:** Module 1 "Getting around" - "Settings and TSO commands"

**Learning objectives (from code):** Change a setting in option 0, then run `LISTCAT LEVEL({HLQ})` from option 6. Teaches: ISPF Settings (0), TSO command shell (6), LISTCAT and the catalog, TSO commands from the Option line (module1.ts:116-117).

**Source files:** module1.ts:110-160; src/engine/screens/settings.ts:9-74; src/engine/screens/tsoCommand.ts:15-148; src/parsers/optionCommand.ts:27-41; src/engine/screens/dslistResults.ts:78,91-120; src/engine/screens/memberList.ts:55,88-95; src/editor/primaryCommands.ts:144-166; src/persistence/settingsStore.ts:7-10; validators.ts:14-28.

**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- E1 (confirmed, module1.ts:130) "Tab to the Default scroll amount field ... in option 0". IBM's Settings panel field list contains no "Default scroll amount"; the scroll amount is the per-panel `Scroll ===>` field, and ISPF stores three amounts (Browse ZSCBR, Edit/View ZSCED, member lists ZSCML) in the application profile (EV-A §5 Option 0 row; OWN-READ UG1 "Scroll" under ISPF System Commands, printed p.59-60). The lesson teaches a non-existent setting as the model of option 0 ("Real ISPF has dozens; this simulator keeps the ones it honours" in step 1 softens but still names a real-ISPF-absent field).
- E2 (confirmed, module1.ts:131) "Scroll amount controls how far PF7/PF8 move in lists and the editor. PAGE is a full screen; HALF is half; CSR scrolls to the cursor." The first part is true in IBM (UG1 p.59: amount determines lines/columns scrolled by each scroll command; PAGE/HALF/CSR/DATA/MAX defined). But in the sim only the editor honours the setting; DSLIST and member list hard-code PAGE (dslistResults.ts:78,91-120; memberList.ts:55,88-95) and CSR/DATA are implemented as PAGE (primaryCommands.ts:144-158). IBM: CSR scrolls according to the cursor row/column; DATA is one line less than a page (OWN-READ UG1 p.59-60). Undisclosed.
- E3 Step 5 / step 4 "TSO prefix works on any command line" - supported (OWN-READ UG1 "TSO commands, CLISTs, and REXX EXECs" printed p.2: "Prefixing a command with TSO and entering it from any command line").
- E4 Step 4 explanation "LISTCAT asks the catalog ... for every entry under a high-level qualifier" - supported in substance: TSO LISTCAT LEVEL(level) lists entries at that level; with no operands the user ID/PROFILE prefix is the highest qualifier (OWN-READ TSOCR "LISTCAT command" printed p.171-173; EV-A §7 LISTCAT row). "DSLIST (3.4) shows the same information as a panel" - not verified (INSUFFICIENT EVIDENCE: no read of UG2 3.4 catalog-vs-VTOC semantics).
- E5 "Option 6 ... TSO is the command-line layer underneath ISPF" - ok as orientation; UG1 p.2 says ISPF lets you call TSO commands.

**Simulator fidelity findings**
- F1 Option 0 panel in the sim: Show PF keys, Insert mode default, Default scroll amount, print graphics and terminal characteristics (settings.ts:33-41). EV-A §5 field list (UG2 p.27-33): Command line at bottom, CUA mode, Long message in pop-up, Tab to action bar, Session Manager mode, Jump from leader dots, Always show split line, Scroll member list etc. The sim's "Default scroll amount" and "Show PF keys (Y/N)" are not documented fields. Disclosed only generically ("Only settings the simulator honours are shown", settings.ts:10-14).
- F2 LISTCAT output `IN CATALOG:CATALOG.USER` then `NONVSAM ------- name` (tsoCommand.ts:76) - format not covered by TSOCR p.171-175 text (it documents syntax only). INSUFFICIENT EVIDENCE for output fidelity.
- F3 `ISPF Command Shell` panel title and "Enter TSO or Workstation commands below:" - option 6 name "Command" (UG1 POM figure, EV-A §5); panel text not verified.
- F4 TSO_COMMAND_ENTERED is fired for any text including unparseable commands (tsoCommand.ts:62).

**Validation and assessment findings**
- V1 (confirmed) Step 2 validator `SETTING_CHANGED setting==="scrollDefault"` (module1.ts:133): any new value passes (HALF not required) and, because the event is emitted only when the value differs from the stored one (settings.ts:72), a replay with the stored value already HALF yields no event: typing HALF as instructed does not pass (soft dead end; settings persist via `saveSettings` store.ts:73). Learner must type a different value.
- V2 (confirmed) Step 4 validator `/^LISTCAT/i` (module1.ts:149) passes for `LISTCAT`, `LISTCAT garbage`, `LISTCAT LEVEL(SYS1)` - it does not check `LEVEL({HLQ})`. Rejected valid alternative: `TSO LISTCAT ...` from the POM also fires TSO_COMMAND_ENTERED, so it passes (good); `LISTC` (valid IBM abbreviation, TSOCR p.172) does not match `/^LISTCAT/` and is rejected, and parseTsoCommand may not accept it either (not tested).
- V3 (confirmed) Challenge: no `challenge`; last-step validator `onScreen("PRIMARY_OPTION_MENU")` while the lesson starts on the POM and the store fires on every dispatch -> first action completes the Challenge (same as L2). Trivial.
- V4 Scenario isolation: settings are global and persisted; L3 mutates user settings (scrollDefault HALF) and later lessons that open the editor inherit HALF scroll (openSession scrollAmount, open.ts:51). Cross-lesson side effect; not reset.

**Verified reference IDs and exact topics**
- UG1 SC19-3627-70 "ISPF System Commands - scroll amount" printed p.59-60 (OWN-READ): valid amounts, three stored values ZSCBR/ZSCED/ZSCML, "If there is no scroll amount field ... default is PAGE".
- UG2 SC19-3628-70 "Settings (option 0)" printed p.27-33 (EV-A §5): no Default-scroll-amount field.
- UG1 "TSO commands, CLISTs, and REXX EXECs" p.2 (OWN-READ).
- TSOCR SA32-0975-70 "LISTCAT command", "LISTCAT command syntax/operands" printed p.171-173 (OWN-READ + EV-A §7): LEVEL operand, no-operand default prefix, TSO LISTCAT invokes the Access Method Services command.

**Confirmed deviations**
1. "Default scroll amount" field in option 0 (sim and lesson) vs IBM per-panel Scroll field and three profile values. Partly disclosed (generic "simulator keeps the ones it honours"), not the specific absence.
2. Scroll amount "in lists" and "CSR scrolls to the cursor" - sim does neither (see E2). Undisclosed.
3. Validator ignores the LEVEL({HLQ}) operand.

**Recommended correction (minimum viable)**
- Retarget step 2 at a real, simulable behaviour: have the learner type HALF in the editor's `Scroll ===>` field (editor.ts:54 already has one) and observe PF8 move half a page; or keep option 0 but relabel the sim field honestly ("PF key display / Insert mode") and teach scroll in L7/L8.
- If the field stays, reword module1.ts:130-131: "In this simulator Option 0 also holds a default scroll amount; on real z/OS you change the Scroll ===> field on each panel" and make lists honour it.
- Validator: `TSO_COMMAND_ENTERED` with `/^(TSO\s+)?LISTC(AT)?\b.*LEVEL\(\{HLQ\}\)/i` (or at least require LEVEL). Emit SETTING_CHANGED for a re-entered same value or accept `HALF` currently stored.

**Priority and severity:** P1 / Medium (invented Option 0 field taught as ISPF; soft dead end on replay; trivial Challenge).

**Evidence and rationale:** module1.ts:130-133,149; settings.ts:33-41,72; dslistResults.ts:78; memberList.ts:55; primaryCommands.ts:144-158; OWN-READ UG1 p.59-60, p.2; TSOCR p.171-173; EV-A §5 Option 0 row.

---

### Lesson 4 - l04-finding-data-sets

**Module and title:** Module 2 "Data sets" - "Finding your data sets"

**Learning objectives (from code):** Display all `{HLQ}` data sets in DSLIST. Teaches: HLQ, Dsname Level, data-set naming hierarchy, DSORG/RECFM/LRECL columns (module2.ts:14-15).

**Source files:** module2.ts:8-50; src/engine/screens/dslistSearch.ts:9-74; src/engine/screens/dslistResults.ts:56-100; src/catalog/catalog.ts:58-82 (`searchLevel`); validators.ts:57-60; tests/tutorial/lessons.test.ts (no dedicated L4 test).

**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- E1 (confirmed, module2.ts:28-29) "list every data set whose name starts with it" / "A level is a name prefix." IBM defines the Dsname Level as level qualifiers to be included, matched by qualifier with `*`/`%`/`**`; since z/OS 3.2 the "Include Additional Qualifiers" checkbox decides whether data sets with extra qualifiers are listed - with it NOT selected, level `PDFTOOL.COMMON` returns "(No data set names found)" when only `PDFTOOL.COMMON.ASM` etc. exist (OWN-READ UG2 "Dsname level / Include additional qualifiers" and Examples printed p.131-132; EV-A §6 Dsname Level row). The lesson's statement is true only with that option selected, and "starts with" is not character-prefix: `{HLQ}.J` does not match `{HLQ}.JCL` (sim qualifierMatches, catalog.ts:77-82, agrees with IBM here but the lesson text does not).
- E2 (confirmed) Step 3 asks the learner to "read the list": "PO means partitioned, PS sequential, FB 80 ...". In IBM's default Volume view only Volume (and Message) are shown; Dsorg/Recfm/Lrecl/Blksz appear in the Attributes view (View menu option 3) (OWN-READ UG2 Figures 86 and 88, printed p.134 and p.136). The sim always prints `Dsorg Recfm Lrecl Volume` together (dslistResults.ts:80,57) even though its own entry panel says "Initial View 1. Volume" (dslistSearch.ts:40). So the learner is told to read columns that, on a real system, are not on the first screen.
- E3 "Names ... first one, the high-level qualifier, usually identifies the owner" - supported: RB §5.6 (EV-A §8) HLQ/LLQ definition and qualifier rules. "On a real system with thousands of data sets this matters" - plausible, no source needed.
- E4 FB 80 "classic card image" (module2.ts:36): supported by RB (OWN-READ RB ch.3 table: "often an 80-byte record, reflecting the traditional punched card image", printed p.153).

**Simulator fidelity findings**
- F1 (confirmed) The sim entry panel renders "Include Additional Qualifiers" without a selecting slash (dslistSearch.ts:43) while `searchLevel` behaves as if it were selected (catalog.ts:69-73, `parts.length > q.length` only rejects shorter names). IBM: unselected -> exact qualifier-count match (UG2 p.132 example 2). Panel and behaviour are inconsistent; the shown state contradicts the engine. The sim also renders "/ Confirm Data Set Delete" and "/ Confirm Member Delete" as selected but those are static text (no field).
- F2 (confirmed) List columns: see E2. Real list also lists the volume only (Volume view) and an alias/`*VSAM*` entries; sim shows only catalog PS/PO.
- F3 Sim Dsname Level prefilled with the userid (dslistSearch.ts:36); IBM: panel retains the last value from the user profile (UG1 "Data entry panels" p.18). Low.
- F4 DSLIST `*` handling: sim supports `*` within a qualifier and bare `*` qualifier but not `**` (zero or more qualifiers) - IBM p.128-130 (EV-A §6). Low, not used by L4.

**Validation and assessment findings**
- V1 (confirmed) Step 2 `dslistShowing(level.startsWith(hlq))` (module2.ts:31) passes for `{HLQ}.JCL`, `{HLQ}.COBOL`, even `{HLQ}.Z` (no match -> error, no results screen so no pass). A learner who lists only `{HLQ}.JCL` passes the "list every data set" step (false positive); step 4 would then be partly pre-satisfied.
- V2 Step 4 requires exactly `{HLQ}.JCL`; a valid equivalent `{HLQ}.JCL.*`, `'{HLQ}.JCL'`, `{HLQ}.J*` (all list the same data set) is rejected (rejected valid alternatives; Low).
- V3 Step 3 `onScreen("DSLIST_SEARCH")` passes only via PF3 or END; Fine.
- V4 Challenge: no `challenge`; last-step validator `level === {HLQ}.JCL`. Not trivial, but any prior state is irrelevant (state-only check on DSLIST_RESULTS): a learner who happened to leave DSLIST_RESULTS `{HLQ}.JCL` open completes on the next keypress. Low.
- V5 Scenario isolation: starts at PRIMARY_OPTION_MENU; no catalog mutation. OK.

**Verified reference IDs and exact topics**
- UG2 SC19-3628-70 "Data set list utility (option 3.4)" - Dsname Level, Include Additional Qualifiers, examples: OWN-READ printed p.126-133 (EV-A §6 p.128-133).
- UG2 Figure 86 "Data set list - volume view" (p.134); Figure 88 "attributes view" (p.136), "View" pull-down 1 Volume / 3 Attributes (p.135) (OWN-READ).
- RB SG24-6366-02 §5.6 "How data sets are named" (EV-A §8; HLQ/qualifier rules); RB ch.3 table "punched card image" p.153 (OWN-READ).
- UG1 "Option selection" p.18-19 (for 3.4 entry) (OWN-READ).

**Confirmed deviations**
1. Dsname Level described as a plain name prefix; IBM: qualifier-based, "Include Additional Qualifiers" required to include deeper names (UG2 p.131-132). Partly true in the sim, undisclosed dependency.
2. Default list shows Dsorg/Recfm/Lrecl; IBM default is Volume view (UG2 p.134).
3. Sim panel shows the Include-Additional-Qualifiers option unchecked while acting as checked.

**Recommended correction (minimum viable)**
- module2.ts:28-29 -> "Press Enter to list every data set under it. A level is one or more qualifiers; with 'Include Additional Qualifiers' selected (as here) {HLQ} also matches {HLQ}.JCL and deeper names." Add a "/" before the option in dslistSearch.ts:43.
- module2.ts:36 -> tell the learner to switch to the Attributes view (View menu / PF11 in the real list) or have the sim default to the Volume view and add a view switch; simplest: keep the combined columns but say "this simulator shows the Attributes columns up front; on z/OS use View > Attributes".
- Step 2 validator: require `level.toUpperCase() === ctx.hlq` (or `HLQ.*`).

**Priority and severity:** P2 / Medium (incorrect model of Dsname Level and default columns; false-positive validator).

**Evidence and rationale:** module2.ts:28-36; catalog.ts:65-82; dslistSearch.ts:40-43; dslistResults.ts:57,80; OWN-READ UG2 p.126-136.

---

### Lesson 5 - l05-data-sets-and-members

**Module and title:** Module 2 "Data sets" - "Data sets and members"

**Learning objectives (from code):** Open `{HLQ}.JCL`, display its member list, view its data-set information. Teaches: PDS vs member, member-list line commands, the I line command (module2.ts:58-59).

**Source files:** module2.ts:52-100; dslistResults.ts:128-185; datasetPanels.ts:159-236; memberList.ts:37-98; open.ts:21-34; TutorialProvider.tsx:104-111 (start state DSLIST_SEARCH with `clearStack`); reducer.ts:105-115; navigation.ts:44-51; validators.ts:52-60.

**Technical accuracy status:** CORRECTION REQUIRED (limitations plus a sim defect)

**Educational quality findings**
- E1 (confirmed) Step 2 instruction "Type I ... next to {HLQ}.JCL" and validator `onScreen("DATASET_INFO")` (module2.ts:75): see V1. The explanation "organization PO, record format FB, record length 80, block size, space and directory blocks" is plausible for IBM's Data Set Information panel but the panel layout was not read (UG2 "Data set information" topic not in EV-A) -> INSUFFICIENT EVIDENCE on the exact panel contents.
- E2 (confirmed, module2.ts:95) "These are ISPF statistics. The editor keeps them up to date every time you save." IBM: statistics are maintained only when STATS mode is on; "If STATS mode is off when you save a member, any previous statistics are lost"; the mod level increments on the first change not on every save; statistics exist only for members that have them or when created with STATS on (OWN-READ EM "Edit profile modes" printed p.20; EV-A §2 STATS row; §6 statistics row). Overstated, undisclosed.
- E3 (module2.ts:87) "E, B, V on a PDS also open the member list, but M is the explicit way" - supported: IBM lists M as "display member list" and says V/B/E on a PDS lead to a member list (OWN-READ UG1 "Displaying member lists" p.82); the DSLIST Settings "Enhanced member list for Edit, View, and Browse" changes which list appears (OWN-READ UG2 printed p.134 DSLIST Settings) - lesson silent.
- E4 PDS analogy to a folder with the correct caveats ("one data set with a directory inside it - not a tree") is supported by RB §5.9.2 (OWN-READ printed p.215: directory has an entry per member; DSORG=PO). Good.
- E5 (confirmed new) The member-list header in the sim reads `Name Prompt Size Created Changed ID`; IBM UG1 Table 16/sample: Name, Prompt, Size, Created, Changed, ID with Size = current number of records (OWN-READ UG1 printed p.83-84, p.95) - consistent. Lesson text "Size (records)" correct.

**Simulator fidelity findings**
- F1 (confirmed, new) The lesson starts on DSLIST_SEARCH with `GOTO clearStack:true` (TutorialProvider.tsx:108-111; reducer.ts:105-110), so the stack is empty. PF3 on DSLIST_SEARCH calls `pop` on an empty stack, which does nothing (navigation.ts:46). On a real system PF3 from the 3.4 entry panel returns to the Primary Option Menu. This affects every lesson that starts at DSLIST_SEARCH (L5, L7, L8, L9, L10, L12). L8's hint "PF3 to the Primary Option Menu, type 2" (module3.ts:65) cannot work in that state.
- F2 `M` in the sim opens a member list in mode "M" labelled LIBRARY (open.ts:25, memberList.ts:18); `E`/`B`/`V` open lists with different titles but identical command sets (memberList.ts runLineCommand allows D/R/C/M/I/G/J in all modes). IBM Table 15 gives different valid line commands per list type (OWN-READ UG1 printed p.81-82, 90-91): Edit/View/Browse lists S plus E/V/B only; the D, E, P, R, V line commands "are available only for the Library and Data Set List utilities ... valid only after you enter the M line command". The "enhanced member list" setting (UG2 p.134) can change this for E/B/V from 3.4; default not documented in the text I read -> INSUFFICIENT EVIDENCE for default.
- F3 Member list prompt column blank/`Prompt` field ok; "Changed" shows `date 00:00` hard-coded time (memberList.ts:32); IBM shows time with seconds (UG1 sample, printed p.84). Low.
- F4 DATASET_INFO panel: layout invented in part ("Management class STANDARD", "Storage class USRDATA", Owner, "Read only"): IBM panel not verified; the extra "Read only . . . : YES (system library)" row is not an IBM field (sim-specific). Low.

**Validation and assessment findings**
- V1 (confirmed) Step 2 `onScreen("DATASET_INFO")` passes for I on any data set (e.g. `{HLQ}.COBOL`) and for S (short information) which pushes the same screen id (dslistResults.ts:158-160). Seed claim "L5 step 2 any I passes" is confirmed; the instruction's specific row is not validated.
- V2 Step 4 `memberListOpen("{HLQ}.JCL")` also passes for E/B/V on the library - acceptable alternatives, no defect.
- V3 Step 1 uses `startsWith(hlq)` (same false-positive as L4 V1).
- V4 Challenge: no `challenge`; the last-step validator is `onScreen("DSLIST_RESULTS")`. Start state is DSLIST_SEARCH; the first Enter with the default level lists `{HLQ}` and completes the Challenge with no I, no M (trivial pass).
- V5 Scenario isolation: no data change; ok.

**Verified reference IDs and exact topics**
- RB SG24-6366-02 §5.9.2 "What is a partitioned data set" (OWN-READ printed p.215-216).
- UG1 SC19-3627-70 "Using member selection lists", Table 15, notes, p.81-82; "Member selection list commands" p.89-91 (OWN-READ).
- UG2 SC19-3628-70 "Data set list utility (option 3.4)" DSLIST Settings p.134 (OWN-READ); "G/I" member list commands p.100 (EV-A §6).
- EM SC19-3621-70 "Edit profile modes", "STATS" (EV-A §2).

**Confirmed deviations**
1. Statistics "updated every save" (lesson) vs STATS-mode dependent (IBM). Undisclosed.
2. Sim member lists offer the same commands in all modes; IBM differs by list type (see F2). Undisclosed.
3. PF3 on the DSLIST entry panel is a no-op after a lesson start (sim state bug), real PF3 returns to the POM.

**Recommended correction (minimum viable)**
- Starting state for lessons that begin at DSLIST_SEARCH: use `GOTO` without clearing the stack but push the POM and Utility panels under it (or `stack:[POM]`), so PF3 returns home. In TutorialProvider.tsx:108-111 set the stack explicitly from `LessonStart`.
- module2.ts:95 -> "These are ISPF statistics, kept when STATS mode is on (the default here)."
- Step 2 validator: `eventIs("DATASET_INFO_VIEWED", e => e.dsn === ctx.hlq + ".JCL" && !e.short)`.

**Priority and severity:** P2 / Medium (navigation trap on lesson start; false-positive validators; overstatement).

**Evidence and rationale:** TutorialProvider.tsx:104-111; navigation.ts:44-51; dslistResults.ts:158-160; memberList.ts:121-160; module2.ts:75,95; OWN-READ UG1 p.81-91, EM p.20.

---

### Lesson 6 - l06-allocating

**Module and title:** Module 2 "Data sets" - "Allocating a data set"

**Learning objectives (from code):** Allocate `{HLQ}.TEST.JCL` as a PDS (FB, LRECL 80, 10 directory blocks) and find it in 3.4. Teaches: 3.2, the Allocate New Data Set panel, directory blocks decide PDS vs PS, RECFM/LRECL choices (module2.ts:108-109).

**Source files:** module2.ts:102-154; datasetPanels.ts:100-157; allocateDataset.ts:15-94; catalog.ts:99-132; validators.ts:57-78; engine.ts:34-73; store.ts:55-68 (persistence); tests/tutorial/lessons.test.ts:173-187.

**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- E1 "Directory blocks greater than zero make a partitioned data set" (module2.ts:131, explain.ts:112): VERIFIED WITH LIMITATIONS. IBM: "ISPF requests a data set organization (DSORG) of PS when the value is zero or PO if the value is greater than zero"; Data set name type LIBRARY allocates a PDSE and overrides zero; blank directory size -> sequential; the data class can preset values (OWN-READ UG2 "Data set utility (option 3.2)" printed p.101-105, p.107-108; EV-A §6 directory-blocks row). The lesson never mentions LIBRARY/PDSE or that the class defaults can change the panel. Limitation.
- E2 "Each block holds a handful of member entries; 10 is plenty for a training library." - INSUFFICIENT EVIDENCE (no directory-block capacity figure in EV-A/EV-C or my reads). Also RB §5.9.2 says the directory size is fixed at allocation (not read in detail).
- E3 (confirmed) Explanation of 3.2 "acts on whole data sets: allocate (create), rename, delete, information" - supported (UG2 p.101 panel: A, R, D, blank, C, U, S, V; EV-A §6).
- E4 "The system reserves space on a volume and adds the name to the catalog" - supported: "the new data set is allocated and cataloged" (OWN-READ UG2 printed p.104-105 after Figure 70).
- E5 (confirmed) The panel field label in the lesson ("Other Data Set Name") and in the sim ("Other Partitioned or Sequential Data Set:", datasetPanels.ts:37) differs from IBM's "Other Partitioned, Sequential or VSAM Data Set: Data Set Name" (OWN-READ UG2 Figure 68, printed p.101). Low.
- E6 The step 5 text "Done. The library is empty for now - lesson 13 fills it. (This step completes automatically.)" - a no-action step used as completion; acceptable but it means step 5 gives no assessment.

**Simulator fidelity findings**
- F1 The sim's Allocate panel (allocateDataset.ts:34-58) follows the UG2 Figure 69 structure (Management/Storage/Data class, Space units, Average record unit, Primary/Secondary quantity, Directory blocks, Record format/length, Block size, Data set name type, Expiration date) - consistent with RB Figure (OWN-READ RB printed p.~215: "Directory blocks . . 0 (Zero for sequential data set) *"). Preset "STANDARD/USRDATA" management/storage classes are invented values (static).
- F2 Space units accepted: TRKS/CYLS/BLKS only (allocateDataset.ts:69), the real panel shows "BLKS, TRKS, CYLS, KB, MB, BYTES or RECORDS" (same sim text shown but KB/MB rejected). Low.
- F3 Defaults: IBM remembers the last entered values (UG2 p.105: defaults from last entry or last info request); sim defaults primary 5, secondary 2, dir 0 every time. Low.
- F4 `DATA SET ALREADY EXISTS` for 3.2 A on an existing name (datasetPanels.ts:132): IBM message not verified (INSUFFICIENT EVIDENCE for the exact text).

**Validation and assessment findings**
- V1 (confirmed, dead end) The lesson has no catalog reset in `startingState` (module2.ts:110) and the catalog persists (store.ts:55-68). On any replay while `{HLQ}.TEST.JCL` still exists (only L13 deletes it), step 2 (`3.2` A name) fails with DATA SET ALREADY EXISTS (datasetPanels.ts:132) and never opens ALLOCATE_DATASET, so `onScreen("ALLOCATE_DATASET")` cannot pass; the error also counts a mistake. Typing a different name would then fail step 3's dsn test. The learner must discover 3.2 D on their own. Confirmed.
- V2 (confirmed) Step 3 `eventIs("DATASET_ALLOCATED", dsn === {HLQ}.TEST.JCL)` (module2.ts:133): checks only the name. A learner who leaves Directory blocks at 0 allocates a PS data set, any RECFM (FB/VB/F/V/U), any LRECL, and still passes; the lesson objective (PDS, FB, 80, 10 blocks) is not assessed. Step 4's explanation says it "should show DSORG PO" but nothing checks it.
- V3 (confirmed) Step 4 validator (module2.ts:141-145) passes on `level === hlq` (listing all `{HLQ}`), i.e. without ever looking for TEST.JCL; also on opening the member list or editor of TEST.JCL (editorOpen can't occur on an empty PDS; member list of an empty PDS shows no members). Seed claim "step 4 passes on level===hlq" confirmed.
- V4 (confirmed) Step 5 `datasetExists` is a state-only auto-pass; in Challenge mode the default validator is the last step's `datasetExists("{HLQ}.TEST.JCL")` (module2.ts:151) - completes on the first keypress if the data set already exists (e.g. an earlier attempt or a previous Challenge run), and checks no attribute. Seed claim confirmed.
- V5 tests/tutorial/lessons.test.ts:173-187 completes L6 with the dir=10 path; no test for dir=0 or replay.
- V6 Scenario isolation: no cleanup at the end of L6 or start; L13 depends on L6's data (see L13).

**Verified reference IDs and exact topics**
- UG2 SC19-3628-70 "Data set utility (option 3.2)" printed p.101-105 incl. Figure 68, Figure 69-70, "allocated and cataloged" (OWN-READ); "Directory blocks" p.107-108 (EV-A §6); option list p.101 (EV-A §6).
- RB SG24-6366-02 §5.9.2 PDS directory, DSORG=PO (OWN-READ printed p.215); Allocate New Data Set sample panel (OWN-READ RB, "Directory blocks . . 0 (Zero for sequential data set)").
- UG1 sample session, allocation steps (printed p.10-11, OWN-READ).

**Confirmed deviations**
1. Lesson objective (PDS/FB/80/10) not enforced; defaults produce a PS data set (undisclosed).
2. Replay dead end when the data set exists (sim, undisclosed).
3. Capacity claim of directory blocks unsupported.

**Recommended correction (minimum viable)**
- Validator: `eventIs("DATASET_ALLOCATED", (e,ctx) => e.dsn === hlq+".TEST.JCL" && e.datasetType === "PDS")` and add `datasetExists` + `dsorg PO, recfm FB, lrecl 80, dirBlocks>=1` for the Challenge (use a catalog-attribute validator).
- Starting state: add a `resetDatasets` entry (delete `{HLQ}.TEST.JCL` if present) to LessonStart, or make step 2 accept an existing data set and route the learner to D first.
- Step 4: validate `memberListOpen`/`dslistShowing` with level starting `{HLQ}.TEST` only (drop `level === hlq`).
- module2.ts:131 drop "Each block holds a handful ... 10 is plenty" or source it.

**Priority and severity:** P1 / High (replay dead end, objective unassessed, Challenge trivial).

**Evidence and rationale:** module2.ts:110,131-151; datasetPanels.ts:131-133; allocateDataset.ts:72-89; catalog.ts:99-124; validators.ts:75-78; OWN-READ UG2 p.101-108; RB §5.9.2.

---

### Lesson 7 - l07-browse-vs-edit

**Module and title:** Module 3 "The editor" - "Browse versus Edit"

**Learning objectives (from code):** Browse `{HLQ}.JCL(HELLO)`, leave, open the same member in Edit. Teaches: Browse is read-only; View is editable but cannot save; Edit changes data; the editor frame (Top/Bottom of Data, columns, prefix area) (module3.ts:17-18).

**Source files:** module3.ts:11-50; src/engine/screens/editor.ts:33-158 (render, PF keys); src/editor/primaryCommands.ts:25-28; src/editor/lineCommands.ts:46-52; src/engine/open.ts:21-60; validators.ts:41-60; engine.ts:34-73; TutorialProvider.tsx:104-111.

**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- E1 (confirmed, module3.ts:24) "Notice the line numbers are plain text and the prefix area is not typeable." Real Browse has no line-number or prefix field: IBM's Browse display shows records from column 1 under a title line `BROWSE dsn Line 00000017 Col 001 080` (OWN-READ UG2 Figures 53/54, printed p.67-70; EV-A §4 "Browse has no prefix area"). The sim renders cyan six-digit numbers in Browse (editor.ts:104). The lesson teaches a sim artifact as ISPF behaviour.
- E2 (confirmed, module3.ts:31) "Browse refuses SAVE because nothing can be changed. The message area tells you why - ISPF always explains." IBM's Browse command list is BROWSE, COLUMNS, DISPLAY, EDIT, FIND, HEX, LOCATE, RESET, SUBMIT, VIEW; SAVE is not a Browse command (OWN-READ UG2 "Browse primary commands" printed p.69). The real response to SAVE in Browse is not documented in the pages read -> INSUFFICIENT EVIDENCE; "ISPF always explains" is unsupported. The sim answers `SAVE NOT ALLOWED IN BROWSE` (primaryCommands.ts:26).
- E3 (confirmed) The instructed action scores a mistake: that message is an error (primaryCommands.ts:13-14,26 -> `MESSAGE_SHOWN severity error`; engine.ts:38). Following step 2 costs 10 points.
- E4 "View is editable but cannot save" (teaches, module3.ts:18): supported - View functions like Edit except SAVE (message: use CREATE) and END (no changes saved) (OWN-READ UG2 "View (option 1)" printed p.65). The lesson never exercises View.
- E5 "Edit opens the same records in the ISPF editor. The prefix area on the left now accepts line commands and every record can be typed over." supported (OWN-READ EM printed p.9-10 "Editing the data set": 6-column line command field + 72-column data field; type over to alter).
- E6 "Columns 00001 00072 ... PF10/PF11 scroll left and right" supported (EM p.8-10 Figure 3 text; "Fn key Action F10/F22 left, F11 right").
- E7 Step 4 explanation "Columns tells you which part of each 80-byte record is on screen." Accurate for fixed 80 (72-column data field).

**Simulator fidelity findings**
- F1 (confirmed) Browse header is `BROWSE name   Columns 00001 00072` (editor.ts:51,30); IBM `Line nnnnnnnn Col 001 080` (UG2 p.67-70). Low.
- F2 Edit header omits the version.level `- 01.00` and the action bar (File Edit Edit_Settings Menu Utilities Compilers Test Help) shown in every IBM Edit figure (OWN-READ EM printed p.8, Figure 3; Figures 11-16, p.55-57). Disclosed nowhere. Low.
- F3 Edit PF-key legend: sim lists Help/Exit/Rfind/Rchange/Up/Down/Left/Right/Cancel (editor.ts:111-120); IBM figures show F1 Help F2 Split F3 Exit F5 Rfind F6 Rchange F7 Up F8 Down F9 Swap F10 Left F11 Right F12 Cancel (EM printed p.55) - consistent.
- F4 Default `Scroll ===> PAGE` (editor.ts:54 / settings default); IBM figures show `Scroll ===> CSR` (EM Figures 12-16). IBM states no universal default beyond PAGE if no field (UG1 p.60). Low.
- F5 Start state: lesson begins on DSLIST_SEARCH with an empty panel stack (see L5 F1). Step 2 says "press PF3 twice to get back to DSLIST" - from the Browse screen: Browse -> member list -> DSLIST_RESULTS: correct.
- F6 DSLIST `B` on `{HLQ}.JCL` opens a member list in mode B whose title reads `BROWSE {HLQ}.JCL`; IBM titles the list per the option used (UG1 p.81-84). OK.

**Validation and assessment findings**
- V1 Step 1 `editorOpen(HELLO,"HELLO","BROWSE")` is state-based: passes for any path that leaves the Browse editor open on HELLO. Acceptable.
- V2 (confirmed) Step 2 `onScreen("DSLIST_RESULTS")`: passes after two PF3s even if the learner never typed SAVE. The SAVE sub-task is not assessed (false positive); conversely a learner who types SAVE and misreads is not corrected.
- V3 Step 3 `editorOpen(... "EDIT")` ok; also passes if the learner uses option 2 (via =2 / RETURN). Fine.
- V4 (confirmed) Step 4 `memberListOpen(HELLO)` ("{HLQ}.JCL" member list): passes after a clean PF3. Fine.
- V5 (confirmed) Challenge: no `challenge`, last-step validator `memberListOpen("{HLQ}.JCL")`. A learner can complete the Challenge by pressing E (or B/V/M) on `{HLQ}.JCL` in the DSLIST: no Browse and no Edit session is required (trivial).
- V6 Scenario isolation: no data change; ok.

**Verified reference IDs and exact topics**
- UG2 SC19-3628-70 "Browsing a data set", "Browse primary commands" printed p.67-70, Figures 53-54 (OWN-READ; EV-A §4).
- UG2 "View (option 1)" printed p.65 (OWN-READ).
- EM SC19-3621-70 "Editing the data set" (printed p.8-10) and Figures 3, 11-16 (OWN-READ); "Using the ISPF editor basic functions" (F7/F8/F10/F11) printed p.9-10.
- UG1 "Using member selection lists" Table 15 p.81 (OWN-READ).

**Confirmed deviations**
1. Browse shows line numbers/prefix as text (sim) vs none (IBM); lesson asserts the sim look. Undisclosed.
2. SAVE message in Browse: IBM lists no SAVE command; sim returns a purpose-written error; lesson claims "ISPF always explains".
3. Edit/Browse headers lack version/line counters and the action bar. Undisclosed (low).

**Recommended correction (minimum viable)**
- Sim: render Browse records without the prefix numbers (data from column 1), header `BROWSE dsn  Line 00000000 Col 001 080`.
- module3.ts:24 -> "Browse shows records without letting you change them; there is no line-number or prefix area."
- module3.ts:30-31 -> replace the SAVE exercise with an observation task (e.g. try to type over a record: protected) or soften to "Browse has no SAVE command; this simulator answers with an error message". Mark SAVE as intentionally non-scoring (exclude `severity error` from mistakes for scripted probes).
- Add `challenge` that requires `MEMBER_OPENED mode BROWSE` then `mode EDIT`.

**Priority and severity:** P2 / Medium (false description of Browse; scored trap; trivial Challenge).

**Evidence and rationale:** editor.ts:48,100-105; primaryCommands.ts:25-28; engine.ts:38; module3.ts:24,31; OWN-READ UG2 p.65-70, EM p.8-10.

---

### Lesson 8 - l08-first-edit

**Module and title:** Module 3 "The editor" - "Editing your first member"

**Learning objectives (from code):** Change STEP1 of `{HLQ}.JCL(HELLO)` to IEBGENER and SAVE. Teaches: overtype editing; dirty (modified) state; SAVE keeps you in the editor; PF3 ends and, with AUTOSAVE ON (the default), saves; CANCEL discards (module3.ts:58-59).

**Source files:** module3.ts:52-91; src/engine/screens/editor.ts:264-392; src/editor/session.ts:50-110; src/editor/profile.ts:29-32; src/components/terminal/StatusLine.tsx:24; Terminal.tsx:236; src/catalog/seed.ts:70-76; catalog.ts:162-191; tests/tutorial/lessons.test.ts:96-110.

**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- E1 (confirmed, module3.ts:57,71) "watch the MODIFIED flag" / "then the status line shows MODIFIED". IBM documents no MODIFIED indicator; changed lines are flagged `==CHG>` only for CHANGE, and `DATA CHANGED-SAVE/CANCEL` appears with AUTOSAVE OFF PROMPT (EV-A §4; EM text search). The badge is a simulator-UI item (StatusLine.tsx:24, `dirty` = `editor.dirty`, Terminal.tsx:236) presented as ISPF behaviour. Not an IBM fact.
- E2 (confirmed, module3.ts:86) "with the profile setting AUTOSAVE ON (the default on most systems), END saves your changes first". IBM: END saves changed data when autosave is on (OWN-READ EM "Ending an edit session" printed p.11); there is no universal default: new profiles come from the ISPF Configuration Table, the example list shows "Modes set on: CAPS STATS NULLS NUMBER AUTOSAVE NOTE" (OWN-READ EM printed p.21; EV-A §2 AUTOSAVE row). "Default on most systems" is unverifiable -> reword to "typically ON; set per site/profile".
- E3 "Nothing reaches the editor until you press Enter" (module3.ts:71): supported in substance - IBM treats changes with "no host interaction (ENTER, PF key, or command)" as pending (OWN-READ EM Edit entry "Confirm Cancel/Move/Replace" note, printed p.6-7).
- E4 "SAVE writes the buffer to the member and keeps you in the editor. The member statistics (Changed, ID) are updated." supported: SAVE saves without ending; stats updated when STATS mode is on (EM p.276; p.11) (EV-A §2).
- E5 "If you ever want to throw changes away, type CANCEL (or press PF12)" supported: CANCEL ends the session without saving; F12 = Cancel (EM p.201-202; UG1 p.24; EV-A §2, §5).
- E6 The edit task itself (changing IEFBR14 to IEBGENER in a JOB with no DD statements) produces a job that would fail with missing SYSUT1/SYSUT2/SYSPRINT if later submitted (the member is left in that state). Educational wart: the saved member is not valid runnable JCL. No IBM claim involved; it matters for L13 (copy of HELLO) only.
- E7 Step 1 hint: "Fastest: PF3 to the Primary Option Menu, type 2 ..." (module3.ts:65): in the actual start state PF3 does nothing (see L5 F1); `=2` or RETURN (PF4) works.

**Simulator fidelity findings**
- F1 `defaultProfile` has `caps:false, number:false, stats:true, setundo:true, recovery:false, autosave:"ON"` (profile.ts:31). IBM sets caps from the data (on if no lowercase) and the example profile has NUMBER ON, CAPS ON, RECOVERY OFF, SETUNDO STG (OWN-READ EM p.20-21; EV-A §2 CAPS/NUMBER rows). Sim caps OFF means lowercase typed into JCL stays lowercase while the validator is case-insensitive (see V2).
- F2 SAVE message `MEMBER SAVED` / long `Member HELLO saved` (editor.ts:339-342): IBM message text for SAVE not verified in EV-A/own reads -> INSUFFICIENT EVIDENCE.
- F3 END on a modified member with AUTOSAVE ON saves and pops to the member list (editor.ts:373-377), matching "Ending an edit session" (p.11); END when unchanged pops silently ✓.
- F4 `saveRecords` increments `mod` on every save (catalog.ts:185); IBM increments once when the first change is made (EV-A §6 statistics row). Low.

**Validation and assessment findings**
- V1 Step 2 `editorHasLine(/IEBGENER/i)` is state-based and passes for any line (including a comment) containing the string; the instruction "change the STEP1 record" is not checked (false positive: typing IEBGENER anywhere).
- V2 (confirmed) The regex is case-insensitive while the sim's profile is CAPS OFF (no auto-uppercase). A learner who types `iebgener` passes and saves invalid lowercase JCL; real ISPF with CAPS ON (auto for data without lowercase, EM p.20) would have uppercased it. Rejected-valid: none; accepted-invalid: lowercase.
- V3 Step 3 `savedMember(HELLO)` event: passes on SAVE or PF3-with-autosave; if the learner presses PF3 directly after step 2 (skipping SAVE), the PF3 saves and emits MEMBER_SAVED (satisfies step 3) and closes the editor, then step 4's allOf(editorClosed, memberSatisfies) passes in the same batch -> the lesson completes without ever typing SAVE. Accepted alternative path; OK but the explicit SAVE sub-task is optional.
- V4 Step 4 `allOf(editorClosed, memberSatisfies(IEBGENER))` is state-only: also passes if the learner ends with CANCEL/PF12 after a SAVE (editor closed, member changed). Instruction says PF3; any exit passes.
- V5 Challenge: no `challenge`; the last step validator is the state check of V4: passes on the first action after any earlier completed run (HELLO still has IEBGENER and no editor open) - but `startingState.resetMembers` runs only in Learn/Practice start (TutorialProvider.startLesson); Challenge reached via `setMode` keeps the existing catalog (setMode only restarts the runner, TutorialProvider.tsx:148-155). A catalog left by a previous run with IEBGENER makes the Challenge trivial.
- V6 Scenario isolation: reset HELLO at start ✓, but the edited HELLO persists after the lesson (store.ts:55-68) and is the source for L13's copy. Not harmful.

**Verified reference IDs and exact topics**
- EM SC19-3621-70 "Ending an edit session" printed p.11; "Edit profile modes" p.20; "Edit mode defaults" p.21 (OWN-READ). "SAVE - Save the Current Data" p.276; "CANCEL" p.201-202 (EV-A §2).
- EM "Edit entry panel fields" - Confirm Cancel/Move/Replace, pending data changes (OWN-READ printed p.6-7).
- UG1 "Function keys" p.24 (EV-A §5).
- EV-A §4 "MODIFIED on status line".

**Confirmed deviations**
1. MODIFIED indicator is not an ISPF Edit feature (sim UI / lesson).
2. "AUTOSAVE ON default on most systems" unverifiable; IBM says the default comes from the site configuration.
3. CAPS default OFF vs data-driven; lowercase JCL accepted by the lesson.

**Recommended correction (minimum viable)**
- module3.ts:57,71 -> remove "MODIFIED flag" wording or label it "the lab's MODIFIED marker (not part of ISPF)". Same for StatusLine (add a tooltip "trainer aid").
- module3.ts:86 -> "AUTOSAVE ON (typical; set in the edit profile)".
- Validator: require the STEP1 record: `editorHasLine(t => /^\/\/STEP1\s+EXEC\s+PGM=IEBGENER\b/.test(t))` (case-sensitive) so lowercase fails; or set `caps:true` for JCL profile.
- Step 1 hint: replace "PF3 to the Primary Option Menu" with "=2".

**Priority and severity:** P2 / Medium.

**Evidence and rationale:** StatusLine.tsx:24; profile.ts:31; editor.ts:373-381; module3.ts:57-91; OWN-READ EM p.6-7, 11, 20-21; EV-A §4.

---

### Lesson 9 - l09-line-commands

**Module and title:** Module 3 "The editor" - "Line commands"

**Learning objectives (from code):** Insert a comment record, delete a record, repeat a record, save. Teaches: prefix area; I/In; D/Dn/DD...DD; R; unused inserted lines disappear (module3.ts:99-100).

**Source files:** module3.ts:93-144; src/editor/lineCommands.ts:46-114,186-243; src/editor/lineOps.ts:14-30,107-111; src/engine/screens/editor.ts:160-169 (`typedPrefix`),264-343; seed.ts:70-76; tests/tutorial/lessons.test.ts:112-131.

**Technical accuracy status:** VERIFIED WITH LIMITATIONS plus confirmed assessment/design defects -> **CORRECTION REQUIRED**

**Educational quality findings**
- E1 (module3.ts:112) "Line commands are typed over the line number. ISPF strips the leftover digits, so I00001 is read as I. I3 would insert three lines." VERIFIED WITH LIMITATIONS: IBM says "you need to type over only the first 1 or 2 characters of the line number"; if the typed character equals the original digit at that position the command is ambiguous and "the ISPF editor assumes that you have not typed a number" (R31700 example; fix: cursor after R3, blanks, or Erase EOF); typing over the last character with the same value is ignored (OWN-READ EM "Rules for entering line commands" printed p.135-136; EV-A §3 row). The sim's `typedPrefix` strips an unchanged tail, which reproduces that rule. "I3 would insert three lines" is correct in the normal case (3 differs from the original digit) and wrong in the equal-digit case, which the lesson does not mention (e.g. typing I3 over line 000003... ). Limitation only.
- E2 (module3.ts:118-119) "If you press Enter before typing, the empty inserted line vanishes - that is normal ISPF." supported: "if you do not type any information, the space for the new line is automatically deleted the next time you press Enter" (OWN-READ EM "I - Insert Lines" printed p.161-162). Detail not modelled: "if you type any information, even a blank character, the line becomes part of the data" (sim prunes a blank-typed line, lineOps.ts:108-111).
- E3 (module3.ts:126) "D deletes one record; D2 deletes two; DD on the first and DD on the last record deletes a whole block." supported (EM "D - Delete Lines" p.156; EV-A §3).
- E4 (module3.ts:133) "R duplicates a record right below itself. R5 makes five copies" supported (EM "R - Repeat Lines" p.175; EV-A §3).
- E5 (confirmed design defect) Step 4 has the learner delete the `//             NOTIFY=&SYSUID` record. The JOB statement line above ends with a comma (seed.ts:72), so deleting the continuation leaves a JOB statement that ends in a comma followed by `//STEP1 ...`, which is not a continuation: IBM IEFC621I "EXPECTED CONTINUATION NOT RECEIVED" (EV-B §1.4: "found a comma at the end of the last operand ... but the next line was not a continuation"; continuation rules p.16-17). Step 6 then saves it, leaving HELLO as a JCL-error member. No IBM fact is violated, but the lesson trains deletion of the very record that keeps the JOB card valid.
- E6 The comment-record exercise never checks the record sits in the JCL stream properly; fine.

**Simulator fidelity findings**
- F1 `I` inserts after the line; `I` on Top of Data line is IBM-allowed (EM p.136) - sim has no prefix field on the Top-of-Data line (editor.ts:73-76 plain `dim`), so `I` ahead of the data cannot be typed. Low, not used.
- F2 Sim prunes blank-typed inserted lines (F: lineOps.ts:108-111) vs IBM keeps them. Low.
- F3 `typedPrefix` strip behaviour matches EM p.135 as above; the "same value as the line number is ignored" warning (EM p.136) is natural.
- F4 Editor start: lesson begins on DSLIST_SEARCH with empty stack; the hints "Option 2 with {HLQ}.JCL(HELLO)" (module3.ts:106) fail on that screen (Option accepts only blank/V; `2` -> `OPTION NOT SUPPORTED`, dslistSearch.ts:54, counted as a mistake). `=2` or RETURN works.

**Validation and assessment findings**
- V1 (confirmed) Step 4 `EDITOR_LINE_DELETED` fires for any D/Dn/DD of any record (lineCommands.ts:203-206); deleting the HELLO job card or STEP1 passes. Step 5 `EDITOR_LINE_REPEATED` passes for R on any record, not the comment line (instruction says comment). Seed claim "any D / any R passes" confirmed.
- V2 (confirmed dead end) Step 6 `savedMember(HELLO)` is an event check (MEMBER_SAVED). If the learner already typed SAVE earlier (e.g. after step 5, as taught in L8), the editor is not dirty and PF3 emits no MEMBER_SAVED (editor.ts:373-380 pops silently), so step 6 can never pass unless another change is made. The instruction "Press PF3 to save and end" assumes unsaved state.
- V3 Step 3 `editorHasLine(/^\/\/\*.*COMMENT/i)`: passes for any line matching, state-only.
- V4 Challenge: no `challenge`; last-step event validator MEMBER_SAVED for HELLO: any save of HELLO in any way (without insert/delete/repeat) completes it (trivial). Opening HELLO, typing a space and saving passes.
- V5 Scenario isolation: HELLO reset at start ✓ (module3.ts:101); broken HELLO persists afterwards (E5). L13 copies it; L15, L24 reset HELLO (module6.ts:16, module9-10.ts:125). L25 has no reset (relies on L24) - cross-lesson note.

**Verified reference IDs and exact topics**
- EM SC19-3621-70 "Rules for entering line commands" printed p.135-136; "I - Insert Lines" p.161-162 (OWN-READ); "D" p.156; "R" p.175 (EV-A §3).
- EV-B "Null Statement" and "Continuation" topics (MVS JCL Reference SA23-1385-70 book p.16-17, p.459; IEFC621I p.543-544) (EV-B §1.4).

**Confirmed deviations**
1. "I3" claim lacks the equal-digit ambiguity rule (EM p.135) - lesson simplification, undisclosed.
2. Blank-typed inserted lines are kept by IBM, pruned by sim.
3. The lesson's own sample edit breaks the JOB statement (no IBM deviation, but poor example).

**Recommended correction (minimum viable)**
- Step 4: target a harmless record (e.g. delete the `//*` comment or a blank STEP) instead of NOTIFY, or insert a NOTIFY record first. Validator: `EDITOR_LINE_DELETED` plus `!editorHasLine(/NOTIFY/)`.
- Step 6: validate by state: `memberSatisfies(HELLO, r => r.some(t => /MY FIRST COMMENT/.test(t)) && editorClosed)`; accept SAVE or PF3.
- Step 5: require count of comment lines >= 2.
- module3.ts:112 add "(if the digit you type equals the digit that was there, ISPF can't tell - type a different count or erase to end of field)".

**Priority and severity:** P2 / Medium (replay/dead-end if SAVE already done; harmful example; weak validators).

**Evidence and rationale:** lineCommands.ts:203-206; editor.ts:373-380; seed.ts:72-73; module3.ts:112-141; OWN-READ EM p.135-136, 161-162; EV-B §1.4.

---

### Lesson 10 - l10-copy-move

**Module and title:** Module 3 "The editor" - "Copy and move"

**Learning objectives (from code):** In `{HLQ}.JCL(SORTJOB)`: copy after (C+A), copy before (C+B), move a block (MM...MM + A), then CANCEL. Teaches: C/M sources, A/B destinations, block forms, pending commands and RESET (module3.ts:152-153).

**Source files:** module3.ts:146-192; src/editor/lineCommands.ts:14-114,162-182; src/editor/lineOps.ts:42-60; src/parsers/editorLineCommand.ts (not read in full); src/engine/screens/editor.ts:311-312,388-392; seed.ts:106-117; tests (no dedicated L10 test; lessons.test.ts has no l10).

**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- E1 (confirmed, module3.ts:165) "You can type both before pressing Enter, or press Enter after the C - it stays pending (shown in the prefix area) until you supply A or B." IBM: "If you press Enter before specifying where you want the data to go, the editor displays a MOVE/COPY pending message at the top of the panel. The line is not copied until you specify a destination" and during pending mode FIND/LOCATE are allowed but CHANGE is not (OWN-READ EM A p.147-148, C p.154, M p.167). The "shown in the prefix area" detail is not in the pages read -> INSUFFICIENT EVIDENCE.
- E2 (confirmed, module3.ts:179) "If you get MOVE/COPY IS PENDING, you still need the A or B." The sim shows `DESTINATION REQUIRED` for C/M without A/B (lineCommands.ts:85-86) and `MOVE/COPY IS PENDING` in the reverse case (A/B without a source, lineCommands.ts:87-89). IBM wording is "MOVE/COPY pending" and it is the message for the missing destination case (EM p.147). Lesson/sim text mismatch plus both differ from IBM. docs/04 documents the sim messages as given.
- E3 (module3.ts:178) "Move the two-record block ... to the end ... A on the /* record": the A is typed on the `/*` record, which is not the end (a null `//` follows, seed.ts:115-116) and places the in-stream data after the delimiter - a nonsensical JCL result (EV-B §1.4 on in-stream delimiters/null statement). The text "to the end" contradicts the instruction (confirmed; the member is then CANCELled so no persistence).
- E4 "MM...MM marks a block; M alone moves one line. Move removes the source." supported (EM M p.166-168; EV-A §3 "C/CC, M/MM, A, B, O").
- E5 "CANCEL (or PF12) discards everything since the last SAVE." supported (EM CANCEL p.201-202 attention note; EV-A §2).
- E6 "Pending commands and RESET": RESET COMMAND "removes any pending line commands" and RESET with no operand processes all operands except LABEL (OWN-READ EM RESET printed p.273-275; EV-A §2 RESET row); the lesson explanation for L11 says RESET clears "messages" - IBM lists CHANGE/ERROR flags and HIDE messages, not general messages.
- E7 O (overlay) destination not taught; fine.

**Simulator fidelity findings**
- F1 (confirmed) `DESTINATION REQUIRED` and `MOVE/COPY IS PENDING` texts differ from IBM "MOVE/COPY pending" (EM p.147,154,167). Sim does not restrict CHANGE during pending mode (EM p.154: "you cannot use a CHANGE command to change data until after the copy completes"). Low.
- F2 The pending command is retained in the prefix and redisplayed (editor.ts:77,98) - behaviour of the IBM display not verified.
- F3 Hint text "Option 2 with {HLQ}.JCL(SORTJOB)" (module3.ts:159) unusable from DSLIST_SEARCH (same as L9 F4).
- F4 CC/MM pairing is stricter than IBM (docs/04 deviation acknowledged).

**Validation and assessment findings**
- V1 Step 2 `EDITOR_LINES_COPIED dest "A"`, step 3 `dest "B"`, step 4 `EDITOR_LINES_MOVED` (any move, M or MM): the specific records named in the instruction (//SYSOUT, //SORTOUT, //SORTIN, //SORT, SYSIN block, /*) are not checked; any C+A/C+B/M+A passes (false positive; Medium-Low).
- V2 (confirmed) Step 5 `EDIT_CANCELLED` default. Challenge default = the same validator: Challenge completes on the first CANCEL/PF12 in any edit session, on any member, with no copying or moving (also via END with AUTOSAVE OFF NOPROMPT, editor.ts:378). Trivial. Seed claim confirmed.
- V3 Rejected valid alternative: step 2 accepts both single C and CC; step 4 accepts M or MM, fine. `O`-overlay not accepted as destination; fine.
- V4 Scenario isolation: SORTJOB reset at start ✓; the lesson ends with CANCEL so nothing persists ✓. If the learner SAVEs instead (not instructed), the scrambled SORTJOB persists until the next L10 start (reset). L22/L26 use SORTJOB later (module9-10) - L26 TSO SUBMIT SORTJOB depends on its state; no reset there (cross-lesson note).

**Verified reference IDs and exact topics**
- EM SC19-3621-70 "A, AK - Specify an After destination" printed p.146-148; "B, BK" p.149; "C - Copy Lines" p.153-155; "M - Move Lines" p.166-168; all state the MOVE/COPY pending message (OWN-READ lines for p.147, p.154, p.167).
- EM "RESET - Reset the Data Display" printed p.273-275 (OWN-READ); "CANCEL" p.201-202 (EV-A §2).
- EV-A §3 "C/CC, M/MM, A, B, O" (destination required except empty data set).

**Confirmed deviations**
1. Pending message wording (sim and lesson) vs IBM "MOVE/COPY pending"; lesson attributes the sim's reverse-case message to the missing-destination case.
2. "to the end" instruction versus the recommended A on `/*`.
3. Challenge/validators do not assess the objective.

**Recommended correction (minimum viable)**
- Lesson text: module3.ts:179 -> "If you see MOVE/COPY pending, you still need the A or B" and align the sim message for C/M-without-destination to `MOVE/COPY pending`; keep `DESTINATION REQUIRED` only if documented as a deviation.
- Step 4: instruct "A on the //SORTOUT record" (or drop "to the end").
- Validators: check records after the operation (e.g. `editorHasLine` order checks via a `editorLinesMatch` validator), and a Challenge that checks the buffer (`copied //SYSOUT after //SORTOUT` etc.) rather than only EDIT_CANCELLED.

**Priority and severity:** P2 / Medium (Challenge trivial; message mismatch).

**Evidence and rationale:** lineCommands.ts:81-96; module3.ts:165,179; OWN-READ EM p.147,154,167,273-275; engine.ts:42; editor.ts:378.

---

### Lesson 11 - l11-find-change

**Module and title:** Module 3 "The editor" - "FIND and CHANGE"

**Learning objectives (from code):** In `{HLQ}.COBOL(CUSTOMER)`: FIND a string, repeat with PF5, CHANGE ALL, exclude lines, save. Teaches: FIND/RFIND (PF5), CHANGE/RCHANGE (PF6), CHANGE ... ALL, EXCLUDE and RESET (module3.ts:200-201).

**Source files:** module3.ts:194-247; src/editor/primaryCommands.ts:99-110,194-320; src/parsers/editorPrimaryCommand.ts (not read in full); src/engine/screens/editor.ts:264-343,373-381; validators.ts:30-33,80-88; seed.ts:129-141; tests (lessons.test.ts has no l11 test).

**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- E1 (confirmed, module3.ts:213) "Quotes are needed only when the string contains blanks: FIND 'WS CUST'." IBM: delimiters are required "if a string contains embedded blanks or commas, or if a string is the same as a command or keyword"; a simple string has no leading/trailing quote and no embedded blanks, commas or asterisks (OWN-READ/EV-A §2 FIND/CHANGE quoting, EM printed p.44-46). Partial claim; explain.ts:240 repeats it for CHANGE ("Quote strings containing blanks").
- E2 (confirmed, module3.ts:228) "The message tells you how many changed." IBM: after CHANGE ALL the short message reads `CHARS 'MIMIC' changed` and the number of occurrences is in the long message shown with HELP (OWN-READ EM Figure 14 printed p.57; "ALL" operand, p.53). Lesson and sim (`N CHARS 'x' CHANGED TO 'y'`, primaryCommands.ts:306) put the count in the short message. For FIND ALL IBM shows `21 CHARS 'MIMIC'` (count + CHARS, Figure 12, p.56), not `N CHARS 'x' FOUND`.
- E3 (confirmed, silent hazard) `CHANGE WS-CUST WS-CLIENT ALL` also rewrites `WS-CUSTOMER` (seed.ts:134) to `WS-CLIENTOMER`, because CHARS (default) matches "anywhere the characters match" (OWN-READ EM printed p.53-54: CHARS default; WORD/PREFIX/SUFFIX exist). The lesson's validator only looks for `WS-CLIENT-ID`, saves the damaged member via PF3 (step 6) and never mentions WORD. The saved member is restored at the next lesson start (resetMembers, module3.ts:202).
- E4 (module3.ts:220-221) "PF5 is RFIND ... PF6 is RCHANGE." supported (EM Figures 11-16 key legend F5=Rfind F6=Rchange, printed p.55-57).
- E5 (confirmed unverified detail) `*BOTTOM OF DATA REACHED*` (module3.ts:220,223): IBM gives "BOTTOM OF DATA REACHED" for repeated FIND/CHANGE/EXCLUDE via RFIND/RCHANGE and says entering RFIND again "continue[s] the search by wrapping to the top" (OWN-READ EM printed p.52). Presence of the asterisks is INSUFFICIENT EVIDENCE (extracted text drops decoration). The sim does not wrap on a second RFIND (primaryCommands.ts:251-254); the lesson stops at the message so the omission is not visible.
- E6 "FIND is case-insensitive by default" supported (EV-A §2: simple and delimited strings are case-insensitive even with caps off).
- E7 Step 5 "Excluded lines collapse into a dashed marker ... RESET clears exclusions, pending line commands and messages" supported in part (EM RESET p.273-275: EXCLUDED, COMMAND, CHANGE flags, SPECIAL); "messages" is imprecise.
- E8 Step 5 `X DISPLAY ALL` uses `X` as an EXCLUDE alias: supported (EV-A §2 EXCLUDE aliases EXC, EX, X).

**Simulator fidelity findings**
- F1 No `==CHG>` flags after CHANGE (grep finds none in src/); IBM marks every changed line with ==CHG> until RESET (EM Figure 14, p.57). So the lesson's RESET step does not show the realistic clean-up; undisclosed.
- F2 FIND ALL / CHANGE ALL short-message wording (see E2). No `HELP` long-message mechanism.
- F3 Wrap-around on repeated RFIND not implemented (E5).
- F4 FIND with the cursor: sim ignores the IBM rule that NEXT starts at the cursor/top (EM p.52-53); Low.
- F5 Start state PRIMARY_OPTION_MENU; hint "Option 2" valid here ✓.

**Validation and assessment findings**
- V1 (confirmed) Step 2 `EDITOR_FIND` is emitted even when the string is not found (primaryCommands.ts:250-255 returns `events` before the message), so `FIND ZZZ` passes step 2 (and costs a mistake).
- V2 (confirmed) Step 3 requires the exact message text hard-wired in the validator (module3.ts:223); the sim emits it only when the string exists after the cursor (primaryCommands.ts:252-253). A learner who runs `FIND CUST ALL` then PF5 gets that message at once; if the learner repositions the cursor beyond the last hit the message appears immediately; fine.
- V3 Step 4 `editorHasLine(/WS-CLIENT-ID/)` state-only: passes with `CHANGE`-less manual typing of WS-CLIENT-ID; accepted alternatives: `C WS-CUST WS-CLIENT ALL` ✓ (abbreviation). Rejected: none.
- V4 (confirmed auto-pass) Step 5 `anyOf(EDITOR_LINES_EXCLUDED, editorLineCount(n>0))` (module3.ts:238): `editorLineCount(n>0)` is true whenever the editor has any lines, so step 5 passes in the same batch as step 4 and the learner never sees the exclude instruction. Seed claim confirmed. The lesson's learning objective (EXCLUDE/RESET) is unassessed.
- V5 (confirmed dead end) Step 6 `savedMember` is an event check; if the learner SAVEd after the CHANGE, PF3 does not emit MEMBER_SAVED and step 6 never passes (same as L9 V2).
- V6 Challenge: no `challenge`; last-step validator = MEMBER_SAVED for CUSTOMER -> any save of CUSTOMER (open, type a space, SAVE) completes it. Trivial.
- V7 Scenario isolation: CUSTOMER reset at start ✓; the saved damaged member (E3) persists until next L11 start. L18/L21 use COBOL(HELLO) (not CUSTOMER).

**Verified reference IDs and exact topics**
- EM SC19-3621-70 "Finding, seeking, changing, and excluding data" printed p.44-57 incl. CHARS/WORD (p.53-54), RFIND/RCHANGE wrap-around and BOTTOM OF DATA REACHED (p.52), Figures 11-16 (p.55-57) (OWN-READ); "FIND" p.232; "CHANGE" p.203-206 (EV-A §2).
- EM "RESET" printed p.273-275 (OWN-READ); "EXCLUDE" p.230 (EV-A §2).
- OWN-READ EM p.48 `CHARS X'0275' FOUND` (message format "CHARS ... FOUND").

**Confirmed deviations**
1. Quoting rule incomplete (blanks only vs blanks/commas/keywords).
2. Count location in message (sim/lesson: short; IBM: long message via HELP).
3. No ==CHG> flags; no wrap on second RFIND.
4. Hazard of CHARS substring matching not disclosed; validators accept the damaged result.

**Recommended correction (minimum viable)**
- module3.ts:213 -> "Quotes are required when the string has blanks or commas or looks like a keyword."
- module3.ts:228 -> "The message tells you the string was changed (HELP shows how many)." and change the sim short message to `CHARS 'x' changed`.
- Step 4: use `CHANGE WS-CUST WS-CLIENT ALL WORD` (needs sim WORD support) or use a string that is unique (e.g. `CUST-ID` -> `CLIENT-ID`), and mention `WORD`.
- Step 5 validator: `eventIs("EDITOR_LINES_EXCLUDED")` only, then a `LINES_REDISPLAYED` for RESET.
- Step 6: state-based (`memberSatisfies(CUSTOMER, ...WS-CLIENT-ID...)` plus `editorClosed`).

**Priority and severity:** P2 / Medium.

**Evidence and rationale:** primaryCommands.ts:250-255,296-319; module3.ts:213,223,228,238; OWN-READ EM p.44-57; EV-A §2.

---

### Lesson 12 - l12-managing-members

**Module and title:** Module 4 "Managing members and data sets" - "Managing members"

**Learning objectives (from code):** In `{HLQ}.REXX` create member SCRATCH, rename it to DRAFT, delete it. Teaches: creating a member via Edit, member statistics, R rename with confirmation panel, D delete with confirmation (module4.ts:14-15).

**Source files:** module4.ts:8-55; src/engine/screens/memberList.ts:37-215; src/engine/screens/dialogs.ts:14-122; src/engine/open.ts:21-60; src/engine/screens/editor.ts:373-381 (END of a new member); src/catalog/catalog.ts:161-220; validators.ts:52-73; seed.ts:143-158; tests (no L12 test).

**Technical accuracy status:** CORRECTION REQUIRED (confirmed lesson/sim inconsistency and replay dead ends; several claims unsourced)

**Educational quality findings**
- E1 (confirmed, module4.ts:27) "Editing a member that does not exist creates it - but only on SAVE. Until then it lives only in the editor." The sim also creates it on PF3: `endSession` saves when `s.dirty || s.isNew` (editor.ts:375-377), so an untouched new member is written by END with AUTOSAVE ON. The lesson text and the sim disagree. IBM: "If the editor does not find the member in the library, it creates a new member with the specified name" (EV-A §4 Edit entry, EM p.7); END saves "if autosave mode is on and you have made changes to the data" (OWN-READ EM printed p.11) - an empty untouched new member has no changes, so IBM's text suggests nothing is saved on END; IBM is silent on what SAVE of an empty new member does (EV-A §4 "SAVE of an empty new member": UNRESOLVED) -> INSUFFICIENT EVIDENCE for the instructed SAVE-then-PF3 outcome; the sim's PF3-creates-empty-member is unsupported.
- E2 (module4.ts:34-35) "The member is empty and that is fine ... SAVE on a new member writes it to the directory of the PDS." Empty-member save: INSUFFICIENT EVIDENCE (see E1). IBM does say an empty data set/member is shown with quotes in the line command field (OWN-READ EM printed p.12 "line command field contains quotes"); the sim shows no input line at all for an empty member (editor.ts:96-110 loops over zero lines), so a learner cannot type data (low; not part of the lesson).
- E3 (module4.ts:20) "Open the member list ... in edit mode (E on the row)" then use R and D from that list. IBM Table 15: Edit member lists accept S and E only (single selection); "The D, E, P, R, and V line commands are available only for the Library and Data Set List utilities ... For the Data Set List utility, these line commands are valid only after you enter the M line command" (OWN-READ UG1 printed p.81-82, 90-91). The "Enhanced member list for Edit, View, and Browse" DSLIST setting makes E/V/B from 3.4 use the enhanced list (OWN-READ UG2 printed p.134); its default is not in the pages read -> INSUFFICIENT EVIDENCE whether D/R work in an E list on a default real system. VERIFIED WITH LIMITATIONS: the lesson works only if the enhanced list is in effect; safer is `M` (3.4) or 3.1.
- E4 (module4.ts:50) "ISPF confirms deletes when the Confirm Member Delete option is on (it is here)." supported: Confirm Member Delete is an option on 3.4/3.1; "If you select this option, ISPF displays the Confirm Member Delete panel" (OWN-READ UG2 printed p.99, 131). "PF3 on the confirmation cancels" - IBM panel text "Enter END or CANCEL command (PF3) to cancel" is mirrored by the sim (dialogs.ts:44) - panel text not verified -> INSUFFICIENT EVIDENCE.
- E5 (module4.ts:43) "Renaming a member only rewrites the directory entry; the records stay where they are." INSUFFICIENT EVIDENCE (no IBM page in EV-A/EV-C or my reads on rename internals; RB says the directory holds a pointer per member, §5.9.2, which makes it plausible but is not a statement about RENAME).
- E6 (module4.ts:42) R opens a Rename panel for the new name - supported: the new name can be typed in the Prompt field, otherwise the Member Rename panel appears (OWN-READ UG2 "R - rename member" printed p.100).

**Simulator fidelity findings**
- F1 The sim member list allows D/R/C/M/I/G/J in every list mode (memberList.ts:121-160) - see E3; undisclosed. Prompt column is not an input in the sim (no rename-in-Prompt).
- F2 (confirmed) New-member creation on PF3 without SAVE (E1).
- F3 `S newname` is implemented as the SELECT primary command in every mode (memberList.ts:178-181). IBM: the SELECT primary command "even creates a member if you specify the complete member name of a member that does not exist" on a list displayed with the Edit option (OWN-READ UG1 "SELECT primary command" printed p.94) - supported for Edit-mode lists.
- F4 Start state DSLIST_SEARCH with empty stack (L5 F1); `Confirm Member Delete` shown as static text, not a toggle.

**Validation and assessment findings**
- V1 Step 1 `memberListOpen("{HLQ}.REXX")` passes for any list mode (B, V, M, E). A learner who opens the list with B or V then types `S SCRATCH` gets `MEMBER NOT FOUND` (open.ts:36-41: creation only in EDIT) - a soft dead end; E and M modes work (defaultMode maps M to E). Instruction says "in edit mode"; not enforced.
- V2 (confirmed, replay hazard) The lesson creates and deletes members in `{HLQ}.REXX` but `resetMembers` can only restore seed members (TutorialProvider.tsx:48-59). After an interrupted run: leftover SCRATCH is reopened as an existing member (step 2/3 pass trivially); leftover DRAFT makes the step-4 rename fail with `MEMBER ALREADY EXISTS` (catalog.ts:215), a mistake plus a dead end until the learner deletes DRAFT. Seed claim confirmed.
- V3 Step 3 `allOf(memberExists(SCRATCH), memberListOpen)`: passes after PF3 with or without SAVE (E1); the instructed SAVE is optional.
- V4 Step 4 `MEMBER_RENAMED to DRAFT`: accepts any rename to DRAFT (e.g. TEST01 -> DRAFT, destroying a seed member's name; seed TEST01 would become DRAFT). Scenario isolation issue: not checked that the source was SCRATCH.
- V5 Step 5 `allOf(MEMBER_DELETED DRAFT, !memberExists DRAFT)`: event-based; passes only if a delete of DRAFT happens; fine.
- V6 Challenge: no `challenge`; last-step validator is event-based, so Challenge needs a delete of a member named DRAFT; can be satisfied by creating DRAFT directly and deleting it (create/rename not enforced). Not trivial but does not assess the objective chain.

**Verified reference IDs and exact topics**
- UG1 SC19-3627-70 Table 15 "Member Selection List Differences" p.81; "Member selection list commands" p.89-91; "SELECT primary command" p.94 (OWN-READ).
- UG2 SC19-3628-70 "Library utility (option 3.1)" D/R/C line commands p.99-100 (OWN-READ); "Data set list utility (option 3.4)" DSLIST Settings (enhanced member list), Confirm Member Delete p.131, 134 (OWN-READ).
- EM SC19-3621-70 "Ending an edit session" p.11; "Editing the data set" (empty member quotes) p.12 (OWN-READ); Edit entry panel fields p.5-7 (EV-A §4).

**Confirmed deviations**
1. Sim creates an empty new member on PF3; lesson says SAVE only; IBM silent/suggests no save without changes.
2. Sim lets every list mode delete/rename; IBM restricts per list type (unless enhanced list).
3. Replay dead ends on leftovers.

**Recommended correction (minimum viable)**
- Sim: `endSession` should not save an untouched new member (`s.dirty` only); keep SAVE creating it (and mark the empty-save behaviour as a documented simplification, or have the learner type one record first).
- Lesson: use `M` (member list) on the DSLIST row for rename/delete steps ("E" for creating via `S SCRATCH`), or add a note about the enhanced member list setting.
- Add a `resetDatasetMembers` capability (delete named members) to `LessonStart` and call it for SCRATCH and DRAFT; validator step 4: `e.from === "SCRATCH" && e.to === "DRAFT"`.

**Priority and severity:** P2 / Medium.

**Evidence and rationale:** editor.ts:373-381; open.ts:36-41; memberList.ts:121-160; catalog.ts:205-220; module4.ts:20-50; OWN-READ UG1 p.81-94, UG2 p.99-100,131,134, EM p.11.

---

### Lesson 13 - l13-copy-across

**Module and title:** Module 4 "Managing members and data sets" - "Copying across data sets"

**Learning objectives (from code):** Copy `{HLQ}.JCL(HELLO)` into `{HLQ}.TEST.JCL` two ways, then delete `{HLQ}.TEST.JCL` with 3.2. Teaches: 3.3 Move/Copy, member-list C with a target data set, 3.2 D delete with confirmation, allocation prerequisite (module4.ts:63-64).

**Source files:** module4.ts:57-95; src/engine/screens/moveCopy.ts:13-103; src/engine/screens/dialogs.ts:124-169; src/catalog/catalog.ts:134-140,223-256; src/engine/screens/datasetPanels.ts:122-153; validators.ts:30-38,75-78; engine.ts:34-73.

**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- E1 (confirmed, module4.ts:76) "3.3 copies a member (or a whole sequential data set) into another data set. The member keeps its name unless you write a new one in parentheses on the To line." Partly supported: Option C copies a DASD sequential or partitioned data set/members; the member keeps its name by default (OWN-READ UG2 "C - copy data set or member(s)" printed p.121). The rename mechanism differs: IBM shows a second "To" panel after Enter (Figure 82, p.122; also UG1 sample steps 12-13: "A panel titled COPY FROM ISP.SISPSAMP(ISRASM) is displayed" then To ISPF Library fields, printed p.11) and, for a single member, a Member field on the "To" panel (UG2 p.120: no Member field when a list or `*` is requested). Whether `DSN(NEWNAME)` on the "To Other ... Data Set Name" line is accepted was not found in the pages read -> INSUFFICIENT EVIDENCE.
- E2 (confirmed) The lesson presents 3.3 as a single panel with From and To (moveCopy.ts:35-55). IBM's real flow has the From panel, then a To panel with Options (Replace like-named members, Process member aliases), Sequential Disposition (Mod/Old), Pack option, SCLM setting (OWN-READ UG2 Figures 81-82, printed p.120, 122). Undisclosed simplification; also the real utility offers to allocate a nonexistent target (UG2 p.120) while the sim fails or, for a whole PDS, creates it.
- E3 (module4.ts:83) "C opens a small panel asking only for the target." IBM: C on a member list displayed from the Library utility opens the Copy Entry panel "where you must specify a partitioned data set and member name for the new member" (OWN-READ UG2 "C - copy member" printed p.99). The sim's pop-up needs only the data set (member name optional, dialogs.ts:150-165). Partly supported; also C is a Library (3.1)/3.4-M list command, not an Edit-list command (UG1 Table 15) - same caveat as L12 E3.
- E4 (module4.ts:90) "Deleting a PDS deletes all of its members at once - there is no recycle bin on z/OS, which is why ISPF asks first." supported in part: IBM DELETE: the catalog entry of a PDS is removed only when the entire PDS is deleted (EV-A §7 DELETE row); 3.2 D asks "Confirm Delete" when the option is selected (EV-A §6; UG2 Figure 68 shows "/ Confirm Data Set Delete" preselected, printed p.101). "no recycle bin" is general knowledge, unsourced (harmless).
- E5 Lesson dependency on L6: instruction "lesson 6 created it; if not, allocate it now" is honest, but the hint only mentions 3.2 A, not that 10 directory blocks are needed for member copies to be meaningful. If the L6 data set was allocated with 0 directory blocks (L6 validator allows it) it is a PS data set and "copy member into it" overwrites the whole data set (catalog.ts:172-175), a different operation from the lesson's description.

**Simulator fidelity findings**
- F1 (confirmed) No "Replace like-named members" option: the sim errors `MEMBER ALREADY EXISTS` when the target member exists (catalog.ts:248-250; moveCopy.ts performCopy passes no replace). IBM: replace is an opt-in on the To panel (UG2 Figure 82, p.122). Sim lacks the toggle, so re-copying is impossible without deleting the target member first.
- F2 For a PS target the sim silently overwrites; IBM asks for Sequential Disposition Mod/Old (p.122). Low.
- F3 Single-panel 3.3 vs IBM two-panel flow (E2). Docs/03 note not re-verified.
- F4 Member list `C` opens a pop-up even for Edit/Browse/View lists (memberList.ts:136-138); IBM: only Library/DSLIST-M lists (E3).

**Validation and assessment findings**
- V1 (confirmed) Step 2 accepts any `MEMBER_COPIED` into TEST.JCL (`e.to.dsn`), including a member other than HELLO (from the member list) and either method; step 3 accepts COPYJOB copied by any method, including 3.3. The "two ways" objective is therefore not assessed. Seed claim "any MEMBER_COPIED passes" confirmed (step 2).
- V2 (confirmed dead end) Replay after an interrupted run: HELLO (or COPYJOB) already exists in TEST.JCL, F1 blocks the copy (`MEMBER ALREADY EXISTS`, mistake), and the only way forward is to delete the member (via a TEST.JCL member list) or the data set. TEST.JCL also persists from L6.
- V3 (confirmed) Step 1 `allOf(datasetExists(TEST.JCL), onScreen(MOVE_COPY))`: fine; state-based.
- V4 (confirmed) Step 4 `anyOf(DATASET_DELETED event, !datasetExists)` second branch is state-only: true whenever TEST.JCL is absent. Within the lesson the data set exists at that point, so it is fine in Learn mode, but see V5.
- V5 (confirmed) Challenge: no `challenge`; the last-step validator (V4) completes the Challenge on the first action whenever `{HLQ}.TEST.JCL` does not exist (a fresh learner who skipped L6, or anyone after a prior L13). If it exists, deleting it (3.2 D) alone completes the Challenge: no copy is required. Seed claim "Challenge default 'TEST.JCL doesn't exist' trivial" confirmed.
- V6 Scenario isolation: no resetMembers; copies the L8/L9-edited HELLO (module3.ts L8/L9 leave HELLO changed) and a possibly L14-edited COPYJOB. Not harmful but not "known data".

**Verified reference IDs and exact topics**
- UG2 SC19-3628-70 "Move/Copy utility (option 3.3)" printed p.119-122, Figures 81-82 (OWN-READ); "C - copy member" p.99 (OWN-READ); Library utility member list (EV-A §6).
- UG1 "Running a sample ISPF session" steps 11-14, printed p.11 (OWN-READ).
- TSOCR "DELETE command" p.71-74 (EV-A §7).

**Confirmed deviations**
1. Single-panel 3.3 vs two-panel; no replace/disposition options (undisclosed).
2. Rename-on-copy mechanism uncertain/different.
3. Replay and Challenge defects.

**Recommended correction (minimum viable)**
- Sim: add `Replace like-named members` toggle to the 3.3/Copy Entry panels or have the lesson reset the target (delete TEST.JCL members) at start; `resetMembers` equivalent to delete members of TEST.JCL.
- module4.ts:76 -> "The member keeps its name unless you give a new member name on the target panel."
- Validators: step 2 `from.member==="HELLO" && viaOption 3.3` using `OPTION_SELECTED 3.3` flags, step 3 from the member list (`COMMAND_ENTERED screen MEMBER_LIST`).
- Challenge: `challenge: { validator: allOf(members HELLO, COPYJOB seen via events..., datasetExists false) }` or require both MEMBER_COPIED events plus DATASET_DELETED.

**Priority and severity:** P1 / High (trivial Challenge, replay dead end, objective unassessed).

**Evidence and rationale:** module4.ts:69-92; catalog.ts:240-250; moveCopy.ts:80-103; engine.ts:41-46; OWN-READ UG2 p.99,119-122, UG1 p.11.

---

### Lesson 14 - l14-final-challenge

> **M0 review note (C6):** finding V1 (placement of `//STEP2` accepted after the null statement or in other positions) is **withdrawn as a defect**: the lesson objective says "anywhere in the member is accepted", so the leniency is disclosed. Downgraded to P3 (optional tightening). The stale-state completion after Learn → Challenge (V3) stands as a code-read finding. The status stays CORRECTION REQUIRED on V3 and F2/V2 alone.

**Module and title:** Module 5 "Capstone" - "Final navigation challenge"

**Learning objectives (from code):** Locate `{HLQ}.JCL(COPYJOB)`, add `//STEP2   EXEC PGM=IEFBR14` as a new record after the `//COPY` step ("anywhere in the member is accepted"), and save (module5.ts:17). Teaches: independent navigation, editing and saving without prompts.

**Source files:** module5.ts:7-32; validators.ts:63-68; seed.ts:77-91; engine.ts:41-46; TutorialProvider.tsx:104-111,148-155; tests/tutorial/lessons.test.ts:133-147.

**Technical accuracy status:** CORRECTION REQUIRED (validator accepts JCL that z/OS would not run as intended)

**Educational quality findings**
- E1 (confirmed) The objective text says to add the step "after the //COPY step" yet "anywhere in the member is accepted" (module5.ts:17); the placement most readers choose (immediately below `//COPY EXEC PGM=IEBGENER`) puts STEP2 between the EXEC and its DD statements, so the SYSPRINT/SYSIN/SYSUT1/SYSUT2 DDs would belong to the IEFBR14 step and the IEBGENER step would have none. The correct placement is after the last DD continuation record and before the null `//` (seed.ts:86-90). The lesson does not teach or check this JCL structure.
- E2 No explanations: the lesson is a no-guidance capstone by design (docs/05); acceptable.
- E3 `IEFBR14` as a do-nothing program: supported (EV-B "IEFBR14" row, MVS JCL User's Guide SA23-1386-70 p.32-33: "IEFBR14 is the name of a program within your MVS system. It does not actually process any data").

**Simulator fidelity findings**
- F1 Start state PRIMARY_OPTION_MENU ✓ (not DSLIST), hint "I line command, overtyping, SAVE or PF3" valid.
- F2 CAPS OFF default (L8 F1): a lowercase `//step2 exec pgm=iefbr14` is stored lowercase and accepted (regex `/i`); z/OS JCL requires uppercase (EV-B §1; JCL syntax) while real ISPF with CAPS ON would uppercase JCL typed into a member without lowercase (OWN-READ EM p.20). Sim/validator accept the lowercase statement.

**Validation and assessment findings**
- V1 (confirmed) `REQUIRED = /^\/\/STEP2\s+EXEC\s+PGM=IEFBR14/i` tested with `records.some(r => REQUIRED.test(r))` on the saved catalog member (module5.ts:7-9). It therefore accepts (a) the record after the null `//` terminator, where z/OS "ignores statements between a null statement and the next valid JOB statement" (EV-B §1.4, MVS JCL Reference "Null Statement" p.459/505), (b) a record overtyped onto a continuation line or the comment lines, (c) a record in place of the JOB statement, (d) lowercase, (e) trailing garbage because there is no word boundary (`PGM=IEFBR14XYZ`), and (f) the case where the learner deletes the rest of the member. Seed claim confirmed: accepts STEP2 anywhere including after the null statement or mid-continuation. Rejected valid alternatives: `//STEP2 EXEC PGM=IEFBR14,PARM=...`? passes; `//STEP2  EXEC  PGM=IEFBR14` passes; a step coded with `EXEC PGM=IEFBR14` on a continuation line (`//STEP2 EXEC\n// PGM=IEFBR14`) is rejected (valid JCL), Low.
- V2 The original content is not checked: nothing requires that the COPY step, JOB statement or `//` survive the edit.
- V3 (confirmed) Challenge uses `challenge.validator = finalCheck` (state-only). It fires on every dispatch. If `{HLQ}.JCL(COPYJOB)` already contains a STEP2 (e.g. left by a Learn run: the same catalog), switching to Challenge via `setMode` keeps the catalog (TutorialProvider.tsx:148-155 restarts only the runner) and completes the Challenge on the first action. `startLesson` does reset COPYJOB, so starting the lesson in Challenge mode from the lesson list is not trivial.
- V4 tests/tutorial/lessons.test.ts:133-147 covers the happy path (insert at line 6 of COPYJOB, SAVE) and "not complete before save"; no negative placement tests.
- V5 Scenario isolation: COPYJOB reset at start ✓; the saved STEP2 persists and is the source of L13's COPYJOB copy only if L14 precedes L13 (not the order).

**Verified reference IDs and exact topics**
- MVS JCL Reference SA23-1385-70 "Null Statement" (book p.459, PDF p.505) and Columns/Continuation (p.14-17) (EV-B §1.4).
- MVS JCL User's Guide SA23-1386-70 IEFBR14 (p.32-33) (EV-B).
- EM SC19-3621-70 "Edit profile modes" p.20 (CAPS) (OWN-READ).

**Confirmed deviations**
1. Validator accepts positions/forms that the real system ignores or rejects (null statement, continuation, case).
2. Objective text ("after the //COPY step") vs structure of the seed member.

**Recommended correction (minimum viable)**
- Replace `finalCheck` with a structural check: records must still start with the JOB statement, contain the original `//COPY` EXEC and its DD block in order, then `^//STEP2\s+EXEC\s+PGM=IEFBR14\b` (case-sensitive) appearing after the last record of the COPY step and before `^//\s*$`, and not on a continuation line.
- Reword the objective: "add it as a new step after the COPY step's last DD, before the final //".

**Priority and severity:** P2 / Medium (assessment accepts invalid JCL).

**Evidence and rationale:** module5.ts:7-9,17; seed.ts:77-91; EV-B §1.4; engine.ts:41-46.

---


## 5. Lessons 15 to 21

### Lesson 15 - l15-split-screen

| Field | Content |
|---|---|
| Lesson number and ID | 15 - `l15-split-screen` |
| Module and title | Module 6 "Split screen" - "Working in two screens" |
| Learning objectives (from code) | Edit {HLQ}.JCL(HELLO) in screen 1, view {HLQ}.JCL(COPYJOB) in screen 2, swap, end screen 2. teaches: PF2 = SPLIT; PF9 = SWAP; each screen has own stack/editor; PF3 on a screen's POM ends that screen; the SWAPBAR row (module6.ts:14-15). |
| Source files | src/tutorial/lessons/module6.ts:8-60; src/tutorial/explain.ts:243-256 (SPLIT, SWAP glossary); src/engine/splitScreen.ts:11,66-113; src/engine/screens/primaryMenu.ts:77-79,100-108; src/engine/reducer.ts:52-54; src/state/TutorialProvider.tsx:95-120; tests/tutorial/lessons.test.ts:149-171; docs/03-ispf-behaviour-reference.md:137-148 |
| Technical accuracy status | **CORRECTION REQUIRED** |

#### Educational quality findings
- Good arc (edit in 1, reference in 2, swap, end) and the "reference member in second screen" rationale is sound practice. (Judgement, no IBM claim.)
- Step 2 explanation: "ISPF supports up to 8 logical screens" (module6.ts:28) and glossary analogy "there are never more than eight" (explain.ts:247). Stated as an absolute; it is only the shipped default (see below).
- Step 3 says "open COPYJOB read-only: option 1 (View) ... or ... Browse". View is an edit-type session (EM "Ending an edit session", p.12: "VIEW is a special type of edit session"); the glossary itself says View is editable (explain.ts:178). Calling View "read-only" is loose wording. IBM page defining View's save rules was not read: INSUFFICIENT EVIDENCE for the exact View save behaviour.
- The lesson teaches "the SWAPBAR row" but never the `SWAPBAR` command that makes it appear on a real system (see fidelity).
- Step 4 explanation "SWAP 2 or SWAP LIST on any command line target a specific one" is correct as syntax (UG1 p.51); in ISPF `SWAP LIST` opens the ISPF Task List panel, not a one-line message.

#### Simulator fidelity findings
1. **Screen limit**: MAX_SCREENS = 8 hard-coded (splitScreen.ts:11) and message "ISPF allows 8 logical screens" (splitScreen.ts:69). IBM: "The maximum number ... depends on MAXIMUM_NUMBER_OF_SPLIT_SCREENS ... ISPF ships with a default figure of 8. Support for up to 32 split screens is available for all terminal types except the 3290" (UG1 "Splitting the screen horizontally or vertically", p.29; EV-A §5 row SPLIT/SWAP/START = PARTIAL). CONFIRMED seed.
2. **Display model**: IBM SPLIT "Divides the screen into two logical screens separated by a horizontal line" (UG1 p.24 F2; p.29; p.50 SPLIT); on a 3270 two screens are visible at once and the cursor location identifies the active one. SWAP with no parameters "moves the cursor ... to the other logical screen of a split-screen pair" (UG1 p.24 F9; p.51). The simulator shows ONE full-size logical screen at a time and switches the whole display (splitScreen.ts:39-45,81-100). Not disclosed in lesson, in glossary or in docs/03:137-148 (docs call it "opens a new logical screen" only).
3. **SWAPBAR**: IBM "The list of logical screens can be activated by entering the SWAPBAR or SWAPBAR ON command ... displayed on the last line of the physical screen" (UG1 p.52). Sim shows it automatically whenever 2+ screens exist, "above the PF legend" (docs/03:146). The default on/off state is not stated in the IBM page: INSUFFICIENT EVIDENCE for "on by default"; the lesson never mentions the command.
4. **Typed drafts retained across SWAP**: sim keeps typed field values per screen (splitScreen.ts:66,70,97; docs/03:143 "typed drafts"; explain.ts:254 "Whatever you typed on the screen you leave is still there"). IBM: "In split-screen mode, if you type a command on the command line and swap screens before pressing Enter, the command is erased" (UG1 Splitting the Screen note 4, p.32) and "pressing the SWAP key (F9) causes ISPF to ignore any entry on the command line" (UG1 p.51). CONTRADICTION, undisclosed.
5. **X on the Option line** (module6.ts:49, seed to verify): REFUTED as an error. IBM: "To end ISPF from the ISPF Primary Option Menu, you can use the EXIT command (F3), END, RETURN, Exit option (X). If the display screen is split, taking one of the actions listed ends ISPF on the active logical screen only" (UG1 "Ending an ISPF function or ISPF", p.9-10; EV-A §5 row "X on the option line" = PARTIAL). Sim: X and PF3 call `logoff` -> `closeScreen` (primaryMenu.ts:77-79,100-103). Residual: real X "uses any defaults for processing log and list data sets" and can show the Specify Disposition panel (UG1 p.10); not simulated, not disclosed.
6. "PF3 on the POM logs off when it is the only screen": IBM says these actions "end ISPF" (UG1 p.9); "logs off" is acceptable simulator shorthand. No IBM contradiction.
7. Message texts `SCREEN 2 OF 2`, `SCREEN ENDED`, `MAXIMUM SCREENS ACTIVE`, `SWAP NOT ACTIVE`, `SCREEN NOT ACTIVE` (splitScreen.ts:69,78,84,95,110): ISPF Messages and Codes (f54mc00) was not read: INSUFFICIENT EVIDENCE that they match IBM text.
8. New screen content: "A second logical screen opens on the Primary Option Menu" - no IBM page read states what a new logical screen displays: INSUFFICIENT EVIDENCE.
9. F2/F4/F9 offered on every panel (reducer.ts:162-163): IBM Table 11 default keys F2 SPLIT, F4 RETURN, F9 SWAP (UG1 "Using Function Keys", Table 11, p.67). SUPPORTED.

#### Validation and assessment findings
- **Challenge default is trivial (CONFIRMED by probe)**: last-step validator `!state.editor && state.screens.length <= 1` (module6.ts:57). At start `screens = []`, no editor -> true. Probe (evidence/probes/probe-b.probe.ts.txt): in challenge mode an empty Enter, or opening Settings, marks L15 `completed`. No split/swap/end required.
- Learn mode ordering is enforced by step order, so the learn path is sound. Step 3 requires `activeScreen === 1` plus View or Browse on COPYJOB (accepts both, good). Step 4 `SCREEN_SWAPPED to===1` requires TWO PF9 presses (first goes to screen 1, second back to 2; test lines 160-163). A learner who presses PF9 once and then ends screen 1 instead cannot proceed - mild, acceptable since the instruction says press it twice.
- Step 5 `SCREEN_CLOSED && onScreen("EDIT")` is event + state; OK.
- Step 6 (`leave`) is state-based; same predicate as the Challenge default.
- **Scenario isolation**: startingState.resetMembers restores HELLO from seed (module6.ts:16, TutorialProvider.tsx:104-106) every time L15 starts/restarts. Any learner edits to {HLQ}.JCL(HELLO) from lessons 8-9 are silently overwritten (docs/05-course-design.md:58-59 says "without touching the learner's other work" - true only for other members). L15 does not reset edit profiles or the retrieve stack; it leaves the session with `screens.length == 1`. A learner abandoning mid-lesson with two screens open keeps both screens into the next lesson (startLesson dispatches GOTO with clearStack only on the active screen; `screens` array is not cleared, TutorialProvider.tsx:108-111). I did not probe this carry-over; it follows from reducer.ts:105-114 (GOTO does not touch `screens`). Labelled: code-read, not probed.

#### Verified reference IDs and exact topics
- UG1 (SC19-3627-70, z/OS 3.2): "Splitting the screen horizontally or vertically" p.29-32; "ISPF System Commands" - SPLIT, START, SWAP, SWAPBAR pp.50-52; "Function keys" p.24 (F2, F9); "Using Function Keys" Table 11 p.67; "Ending an ISPF function or ISPF" + "Exit option (X)" p.9-10. URL https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54ug00_v3r2.pdf. Also EV-A §5 rows SPLIT/SWAP/START and `X` on the option line.

#### Confirmed deviations (disclosed?)
| Deviation | Disclosed in lesson? |
|---|---|
| "up to 8" / "never more than eight" vs default 8, max 32 | No |
| One full-screen logical screen at a time; no split line | No |
| SWAPBAR appears automatically; `SWAPBAR` command not simulated | Partly (lesson mentions the row, not the command) |
| Typed command text survives SWAP | No |
| Challenge validator trivial | No |
| X/Exit log-list disposition panel absent | No |

#### Recommended correction (minimum viable)
1. module6.ts:28 and explain.ts:245,247: "8 by default (a site can allow up to 32)"; delete "never more than eight".
2. Add to lesson 15 a one-line note: "In this simulator each logical screen fills the whole display; real ISPF splits a 3270 display in two with a horizontal line, and shows the screen list only after SWAPBAR."
3. Give lesson 15 an explicit `challenge: { task, validator }`. Challenge validators see only the current batch and state, so use `eventIs("SCREEN_CLOSED")` (screen 2 ended); an unrelated action cannot produce it.
4. Drop or caveat typed-draft retention in docs/03:143 and explain.ts:254.

#### Priority and severity
P2 / Medium overall. Sub-items: Challenge trivial P1 / High (assessment integrity); screen-limit claim P2 / Medium; display-model non-disclosure P2 / Medium; draft retention P3 / Low.

#### Evidence and rationale
Defects: module6.ts:28; explain.ts:245,247; splitScreen.ts:11,69; module6.ts:57 (probe b.probe.ts); splitScreen.ts:66,97 vs UG1 p.32 note 4 and p.51. Verified-correct: module6.ts:49 vs UG1 p.9-10. Count of confirmed defects: 5 (screen limit; display model undisclosed; draft retention; Challenge trivial; View called "read-only" wording is NOT counted - evidence insufficient).

---

### Lesson 16 - l16-jump-return

> **M0 review note (C6):** the teaching line "`=option` is RETURN followed by the option" is a **simplification, not a contradiction**. IBM says the jump "is not affected by nested dialogs" unlike RETURN, which only matters in nested dialogs the lesson does not teach. Downgraded to P2. The Challenge shortcut (`=3.4` then RETURN or PF4 completes) was reproduced independently.

| Field | Content |
|---|---|
| Lesson number and ID | 16 - `l16-jump-return` |
| Module and title | Module 7 "Navigation mastery" - "Jump anywhere with = and come home with RETURN" |
| Learning objectives (from code) | From DSLIST jump to Edit with `=2`, open {HLQ}.JCL(HELLO), jump to `=3.4` from inside the editor, then RETURN. teaches: `=option` is RETURN followed by the option; jumping out of Edit ends the session (AUTOSAVE saves); RETURN/PF4 unwinds the whole chain; only the active logical screen is affected (module7-8.ts:20-21). |
| Source files | src/tutorial/lessons/module7-8.ts:14-58; src/engine/systemCommands.ts:43-99; src/engine/navigation.ts:58-125; src/engine/screens/editor.ts:345-361; src/engine/reducer.ts:31-47,135-155; explain.ts:129-142; tests/tutorial/lessons.test.ts:190-203 |
| Technical accuracy status | **CORRECTION REQUIRED** |

#### Educational quality findings
- Strong, practical topic; hint text is clear. Step 1 uses "(3.4, then the level)" without teaching that a Dsname Level is matched by qualifier (see fidelity 5).
- teaches[0] "`=option` is RETURN followed by the option" and glossary "The jump function is RETURN followed by the option" (explain.ts:133) are wrong as a definition (below). explain.ts:140 half-corrects ("On a real system RETURN may stop at the panel where a nested dialog started") but the lesson text is what the learner sees.
- Step 4 correctly warns that AUTOSAVE matters when jumping out of Edit - good habit-forming content.

#### Simulator fidelity findings
1. **Definition of jump vs RETURN**: IBM: "the jump function causes repeated END commands to be simulated until a primary option menu is encountered. What follows the equal sign is then used on the primary option menu ... The primary option menu is not displayed." and "Unlike the RETURN command, the jump function is not affected by nested dialogs" (UG1 "Using the jump function", p.58; EV-A §5 row `=` jump = SUPPORTS for basic use). RETURN "simulates repeated END commands, up to some appropriate stopping point" (UG1 p.49-50, p.57). They are two different mechanisms; "jump = RETURN + option" is only true when no nested dialog is involved. The sim implements both identically via `unwindToPrimary` (systemCommands.ts:68-74,77-98). CONFIRMED imprecision/defect in lesson wording (module7-8.ts:21, explain.ts:133).
2. **Jump from Edit ends the session first**: SUPPORTED. UG1 "Command nesting" p.29-30: "if you used the jump function (=3.2), ISPF would end your edit session before displaying the Data Set Utility"; EM "Ending an edit session" p.11: AUTOSAVE ON saves changed data on END; "The RETURN command is logically equivalent to the repeated use of the END command". Sim: `closeEditorForNavigation` (editor.ts:350-361): saves on AUTOSAVE ON, prompts on OFF PROMPT (blocks the jump), discards on OFF NOPROMPT - consistent with EM p.11 / p.197-198 (EV-A §2 AUTOSAVE semantics = SUPPORTS).
3. **`=` works on any command line**: SUPPORTED by UG1 p.58 ("enter the option on the command line or in the command field of any panel, preceded by an equal sign"). IBM also requires the option "followed by a blank"; sim trims input; not worth disclosing.
4. **Typed `3.4` / `=3.4` still pushes the Utility Selection panel**: openPath pushes `via: [UTILITY_SELECTION]` (navigation.ts:71-78,118-121), so PF3 from DSLIST entry lands on Utility Selection. IBM: "To bypass the second menu, type two selections, separating them with a period" (UG1 "Option selection", p.20; EV-A §5 row "Typed 3.4 ..." = CONTRADICTS by implication; page does not literally state the PF3 count). Classification: LIMITATION (implied, not explicit). Matters in lesson 17 step 5.
5. **Dsname Level**: step 1 lists everything under {HLQ}. In z/OS 3.2 "If [Include Additional Qualifiers] is not selected, the data set list will include only data sets that match the qualifiers entered" (UG2 p.131-132; EV-A §6 row Dsname Level = PARTIAL). So a bare `USER01` lists only `USER01` exactly unless the checkbox is on. Sim behaviour is correct only with that option on; undisclosed.
6. **Command stack**: `=2` is not placed on the retrieve stack (reducer.ts:38-42 returns before `pushRetrieve`, systemCommands.ts:24 "system commands excluded"). IBM: "Jump function commands are stored in the stack unless they are entered from a nondisplay field" (UG1 RETRIEVE command, p.56). Deviation, see lesson 17.
7. RETURN on the POM: sim answers `ALREADY AT PRIMARY MENU` (systemCommands.ts:94): message text not verified: INSUFFICIENT EVIDENCE. `INVALID JUMP DESTINATION` text (systemCommands.ts:21): INSUFFICIENT EVIDENCE.
8. "Only the active logical screen is affected": SUPPORTED in principle - UG1 p.29 "The logical screens are treated as though they are independent ISPF sessions". `=X` / `=XALL` semantics (UG1 p.10) are not simulated except `=S` aliases (systemCommands.ts:49): not part of this lesson.
9. F4 = RETURN default: UG1 Table 11 p.67 and EV-A §5 row RETURN = SUPPORTED.

#### Validation and assessment findings
- Step 1 `dslistShowing(level.startsWith(hlq))` accepts any level beginning with the userid (e.g. `USER01.NOSUCH`). Step 2 `JUMP_EXECUTED path==="2"` does not check `from` (so `=2` typed on the POM or any panel passes - arguably fine; the lesson says "from DSLIST"). Step 3 `editorOpen(..., "EDIT")` ok.
- Step 4 `JUMP_EXECUTED from==="EDIT"` AND `editorClosed`: does NOT check `path`, so `=2` or `=0` typed in the editor passes "jump to =3.4". REJECTS nothing valid; ACCEPTS wrong destination (false positive, Low).
- If the learner's JCL profile has AUTOSAVE OFF PROMPT and the buffer is dirty, the jump is blocked (editor.ts:354) and no `JUMP_EXECUTED` is emitted (systemCommands.ts:85) - the learner is stuck on step 4 with only the Save-or-Cancel prompt; the lesson does not anticipate this. Code-read only (not probed).
- Step 5 `RETURN_EXECUTED` (PF4 or typed RETURN) fine.
- **Challenge default weak (CONFIRMED by probe)**: last step validator `eventIs("RETURN_EXECUTED")` (module7-8.ts:55). Probe c.probe.ts: open Settings (`0`) then PF4 -> status `completed`. No jump, no editor, no DSLIST required. The task text in Challenge cannot be enforced.
- **Scenario isolation**: no resetMembers needed (HELLO opened, not changed in the happy path); no profile reset. If a prior lesson left AUTOSAVE changed, behaviour differs. L16 leaves the learner on the POM.
- Test (lessons.test.ts:190-203) covers only the happy path; no negative case.

#### Verified reference IDs and exact topics
- UG1 "Using the jump function" p.58; "Using the RETURN command" p.57 and ISPF System Commands RETURN p.49-50; "Command nesting" p.29; "Option selection" p.20; RETRIEVE command p.55-56. URL .../pdf/f54ug00_v3r2.pdf. EM "Ending an edit session" p.11; AUTOSAVE p.197-198 (EV-A §2). EV-A §5 rows `=` jump, RETURN, Typed `3.4`.

#### Confirmed deviations (disclosed?)
| Deviation | Disclosed? |
|---|---|
| Jump described as "RETURN followed by option"; sim implements them identically (IBM: jump not affected by nested dialogs) | No (explain.ts:140 partially) |
| Typed/jumped 3.4 keeps Utility Selection on the stack (implied contradiction of "bypass") | No |
| `=n` not stored in retrieve stack (IBM stores it) | No |
| Dsname Level exact-match default in z/OS 3.2 | No |
| Challenge accepts RETURN from anywhere | No |

#### Recommended correction (minimum viable)
1. module7-8.ts:21 -> "`=option` ends panels with repeated END until a primary option menu, then selects the option; RETURN does the same repeated END but stops at the menu or at the start of a nested dialog". explain.ts:133 likewise.
2. Add `challenge` validator for lesson 16: `allOf(eventIs("RETURN_EXECUTED"), onScreen("PRIMARY_OPTION_MENU"))` is still weak; minimum credible: require `JUMP_EXECUTED` with `from==="EDIT"` AND `path==="3.4"` AND the same batch/state `editorClosed` (i.e. final-state-only impossible, so use `eventIs("JUMP_EXECUTED", e => e.from==="EDIT" && e.path==="3.4")`).
3. Step 4 validator add `e.path === "3.4"`.
4. Push `=n` and RETURN/SPLIT/SWAP typed commands to the retrieve stack (reducer.ts:38-42) or disclose the omission.

#### Priority and severity
P2 / Medium (definition wording is misleading but behaviour for the lesson path is right); Challenge default P1 / High (same class as L15); stack deviation P3 / Low.

#### Evidence and rationale
module7-8.ts:21, explain.ts:133 vs UG1 p.58 (jump) and p.57 (RETURN); systemCommands.ts:68-98 (shared unwinding); probe c.probe.ts (Challenge); navigation.ts:71-78 vs UG1 p.20; reducer.ts:38-42 vs UG1 p.56. Confirmed defects: 3 (jump/RETURN equivalence wording; Challenge weak; jump destination not validated) + 3 undisclosed deviations.

---

### Lesson 17 - l17-retrieve-multi

| Field | Content |
|---|---|
| Lesson number and ID | 17 - `l17-retrieve-multi` |
| Module and title | Module 7 "Navigation mastery" - "RETRIEVE and several line commands per Enter" |
| Learning objectives (from code) | Exclude two data sets from DSLIST in one Enter, RESET, then bring back and re-run an earlier command with RETRIEVE. teaches: ISPF processes every line command on the panel top to bottom; RETRIEVE/F12 refills the command line from the stack; "F12 is Cancel in Edit and Retrieve on most other panels" (module7-8.ts:66-67). |
| Source files | src/tutorial/lessons/module7-8.ts:60-103; src/engine/systemCommands.ts:22-41; src/engine/reducer.ts:31-73,128-132,157-165; src/engine/listCommands.ts:1-67; src/engine/screens/dslistResults.ts:60-70,107,169-175,248-268; src/tutorial/explain.ts:340-346; docs/04-editor-commands.md:105-109; tests/tutorial/lessons.test.ts:204-222 |
| Technical accuracy status | **CORRECTION REQUIRED** |

#### Educational quality findings
- Good choice of topic: RETRIEVE is a genuine daily productivity feature; combining it with multi-line-command entry is a sensible pairing.
- Step 5 instruction "Press PF3 twice, then use F12 until 3.4 is on the Option line" relies on the simulator's Utility Selection stop (see fidelity 4). In real ISPF a typed `3.4` bypasses the Utility Selection menu (UG1 p.20), so the second PF3 would land on the Primary Option Menu, not on a panel that shows the pre-typed option line the way the lesson describes.
- Step 4 explanation "The editor uses F12 for Cancel instead, so type RETRIEVE there" is practical, but the IBM position is keylist-dependent (below).
- The lesson never mentions the command delimiter (`;`) which is the other half of "several commands per Enter" for primary commands (UG1 p.27). Not a defect; a scope choice.

#### Simulator fidelity findings
1. **Shared stack across logical screens**: SUPPORTED. "When you are operating in split-screen mode, one stack retains commands for all logical screens" and "Each ISPF session supports only one command retrieval stack, to be shared by all logical screens" (UG1 RETRIEVE command, p.55-56; EV-A §5 row RETRIEVE = SUPPORTS). Sim: single `state.retrieveStack` (types.ts:82).
2. **F12 = RETRIEVE vs Cancel (seed)**: UG1 Table 11 "Function key arrangement" (p.67) lists the default assignments as F1 HELP, F2 SPLIT, F3 END, F4 RETURN, F5 RFIND, F6 RCHANGE, F7 UP, F8 DOWN, F9 SWAP, F10 LEFT, F11 RIGHT, **F12 RETRIEVE**. But UG1 "Function keys" (p.24): "ISPF uses CUA-compliant definitions for function keys F1-F12 (except inside the Edit function) ... By default you see the CUA definitions" and CUA F12 = Cancel; many IBM sample panels in UG1 show `F12=Cancel`. Hence "Retrieve on most other panels" is true only for the non-CUA/Table 11 keylist; under the default CUA display F12 cancels (EV-A §5 row "PF key conventions": PARTIAL). The lesson's "PF12 Cancel (Edit) or Retrieve (elsewhere)" hybrid (docs/03:18-19, explain.ts:119,126) is a simulator simplification. Lesson partly mitigates by offering "(or type RETRIEVE)". Undisclosed that a real panel legend may show F12=Cancel.
3. **Retrieve rules**: sim pushes only commands typed on an Enter (reducer.ts:45-47) and not PF-key commands: SUPPORTED (UG1 p.56 "Commands entered through the use of function keys" not retained). No consecutive duplicates: SUPPORTED (UG1 p.56 "Duplicate commands are allowed ... except ... a duplicate of the command at the top"). Stack length 25 (systemCommands.ts:22): IBM size is installation-configured (UG1 p.56; RETP shows last 25, p.57) - acceptable, partly disclosed ("25 in this simulator", explain.ts:344).
4. **Jump/RETURN/SPLIT/SWAP typed commands are not stacked** (reducer.ts:38-42 returns before `pushRetrieve`; systemCommands.ts:24 "system commands excluded"). IBM: "Jump function commands are stored in the stack unless they are entered from a nondisplay field" and "All command lines (except the RETRIEVE command) are placed in the stack as entered, regardless of validity" (UG1 p.56). CONFIRMED deviation, undisclosed (docs/04:107 says "Every non-blank command ... on a panel command line").
5. **docs/04:107 "(not the editor)" is wrong vs code**: editor commands typed in `command` do go through `pushRetrieve` (reducer.ts:45-47 applies to every screen). Docs error, not simulator error (IBM stack is global, UG1 p.55).
6. **Recycling and empty stack**: IBM recycles to the top when Enter is pressed on a blank command line (UG1 p.55-56) and shows a blank command line when the stack is empty. Sim never recycles on blank Enter (blank Enter does not reset `retrieveIndex`, reducer.ts:45-47) and shows `NO COMMAND TO RETRIEVE` (systemCommands.ts:34); message text INSUFFICIENT EVIDENCE vs IBM (IBM text says blank line, no message). Index also persists across PF3 presses, so how many F12 presses reach "3.4" in step 5 depends on how many were pressed in step 4 (stack-position leak; code-read).
7. **Multi-command processing in 3.4 (seed)**: Table 15 (UG1 p.81) lists Data Set List (3.4) as "Multiple: ... you can enter more than one line command simultaneously" - SUPPORTED. "top to bottom": IBM says so for Edit line commands (EM "Rules for entering line commands", p.135-136) and for command-table utility 3.9 (UG2 p.177); not stated for 3.4 -> the order claim for DSLIST is INSUFFICIENT EVIDENCE, though plausible.
8. **"If one opens a panel, the rest wait until you press PF3"** (module7-8.ts:79): for member lists IBM says the opposite UX: "When you return to the member list after viewing, browsing, or editing a member, you must press Enter again to call any remaining line commands" (UG1 Using member selection lists, p.99). The sim auto-resumes parked commands on PF3 (reducer.ts:19-29, listCommands.ts:63-67). For the 3.4 DATA SET list the equivalent IBM text was not found: INSUFFICIENT EVIDENCE; but the lesson's statement contradicts the nearest documented behaviour. Classified: unverified/likely wrong.
9. **`X` in 3.4 and RESET**: SUPPORTED. "X - exclude data set ... one data set from a data set list is excluded" (UG2 p.153); "The RESET primary command unexcludes data sets ... and removes any pending line commands and messages" (UG2 RESET command, DSLIST section, p.157). IBM message after X is "1 data set(s) not displayed" (UG2 p.139 message table); the sim prints "n COMMANDS PROCESSED" and a dashed marker "n Data Set(s) Not Displayed" (listCommands.ts:58-60, dslistResults.ts:55). Wording differs; marker text itself INSUFFICIENT EVIDENCE.
10. **Command delimiter (seed)**: IBM "The default delimiter is a semicolon. Use the Settings option (0) to change the delimiter" (UG1 Stacking commands, p.27-28; EV-A §5 row = SUPPORTS); "processing of the command chain ends when ISPF interprets the RETRIEVE command" (p.56). grep of src/ finds no `;`/ZDEL handling: stacked commands are NOT implemented. Not claimed by lesson 17; documented gap? docs/03,04 do not mention it - undisclosed.
11. **Typed 3.4 keeps Utility Selection on stack**: see lesson 16 fidelity 4 (UG1 p.20; implied contradiction, not literal).
12. Dsname Level exact-match default: see lesson 16 fidelity 5.

#### Validation and assessment findings
- **Step 5 false positive (CONFIRMED by probe)**: validator `allOf(onScreen("DSLIST_SEARCH"), retrieveStack.length>0)` (module7-8.ts:100). Probe a.probe.ts: after steps 1-4 the FIRST PF3 returns from DSLIST_RESULTS to DSLIST_SEARCH and the runner is `completed` (stack = ["RESET","3.4"]). The instructed second PF3, the F12 walk to `3.4` and the re-run are never checked. The unit test (lessons.test.ts:214-221) asserts only the final `completed` after all actions, so it cannot detect the early pass (tests passing is not evidence). Severity High (the lesson's retrieve-and-rerun objective is unassessed).
- **Challenge default trivial (CONFIRMED by probe)**: same validator as step 5. Probe c.probe.ts: in challenge mode, typing `3.4` once -> `completed` (screen DSLIST_SEARCH, stack ["3.4"]). No X, no RESET, no RETRIEVE.
- Step 2 `LIST_COMMANDS_PROCESSED count>=2` accepts any two completed line commands (not necessarily X; e.g. X + NX). Step 3 `LIST_RESET` accepts RESET even if nothing was excluded. Step 4 `COMMAND_RETRIEVED` accepts any retrieval (the lesson says the recalled command is RESET but does not check it). Low.
- Rejection of valid alternatives: none found; typing `RETRIEVE` instead of F12 works (systemCommands.ts:56); step 1 accepts any HLQ-prefixed level.
- **Scenario isolation**: startingState does not clear `retrieveStack`/`retrieveIndex` (TutorialProvider.tsx:104-111); history from earlier lessons or earlier attempts is walked by F12 (stack persists inside the session; reset only by RESET_ENVIRONMENT, reducer.ts:85-95). Restarting L17 inside the same session leaves old entries, changing the "previous command is RESET" expectation only if RESET is not typed last (it always is, step 3). Low. The lesson leaves DSLIST/UTILITY panels open.

#### Verified reference IDs and exact topics
- UG1: "RETRIEVE command" p.55-56; "Stacking commands" p.27-28; "Function keys" p.24; Table 11 "Function key arrangement" p.67 (https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54ug00_v3r2.pdf); Table 15 "Member Selection List Differences" p.81; "Using member selection lists" p.99; "Option selection" p.20. UG2: "Data set list utility line commands" p.147-153 (X, NX), "RESET command" (3.4 primary commands) p.157, message table p.139. EV-A §5 rows RETRIEVE, Command stacking `;`, PF key conventions, Typed 3.4.

#### Confirmed deviations (disclosed?)
| Deviation | Disclosed? |
|---|---|
| Step 5/Challenge validator passes after first PF3 / after typing 3.4 | No |
| F12 = Retrieve on non-editor panels; IBM default CUA display has F12 = Cancel; Retrieve is Table 11 (non-CUA) | Partly ("The legend on the panel is authoritative", docs/03:19; not in lesson) |
| Jump/RETURN/etc not stored in stack (IBM stores) | No |
| No blank-Enter recycle; empty-stack message | No |
| Auto-resume of parked line commands on PF3 (member-list IBM: press Enter again) | No |
| `;` command stacking not implemented | No |
| Utility Selection panel stays on stack for typed 3.4 | No |
| docs/04:107 "not the editor" incorrect | n/a (docs error) |

#### Recommended correction (minimum viable)
1. Replace step 5 and Challenge validator by `eventIs("OPTION_SELECTED", e => e.option==="3.4")` AND previously a `COMMAND_RETRIEVED` with `command==="3.4"` (i.e. validate the re-run itself: `eventIs("OPTION_SELECTED", e=>e.option==="3.4")` after the lesson reaches step 5 is sufficient because earlier events are not in the batch).
2. Reword module7-8.ts:67: "F12 is Cancel in the editor and Retrieve on the keylist this simulator uses; type RETRIEVE if F12 does something else on your system".
3. Remove or soften "the rest wait until you press PF3" (module7-8.ts:79) -> "if one opens a panel the rest are held (on real member lists you press Enter again to run them)".
4. docs/04-editor-commands.md:107: delete "(not the editor)"; push `=n` into the stack or add a deviation line.

#### Priority and severity
Step 5/Challenge false pass: P1 / High. F12 wording: P2 / Medium. Unstacked jump commands, parked-command resume wording, `;` gap: P3 / Low.

#### Evidence and rationale
module7-8.ts:100 + probe a.probe.ts (early pass at `DSLIST_SEARCH`) + probe c.probe.ts (Challenge); reducer.ts:38-47; systemCommands.ts:22-41; UG1 pp.24,27-28,55-56,67,81,99; UG2 pp.139,153,157. Confirmed defects: 4 (early/false pass; trivial Challenge; F12 hybrid undisclosed; wait-until-PF3 contradicts nearest IBM text) + 4 undisclosed deviations.

---

### Lesson 18 - l18-cols-bounds

| Field | Content |
|---|---|
| Lesson number and ID | 18 - `l18-cols-bounds` |
| Module and title | Module 8 "Editor power tools" - "Columns matter: COLS and BOUNDS" |
| Learning objectives (from code) | In {HLQ}.COBOL(HELLO) display a =COLS> ruler, set BOUNDS 8 72, FIND DIVISION inside the bounds, then RESET. teaches: COLS ruler (never saved); BOUNDS left right limits FIND/CHANGE/EXCLUDE; "COBOL area A starts in column 8; JCL must not pass column 71"; RESET removes special lines (module7-8.ts:111-112). |
| Source files | src/tutorial/lessons/module7-8.ts:9-12,105-154; src/editor/primaryCommands.ts:87-98,195-228,266-277; src/parsers/editorPrimaryCommand.ts:145-154; src/editor/special.ts:9-74; src/editor/profile.ts:54-59; src/engine/screens/editor.ts:58-75,247-262; src/tutorial/explain.ts:291-304; src/catalog/seed.ts:119-127; docs/04-editor-commands.md:20-22,79-80,92-97; tests/tutorial/lessons.test.ts:223-237 |
| Technical accuracy status | **CORRECTION REQUIRED** |

#### Educational quality findings
- The demonstration is empty: every DIVISION in the seed member starts at column 22 or later (seed.ts:121-125, lines begin with 7 blanks), so `FIND DIVISION` gives the same result with or without `BOUNDS 8 72`. The learner never sees bounds restrict anything, although the objective is "FIND DIVISION inside the bounds". Suggest a search string that exists only in columns 1-7 (or 73-80) to show exclusion.
- Step 3 explanation "BNDS on its own shows an editable =BNDS> line" is wrong for the primary command (below) and teaches the learner something that on a real system silently resets their bounds.
- Step 5 tells the learner to "type BOUNDS 1 72 if you want the default back". On a real system that command sets explicit non-default bounds (see below).
- "COBOL area A starts in column 8 (columns 8-11); area B 12-72" (module7-8.ts:112,124; explain.ts:302): no COBOL language reference was read: INSUFFICIENT EVIDENCE. "JCL must not pass column 71": SUPPORTED - "Do not code fields, except on the comment statement, past column 71. Columns 73-80 are ignored by z/OS and are typically used for sequence numbers" (z/OS 3.2 MVS JCL Reference SA23-1385-70, statement-fields passage following "Free form", printed p.15, PDF p.61; https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/ieab600_v3r2.pdf). Note column 72 is the continuation column (same book, nearby text), so "71" is the last field column, fine.

#### Simulator fidelity findings
1. **BOUNDS/BNDS with no operands (seed) - CONFIRMED defect**. Lesson module7-8.ts:131 and explain.ts:294 ("BNDS shows an editable =BNDS> line"); parser maps `BOUNDS|BOUND|BNDS|BND` with no args to `{show:true}` (editorPrimaryCommand.ts:145-149) and primaryCommands.ts:88 inserts a =BNDS> special line. IBM, primary command: "To reset the boundaries to the default columns: type BOUNDS ... The boundaries are reset to the default columns" (EM "BOUNDS - Control the Edit Boundaries", p.199; EV-A §2 row BOUNDS). The =BNDS> display is the **line** command: "The BOUNDS line command displays the boundary definition line ... Type BOUNDS in the line command field of any line" (EM "BOUNDS - Define Boundary Columns", p.151-152). Also `BOUNDS 1 72` is the IBM example for setting explicit bounds (p.199).
2. **"BOUNDS 1 72 to get the default back" - CONFIRMED defect** (module7-8.ts:143). IBM: "If you have changed the bounds settings ... and would like to revert to the default settings, you can use any BOUNDS command to do so" (EM "Edit boundaries", p.23) and Table 3 "Default bounds settings" (EM p.24): fixed record, LRECL 80, COBOL type, number OFF = **1,80**; STD numbers ON = 1,72; COBOL numbers 7,72; ASM 1,71; OTHER OFF 1,80; variable 1,record length. So for the lesson's unnumbered FB-80 COBOL member the default is 1,80 and `BOUNDS 1 72` is a non-default setting that excludes columns 73-80 and is stored in the profile. In the sim `BOUNDS 1 72` sets `{left:1,right:72}` and the default is `{1,0}`=1..LRECL (profile.ts:31,55-59), so the sim itself treats them as different.
3. **Default bounds explanation** (explain.ts:295 "The default bounds are 1 and the record length"): PARTIAL; correct only for unnumbered fixed records of non-ASM type (EM Table 3, p.24). The sim does not model number-mode-dependent defaults. Undisclosed (docs/04:95 "BOUNDS 1 LRECL").
4. **Bounds persist in the edit profile**: SUPPORTED. "The BOUNDS primary command sets the left and right boundaries and saves them in the edit profile" (EM p.199) and profile modifications are saved unless locked (EM "Modifying an edit profile", p.19). Sim: `setProfile` -> `profileDirty` -> `withProfile` -> `saveProfiles` (primaryCommands.ts:118-121, editor.ts:291-295, store.ts:96).
5. **Commands affected by bounds**: lesson lists FIND/CHANGE/EXCLUDE; IBM lists CHANGE EXCLUDE FIND LEFT RCHANGE RFIND RIGHT SORT (primary) and `< > ( ) O TE TF TS` (line) (EM "Edit boundaries", p.23). SUPPORTED but incomplete. Sim applies bounds to find/change/exclude only (primaryCommands.ts:195-198,268,293). Undisclosed.
6. **COLS primary command - fidelity mismatch**. IBM: "displays a non-scrolling columns indicator line at the top of the data area"; the line command field is protected (cannot be copied, moved or deleted); "Entering COLS with no parameter toggles the display"; `COLS ON|OFF`; figure shows the =COLS> row **above** `Top of Data` (EM "COLS - Display Fixed Columns Line", p.206-207). Sim (probe d.probe.ts): the ruler is inserted as an ordinary special line AFTER the Top of Data row, scrolls with the data, has an editable prefix field (editor.ts:58-75) and a second `COLS` adds a SECOND ruler (probe P1: specials "COLS,COLS"; special.ts:44) instead of toggling it off. `COLS ON/OFF` are not parsed (parser case "COLS" ignores args). IBM's =COLS> inserted "after the line" with scrolling is the **line** command (EM p.155). Lesson text "appears above the first line" is approximately true visually; the removal story ("RESET") is documented for the line-command flag (EM RESET/SPECIAL p.274), not stated for the primary fixed line: INSUFFICIENT EVIDENCE that RESET removes the fixed ruler.
7. **Ruler format** `----+----1----+----2` matches EM Figure 109 (p.207). SUPPORTED. "never saved": IBM says =COLS> can be saved only via MD (EM "Flagged lines", p.22): minor.
8. RESET semantics: "If you do not specify any operands, RESET processes all operands except LABEL"; SPECIAL deletes =BNDS> =COLS> ======= =MASK> ==MSG> =NOTE= =PROF> =TABS> (EM RESET, p.273-275; EV-A §2 row RESET = SUPPORTS). RESET with no operand also redisplays excluded lines and clears flags; lesson says only "removes the ruler" (incomplete, harmless).
9. Message texts `INVALID BOUNDS`, `BOUNDS l r` (primaryCommands.ts:91-92): INSUFFICIENT EVIDENCE (ISPF Messages and Codes not read).

#### Validation and assessment findings
- Step 3 `eventIs("BOUNDS_CHANGED")` false positives (probe d.probe.ts P2/P3): plain `BOUNDS` (which only displays =BNDS> in the sim and RESETs on a real system), `BOUNDS 20 30` or `BOUNDS 1 80` all pass; the validator does not check 8/72. Typing the exact instruction passes.
- Step 4 `eventIs("EDITOR_FIND")` is emitted for any FIND, including a failing one (probe P4: `FIND ZZZZ` -> EDITOR_FIND + `NO CHARS 'ZZZZ' FOUND` and the step passes). Step is also not tied to bounds.
- Step 2 `COLS_DISPLAYED` ok. Step 5 `hasSpecial("COLS",false)` AND editor open on COBOL(HELLO) (state-only): passes in the same batch as step 4 if the COLS line is already gone; fine.
- **Challenge default trivial (CONFIRMED by probe b.probe.ts)**: last step validator = `editorClosed` (module7-8.ts:151) -> true at the very first action after start; probe: empty Enter -> `completed`.
- **Scenario isolation / persistence leak (CONFIRMED by probe P6)**: `BOUNDS 8 72` (or any bounds the learner tried) is persisted in `editProfiles.COBOL` (localStorage key `ispf-lab:editprofile:v1:<USERID>`, profileStore.ts) and never reset by the lesson, by restarting the lesson, or by any `startingState` (no profile reset exists in `LessonStart`, types.ts:31-38). It silently changes FIND/CHANGE/EXCLUDE results for every later COBOL member edit (lesson 21 uses the same member; sandbox/practice use). Only "Reset environment" clears it (store.ts:77-82). The lesson text mentions the persistence but gives a wrong remedy (fidelity 2).
- Test (lessons.test.ts:223-237) asserts the happy path only; it would not catch false positives.

#### Verified reference IDs and exact topics
- EM (SC19-3621-70, https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54em00_v3r2.pdf): "BOUNDS - Control the Edit Boundaries" p.199; "BOUNDS - Define Boundary Columns" (line cmd) p.151-152; "Edit boundaries" p.23 and Table 3 p.24; "COLS - Display Fixed Columns Line" p.206-207; "COLS - Identify Columns" p.155; "RESET - Reset the Data Display" p.273-275; "Flagged lines" p.22; "Modifying an edit profile" p.19. MVS JCL Reference SA23-1385-70 p.15 (column 71). EV-A §2 rows BOUNDS, COLS, RESET.

#### Confirmed deviations (disclosed?)
| Deviation | Disclosed? |
|---|---|
| Primary BOUNDS/BNDS with no operands shows =BNDS> (IBM: resets to defaults) | No - stated as fact in lesson/glossary/docs/04:79 |
| "BOUNDS 1 72 restores default" | No |
| Default bounds always 1..LRECL (IBM: depends on RECFM/LRECL/type/number mode) | Partly (docs/04:95) |
| COLS primary behaves like the line command; second COLS duplicates; no COLS OFF | No |
| Bounds only applied to FIND/CHANGE/EXCLUDE | No |
| Persisted BOUNDS leaks to later lessons | No |
| Trivial Challenge | No |

#### Recommended correction (minimum viable)
1. module7-8.ts:131 and explain.ts:294: replace with "BOUNDS with no operands resets the bounds to the default; to see and edit them as a =BNDS> line type BNDS in the line-command (prefix) area". Make parser/primaryCommands.ts:88 reset (and move `show` to a prefix `BNDS` line command) or disclose in docs/04.
2. module7-8.ts:143: "type BOUNDS (no operands) to restore the default".
3. Step 3 validator: `eventIs("BOUNDS_CHANGED")` + state check `state.editProfiles.COBOL?.bounds` equals `{left:8,right:72}`. Step 4: require `EDITOR_FIND` and a following message not an error (or `MESSAGE_SHOWN` info with `CHARS`).
4. Add a profile reset to the final step or a `LessonStart.resetProfiles`; or make the lesson end with `BOUNDS`.
5. Add `challenge` validator requiring COBOL profile bounds `{8,72}` was set and editor closed: impossible statelessly, so use `eventIs("BOUNDS_CHANGED")` combined with `editorClosed`... minimum: challenge `eventIs("EDITOR_FIND")` after profile bounds 8/72 AND `editorOpen`.
6. COLS: parse `COLS ON|OFF`, toggle instead of duplicating, render above Top of Data.

#### Priority and severity
P1 / High for the BOUNDS facts (teaches an incorrect command effect and an incorrect "restore"); Challenge default P1 / High; persistence leak P2 / Medium; COLS fidelity P3 / Low; false positives P2 / Medium.

#### Evidence and rationale
module7-8.ts:131,143; explain.ts:294-295; editorPrimaryCommand.ts:145-149; primaryCommands.ts:88; special.ts:44; editor.ts:58-75; probes d.probe.ts P1-P6 and b.probe.ts; EM p.199, p.151-152, p.23-24, p.206-207, p.273-275. Confirmed defects: 8 (BNDS display claim; 1 72 default claim; default-bounds text partial; BOUNDS_CHANGED false positive; EDITOR_FIND false positive; Challenge trivial; persisted bounds leak; COLS primary mismatch).

---

### Lesson 19 - l19-profiles

| Field | Content |
|---|---|
| Lesson number and ID | 19 - `l19-profiles` |
| Module and title | Module 8 "Editor power tools" - "Edit profiles: settings that follow the data set type" |
| Learning objectives (from code) | Show =PROF> lines for {HLQ}.JCL(HELLO), turn CAPS ON, leave, reopen {HLQ}.JCL(COPYJOB), confirm CAPS is still ON; then turn it OFF "to restore the default". teaches: PROFILE shows =PROF> lines; profile named after the last qualifier; "CAPS, NUMBER, STATS, RECOVERY, SETUNDO, AUTOSAVE and BOUNDS live in it"; profiles persist (module7-8.ts:162-163). |
| Source files | src/tutorial/lessons/module7-8.ts:156-199; src/editor/profile.ts:1-59; src/editor/primaryCommands.ts:65-76,97-98,118-121; src/engine/screens/editor.ts:289-295; src/persistence/profileStore.ts; src/state/store.ts:93-96; src/engine/open.ts:51-53; src/engine/screens/editEntry.ts:53; src/tutorial/explain.ts:305-311; docs/04-editor-commands.md:85,92-97; tests/tutorial/lessons.test.ts:238-252 |
| Technical accuracy status | **CORRECTION REQUIRED** |

#### Educational quality findings
- The idea (one profile per data set type; check PROFILE first when Edit "behaves oddly") is valuable and correct in general.
- The chosen setting, CAPS, is the worst example: on a real system CAPS is one of the four modes the editor re-derives from the data on every open (see fidelity 1-2). The lesson's causal story ("CAPS is still ON because COPYJOB uses the same JCL profile") is not what a real ISPF session shows.
- The learner is told to "type CAPS OFF to restore the default": there is no such default (below).
- The step-2 instruction lists fields "profile name JCL, LRECL, CAPS, NUMBER, STATS, RECOVERY, SETUNDO, AUTOSAVE, BOUNDS" in "two =PROF> lines": real PROFILE output differs in layout and count; a learner comparing with a real terminal will not find BOUNDS there.
- Good: step 4 explanation tells the learner PROFILE is the first command to try when Edit behaves oddly.

#### Simulator fidelity findings
1. **CAPS has no fixed default (seed "CAPS OFF to restore the default") - CONFIRMED defect**. IBM: "The editor sets the caps mode according to the data in the file retrieved for editing. If caps mode has been on and the data contains lowercase letters, the mode switches and the editor displays a message ... Caps mode is saved in the edit profile" (EM "CAPS - Control Automatic Character Conversion", p.202-203); "The editor sets caps mode on if it detects that a member to be edited contains no lowercase characters and sets caps mode off if the member does contain lowercase characters" (EM "Edit profile modes", p.20); the example ZDEFAULT lists "Modes set on: CAPS STATS NULLS NUMBER AUTOSAVE NOTE" (EM "Edit mode defaults", p.21; EV-A §2 row CAPS default = CONTRADICTS). Sim default is `caps:false` (profile.ts:31) and never data-derived. Lesson line module7-8.ts:194 and docs/04:95 ("Defaults: CAPS OFF") are therefore not IBM-backed. To override the automatic setting IBM says "type CAPS ON and press Enter to reset it" (p.20) or use an initial macro (p.24).
2. **Persistence demo does not reproduce on a real system for CAPS - CONFIRMED defect in lesson design**. IBM: "The exceptions are caps, number, stats, and pack, which are made to match the data and are noted with messages" (EM "Locking an edit profile", p.19; PROFILE LOCK syntax p.263: "CAPS, NUMBER, STATS, and PACK mode are automatically changed to fit the data. These changes occur when the data is first read"). The seed members HELLO and COPYJOB contain no lowercase characters (probe e.probe.ts: has lowercase = false for JCL/HELLO, JCL/COPYJOB, COBOL/HELLO), so on a real system opening COPYJOB turns CAPS ON because of the data, whatever the profile said before, with a ==MSG> line. The simulator shows CAPS purely from the stored profile (open.ts:51-53).
3. **PROFILE display layout - CONFIRMED defect**. IBM: "The first five lines of the edit profile are the current mode settings. The remaining lines are the current contents of the =TABS>, =MASK>, and =BNDS> lines, with the =COLS> positioning line"; "The =BNDS> line does not appear if it contains the default boundary positions" (EM "Displaying or defining an edit profile", p.18; "PROFILE - Control and Display Your Profile" p.262-265; EV-A §2 row PROFILE display layout = CONTRADICTS). The IBM example (EM Figure 141, p.265) has: line 1 profile name, record format/length, RECOVERY, NUMBER; line 2 CAPS, HEX, NULLS, TABS, SETUNDO; line 3 AUTOSAVE, AUTONUM, AUTOLIST, STATS; line 4 PROFILE lock status, IMACRO, PACK, NOTE; line 5 HILITE. The sim prints two =PROF> lines with BOUNDS inside (profile.ts:46-52). Lesson text states the two-line/BOUNDS layout as fact (module7-8.ts:174). Code comment calls it "simplified but faithful" - no lesson disclosure.
4. **Profile named by last qualifier (seed)**: SUPPORTED with caveats. "If you leave the Profile Name field blank, the profile name defaults to the data set type, which is the last qualifier in the data set name. If you type a profile name, it overrides" and "The library type (the last of the data set name qualifiers), record format (fixed or variable), or the record length can implicitly specify an edit profile" (EM "What is an edit profile?" / "Using edit profile types", p.17). Sim: `profileNameFor` = last qualifier (profile.ts:24-27); the Edit Entry "Profile Name" is a static label, not an input (editEntry.ts:53), and PROFILE `name` / LOCK / RESET / 0-9 operands are ignored (parser maps any PROFILE to display). IBM limits ~25 profiles (p.17); sim unlimited. Undisclosed.
5. **BOUNDS in the profile line (seed)**: CONTRADICTED as to display location, supported as to storage (see fidelity 3 and lesson 18 fidelity 4).
6. **Profile persistence**: SUPPORTED. "Whenever you change an edit profile value, ISPF saves the value (unless the edit profile is locked)" (EM "Modifying an edit profile", p.19). Sim persists per userid (store.ts:96).
7. **Defaults other than CAPS** (profile.ts:31 `number:false, stats:true, recovery:false, setundo:true, autosave:"ON"`): EM p.21 example profile = NUMBER ON, STATS ON, AUTOSAVE ON, RECOVERY OFF, SETUNDO STG, HEX OFF. NUMBER default differs (docs/04:95 "NUMBER OFF" vs EV-A §2 row NUMBER "default is NUMBER ON for standard sequence fields", EM p.28). Profile settings default to "the ISPF configuration table" (EM p.21), so any single default is site-dependent.
8. `PROFILE LOCK/UNLOCK/RESET` not implemented (EM p.263-264); lesson does not use them.

#### Validation and assessment findings
- Step 2 `hasSpecial("PROF")` state-only; passes as soon as a =PROF> line exists (typed `PROFILE`). Step 3 `PROFILE_CHANGED` and `caps===true`: passes for ANY profile change while caps is already true (e.g. an abandoned earlier attempt left CAPS ON - persisted).
- Step 4 `editorOpen(JCL, COPYJOB, EDIT)` and `caps===true`: purely state; does not require the learner to type `PROFILE` as instructed; acceptable.
- Step 5 `editorClosed && editProfiles.JCL?.caps===false`: requires `CAPS OFF` and PF3.
- **Challenge default (CONFIRMED by probe c.probe.ts)**: last-step validator as above. Fresh state (`editProfiles = {}` -> `JCL` undefined -> false) it is NOT instantly trivial, but opening any JCL member, typing `CAPS OFF` (never `CAPS ON`, never `PROFILE`) and PF3 completes it (probe: `completed`), because default caps is already OFF. Once a JCL profile entry exists (any earlier lesson 19 run, lesson 20's RECOVERY ON, any profile command on a JCL member) `editProfiles.JCL.caps===false` is already true and the very first action after the lesson starts completes it (probe: opening Settings completed it). Therefore the Challenge check is satisfiable without doing the task.
- **Scenario isolation / persistence (CONFIRMED)**: lesson mutates the persistent JCL profile (CAPS ON -> OFF). A learner who abandons the lesson between steps 3 and 5 leaves `caps:true` in `editProfiles.JCL` across page reloads (profileStore.ts); every later JCL edit then upper-cases typed text, silently altering lessons 24/27/28 (which edit JCL). No `LessonStart` field resets profiles (types.ts:31-38). The final step does restore OFF only if the learner follows through.
- Rejects valid alternatives? `CAPS` alone (equals CAPS ON in IBM; parser treats missing arg as ON, editorPrimaryCommand.ts:220) passes; opening COPYJOB via 3.4 -> E also passes. No valid-alternative rejection found.

#### Verified reference IDs and exact topics
- EM (https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54em00_v3r2.pdf): "What is an edit profile?" / "Using edit profile types" p.17; "Displaying or defining an edit profile" p.18; "Modifying an edit profile" and "Locking an edit profile" p.19; "Edit profile modes" p.20; "Edit mode defaults" p.21; "CAPS - Control Automatic Character Conversion" p.202-203; "PROFILE - Control and Display Your Profile" p.262-265 (Figure 141). EV-A §2 rows CAPS default, CAPS OFF semantics, PROFILE display layout, AUTOSAVE default.

#### Confirmed deviations (disclosed?)
| Deviation | Disclosed? |
|---|---|
| CAPS persisted from profile; IBM re-derives from data on every open | No |
| Two =PROF> lines incl. BOUNDS (IBM: five lines, BOUNDS separate and only if non-default) | No (profile.ts comment only) |
| "CAPS OFF restores the default" / docs "Defaults: CAPS OFF, NUMBER OFF" | No |
| Edit Entry Profile Name field and PROFILE name/LOCK/RESET/0-9 operands not implemented | No |
| Profile mutated persistently, no reset, trivial Challenge | No |

#### Recommended correction (minimum viable)
1. module7-8.ts:194: "Type CAPS OFF to put it back the way you found it" (not "the default"). docs/04:95 delete "CAPS OFF, NUMBER OFF" as defaults, say "site/data dependent".
2. Switch the demonstrated setting to one that IBM does NOT re-derive from data, e.g. `AUTOSAVE` or `HEX`: keep step structure; or add an explicit note "real ISPF also resets CAPS to match the data when a member opens".
3. module7-8.ts:174: "PROFILE shows five =PROF> lines (this simulator shows two, with BOUNDS added for convenience)".
4. Challenge validator: `eventIs("PROFILE_CHANGED", e => ...)` cannot see history; require the final-step event plus state: use `allOf(editorClosed, state => state.editProfiles.JCL?.caps===false, eventIs("COMMAND_ENTERED", e => /^CAPS\s+OFF/i.test(e.command)))` evaluated on the closing batch is also fragile; minimum: add a lesson `startingState.resetProfiles` and a challenge requiring `editProfiles.JCL` to exist.
5. Add `LessonStart.resetProfiles` (or reset the touched profile on lesson restart) to avoid cross-lesson leakage.

#### Priority and severity
P1 / High for CAPS facts (wrong "default" claim and a demonstration that real ISPF contradicts); P2 / Medium for PROFILE layout, Challenge, and persistence leak.

#### Evidence and rationale
module7-8.ts:174,194; profile.ts:31,45-52; open.ts:51-53; probes c.probe.ts, e.probe.ts; EM p.17-21, p.202-203, p.262-265. Confirmed defects: 7 (CAPS default; CAPS persistence demo; PROFILE layout; BOUNDS-in-PROF; Challenge satisfiable without task; profile mutation/leak; unimplemented PROFILE operands undisclosed).

---

### Lesson 20 - l20-undo-recovery

| Field | Content |
|---|---|
| Lesson number and ID | 20 - `l20-undo-recovery` |
| Module and title | Module 8 "Editor power tools" - "UNDO and edit recovery" |
| Learning objectives (from code) | In {HLQ}.JCL(HELLO) delete a line, UNDO it, turn RECOVERY ON, then CANCEL. teaches: UNDO reverses one interaction (one Enter) at a time; SETUNDO ON or RECOVERY ON required; SAVE is a boundary; CANCEL discards everything since the last SAVE (module7-8.ts:207-208). |
| Source files | src/tutorial/lessons/module7-8.ts:201-244; src/editor/history.ts:1-38; src/editor/primaryCommands.ts:46-52,71-74,118-121; src/editor/profile.ts:29-32; src/engine/screens/editor.ts:264-326,388-392; src/tutorial/explain.ts:193-198,270-290; docs/04-editor-commands.md:68,76-77,95-103; tests/tutorial/lessons.test.ts:253-265 |
| Technical accuracy status | **CORRECTION REQUIRED** |

#### Educational quality findings
- Core UNDO teaching is accurate and well scoped (interaction granularity, SAVE boundary, CANCEL). The delete-undo-cancel arc is a good safety habit.
- **The RECOVERY step teaches nothing observable**: because the simulator default is `setundo:true` (profile.ts:31), `UNDO` already works before the learner types `RECOVERY ON`, and `RECOVERY ON` changes no behaviour; yet the step explanation says it "keeps UNDO available". The lesson says UNDO "needs SETUNDO ON or RECOVERY ON" but never lets the learner see UNDO fail (e.g. `SETUNDO OFF` then `UNDO`) and then be rescued by RECOVERY ON.
- The explanation "Sites differ: ISPF ships RECOVERY OFF and SETUNDO OFF, many installations turn them on" (module7-8.ts:233) contradicts the simulator's own default (SETUNDO ON) and is not IBM-backed (below).
- Glossary entry D (explain.ts:197) tells the learner "There is no undo in classic ISPF Edit" - the opposite of this lesson. A learner who reads Explain after lesson 20 gets contradictory instruction.

#### Simulator fidelity findings
1. **"RECOVERY journals your keystrokes" (seed) - inaccurate**. IBM: "RECOVERY sets edit recovery mode, which allows you to recover data after a system failure or power outage ... The system creates and updates a recovery data set for each change ... The editor begins recording an audit trail of your interactions" (EM "RECOVERY - Control Edit Recovery", p.266-267) and "Turning recovery mode on causes the data to be written to a temporary backup file" and it also records "temporary changes, such as excluding lines and defining labels" so UNDO can undo them (EM "Edit recovery", p.38-39). So: interactions/changes, not keystrokes (EV-A §2 row RECOVERY = PARTIAL). Glossary explain.ts:287 ("journals your changes ...") is closer to IBM than the lesson text.
2. **"here it is a profile flag that keeps UNDO available" - inaccurate**. IBM: "RECOVERY is now optional and is not required to run UNDO. Performance improves if the editor is run with SETUNDO STORAGE and RECOVERY OFF" (EM UNDO, p.287). "To use UNDO, you must have either RECOVERY on or SETUNDO on" (p.66, p.286). So RECOVERY ON is one of two enabling conditions, not what "keeps UNDO available"; and the sim's message `RECOVERY ON - CHANGES ARE RECORDED FOR UNDO` (primaryCommands.ts:72) and glossary "(and UNDO works)" overstate. The sim's own `undoAvailable = setundo || recovery` (history.ts:23-25) is correct as logic.
3. **"ISPF ships RECOVERY OFF and SETUNDO OFF" (seed; also docs/04:96-97, profile.ts:30) - not supported**. IBM: "ISPF does not ship any edit profiles"; new profiles come from the ISPF Configuration Table or ZDEFAULT, and the documented example is "Modes set off: RECOVERY ...; SETUNDO set to: STG" (EM "Edit mode defaults", p.21-22; EV-A §2 rows UNDO/SETUNDO/RECOVERY). `SETUNDO` is "ignored if UNDO from storage is not enabled by the installer" (EM p.278) and with UNDOSIZE=0 "warning messages will be shown informing you that UNDO is unavailable until RECOVERY is turned on" (EM p.66). So availability and defaults are installation-controlled; "ships OFF" is unsupported and the sim default (ON) is internally inconsistent with the lesson text.
4. **SETUNDO default differs from the lesson/docs claim (seed)**: sim `setundo:true` (profile.ts:31) vs lesson/docs "ships OFF". CONFIRMED internal contradiction; IBM example profile shows SETUNDO STG (on), consistent with the code but not with the text.
5. **"No undo in classic ISPF Edit" (explain.ts:197) - CONFIRMED false**: "UNDO - Reverse Last Edit Interaction" (EM p.286) and "Undoing edit interactions" (EM p.66); EM p.66 even refers to "ISPF/PDF Version 3.3 and previous releases" in which UNDO already existed (recovery-based). EV-A summary lists this as CONTRADICTS.
6. **UNDO scope / semantics**: "Each time you enter UNDO it undoes one interaction ... A single interaction might be a data change and Enter key, a data change and function key ..." (EM p.66) - SUPPORTED; "UNDO is reset by SAVE" (EM p.66, p.287) - SUPPORTED (history cleared on SAVE: session.ts:109); "Several line commands in one Enter are one interaction" - SUPPORTED (EM UNDO p.287). Differences not disclosed: (a) IBM "UNDO is not accepted if any line commands or data changes are also specified" (p.287) while the sim applies typed-over edits and prefix commands first, then UNDO (editor.ts:275-289); (b) IBM profile changes (CAPS, HEX, LEVEL...) are undone with the preceding data change (p.67, p.287) while the sim snapshots only lines/pending/special (history.ts:10-12); (c) IBM scrolls data fully left after UNDO (p.287); (d) "Changes made by initial edit macros" etc. out of scope.
7. **Message texts**: `UNDO COMPLETE`, `NO MORE TO UNDO`, `UNDO NOT AVAILABLE, SETUNDO OFF` (primaryCommands.ts:48-51): IBM EM names `UNDO RECYCLED`, `UNDO SUSPENDED`, `UNDO FROM RECOVERY` and says "a message informs you that there are no more interactions to undo" (p.66-67); exact texts for the sim's three messages - INSUFFICIENT EVIDENCE (ISPF Messages and Codes SC19-3622-70 not read).
8. **CANCEL**: "ends your edit session without saving any of the changes you have made ... CANCEL cancels all changes made since the beginning of the edit session or the last SAVE command" (EM CANCEL p.201-202 and "Ending an edit session" p.11-12; EV-A §2 row CANCEL = SUPPORTS). Sim `cancelEdit` ok (editor.ts:388-392). Optional "Confirm Cancel" panel not simulated.
9. **Persistent recovery state**: IBM "Recovery mode is remembered in your edit profile" (EM p.38). Sim persists (setProfile). SUPPORTED. Real RECOVERY ON also creates a recovery data set and the Edit Recovery panel after abends (EM p.38-39); explain.ts:288 discloses "no recovery data set is created".

#### Validation and assessment findings
- Step `delete` `EDITOR_LINE_DELETED` (any line), step `undo` `UNDO_EXECUTED`, step `recovery` `PROFILE_CHANGED && profile.recovery===true`, step `cancel` `EDIT_CANCELLED`: each is event-based and correct for the happy path. Step 3 would also pass if the learner undid some other change; acceptable.
- **Challenge default (CONFIRMED by probe c.probe.ts)**: last step `eventIs("EDIT_CANCELLED")` (module7-8.ts:241). Probe: open COBOL(HELLO) (not even the right member), type `CANCEL` -> `completed`. No deletion, UNDO or RECOVERY needed. `EDIT_CANCELLED` is also emitted by END under AUTOSAVE OFF NOPROMPT (editor.ts:355,378) and by PF12.
- **RECOVERY step is satisfied by a profile that already has recovery ON** (earlier attempt): step 4 passes on any `PROFILE_CHANGED` (e.g. `CAPS ON`) while `recovery===true`. Persisted state leaks between attempts.
- **Scenario isolation**: startingState resets only HELLO (module7-8.ts:209); the JCL profile is left with `recovery:true` permanently after the lesson (profileStore persistence) - never reset by lesson restart or by any later lesson; it is also the profile whose existence makes lesson 19's Challenge default pass immediately (see L19). If the learner earlier set `SETUNDO OFF` (e.g., following the docs) the UNDO step errors `UNDO NOT AVAILABLE, SETUNDO OFF` and counts as a mistake (MESSAGE_SHOWN error), and the lesson gives no remediation text except in the explanation. Lesson does not reset `setundo`.
- Test (lessons.test.ts:253-265): happy path only; does not test that RECOVERY ON affects anything.

#### Verified reference IDs and exact topics
- EM (https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54em00_v3r2.pdf): "UNDO - Reverse Last Edit Interaction" p.286-288; "Undoing edit interactions" p.66-67; "SETUNDO - Set the UNDO Mode" p.278-280; "RECOVERY - Control Edit Recovery" p.266-267; "Edit recovery" p.38-39; "Edit mode defaults" p.21-22; "CANCEL - Cancel Edit Changes" p.201-202; "Ending an edit session" p.11-12. EV-A §2 rows UNDO exists, SETUNDO, RECOVERY, CANCEL.

#### Confirmed deviations (disclosed?)
| Deviation | Disclosed? |
|---|---|
| RECOVERY described as keystroke journal / UNDO enabler | Partly ("here it is a profile flag"), but the stated effect is wrong |
| "ISPF ships RECOVERY/SETUNDO OFF" vs sim default SETUNDO ON | No (contradiction) |
| Glossary D: "no undo" | No |
| UNDO accepted together with typed edits; profile changes not undone with data | No |
| Persistent RECOVERY ON in JCL profile | No |
| Challenge = any CANCEL | No |

#### Recommended correction (minimum viable)
1. module7-8.ts:232-233: "On a real system RECOVERY ON writes a recovery data set so an interrupted session can be recovered; UNDO also works with SETUNDO ON alone. Whether UNDO is on by default depends on how your site configured ISPF (type PROFILE to see)." Delete "journals your keystrokes", "keeps UNDO available" and "ISPF ships ... OFF". Fix docs/04:96-97 and profile.ts:30 comment.
2. explain.ts:197: "UNDO (SETUNDO/RECOVERY must be on) reverses the last interaction; CANCEL abandons all changes since the last SAVE."
3. Make the RECOVERY step observable: start the lesson with `setundo:false` in the JCL profile (a `LessonStart` profile field) so `UNDO` first reports it is unavailable and `RECOVERY ON` (or `SETUNDO ON`) fixes it - or drop the RECOVERY step.
4. Add `challenge` validator: `eventIs("EDIT_CANCELLED", e => e.dsn===hlq+".JCL" && e.member==="HELLO")` plus requiring the preceding UNDO is impossible statelessly; minimum: restrict to JCL(HELLO).
5. Reset or restore the JCL profile at the end (`RECOVERY OFF`) or expose `LessonStart.resetProfiles`.

#### Priority and severity
P1 / High (wrong statements about RECOVERY, contradiction with glossary, Challenge trivial); P2 / Medium (default-profile claim, inert RECOVERY step, profile leak); P3 / Low (UNDO nuances).

#### Evidence and rationale
module7-8.ts:226,232-233; explain.ts:197,270-290; profile.ts:29-32; history.ts:23-25; primaryCommands.ts:46-52,71-74; probe c.probe.ts (Challenge); EM p.38-39,66-67,266-267,278-280,286-288. Confirmed defects: 7 (RECOVERY keystrokes; RECOVERY "keeps UNDO available"/inert step; "ships OFF" claim; sim default contradicts text; glossary "no undo"; Challenge trivial; persistent profile leak).

---

### Lesson 21 - l21-exclude-flip

| Field | Content |
|---|---|
| Lesson number and ID | 21 - `l21-exclude-flip` |
| Module and title | Module 8 "Editor power tools" - "Excluded lines, FLIP and RESET" |
| Learning objectives (from code) | In {HLQ}.COBOL(HELLO) exclude every line containing DIVISION, FLIP, then RESET. teaches: X / EXCLUDE ALL hides matching lines behind a marker; FLIP reverses which lines are hidden; RESET (or RESET X) redisplays everything; excluded lines are still in the data (module7-8.ts:252-253). |
| Source files | src/tutorial/lessons/module7-8.ts:246-288; src/editor/primaryCommands.ts:53-56,124-136,266-277; src/parsers/editorPrimaryCommand.ts:128-137,190-197; src/engine/screens/editor.ts:78-95; src/tutorial/validators.ts:20,23-28; src/tutorial/explain.ts:212-217,333-339; tests/tutorial/lessons.test.ts:266-278 |
| Technical accuracy status | **VERIFIED WITH LIMITATIONS** for the facts taught (EXCLUDE, FLIP, RESET semantics are IBM-backed); the assessment defects below (trivial Challenge, FLIP-alone pass) make the lesson **CORRECTION REQUIRED** on validation. Overall rating per the audit rule (any confirmed defect => CORRECTION REQUIRED): **CORRECTION REQUIRED (validation only; content accurate)** |

#### Educational quality findings
- This is the most technically accurate lesson of the set: the "hide what you know, read what is left" idea and the FLIP-as-table-of-contents trick match IBM's own use case ("if you have used the 'X ALL;FIND ALL xyz' command ... you can use FLIP to see the lines which do not contain the string", EM p.235).
- The seed member has only 7 lines and 4 DIVISION lines, so the effect is visible but tiny; "table of contents of the program" is optimistic for a 7-line program (judgement).
- The lesson never mentions `;` command stacking (IBM's FLIP example uses it) or the EXCLUDE operands ALL/FIRST/LAST/PREV/WORD/PREFIX; acceptable scope.
- Step 3 explanation relies on persisted bounds being default (see isolation).

#### Simulator fidelity findings
1. **EXCLUDE semantics**: SUPPORTED. "The EXCLUDE primary command hides lines that contain a search string from view and replaces them with a dashed line. To see the lines again, you enter either the FLIP, RESET or RESET EXCLUDED command" with aliases EXCLUDE EXCLUDED EXC EX X, and `ALL` "Starts at the top of the data and searches ahead to find all occurrences" (EM "EXCLUDE - Exclude Lines from the Display", p.230-231; EV-A §2 row EXCLUDE = SUPPORTS). Without ALL it excludes the next non-excluded line only (p.231): sim matches (`!all && n>0`, primaryCommands.ts:271).
2. **Unsupported EXCLUDE operands**: IBM accepts NEXT FIRST LAST PREV CHARS PREFIX SUFFIX WORD, columns and labels (p.230-231). Parser treats every non-ALL token as part of the search text (editorPrimaryCommand.ts:190-197): probe f.probe.ts Q3 `X DIVISION WORD ALL` -> `NO CHARS 'DIVISION WORD' FOUND`. Case-sensitive `C'...'` is not distinguished either. Undisclosed (docs/04 only says "EXCLUDE str [ALL]").
3. **FLIP semantics**: SUPPORTED. "FLIP excludes all lines that are currently visible, and makes all excluded lines visible" (EM "FLIP - Reverse Exclude Status of Lines", p.234-235; EV-A §2 row FLIP = SUPPORTS). Probe Q5: after `X DIVISION ALL` + `FLIP` the visible lines are exactly the four DIVISION lines. Differences: IBM FLIP also flips information/message/note lines and accepts a label range (`FLIP .A .B`); sim flips data lines only and ignores operands (primaryCommands.ts:53-56; parser `FLIP` ignores args). Undisclosed.
4. **RESET / RESET X / RESET EXCLUDED**: SUPPORTED. RESET with no operands "processes all operands except LABEL" and EXCLUDED "Redisplays any excluded line" (EM RESET, p.273-275); `RESET X` appears in IBM's DELETE example (EM DELETE example, p.223, "RESET X" before EXCLUDE ALL P'-'). Sim maps X/EXC/EXCLUDED (editorPrimaryCommand.ts:131).
5. **Excluded line marker**: "n Line(s) not Displayed" (EM RESET/HIDE, p.274). Sim prints `- - - ... n Line(s) not Displayed` (editor.ts:86-90). SUPPORTED (exact dash layout not compared).
6. **Bounds interaction**: EXCLUDE honours bounds (EM "Edit boundaries", p.23 list). Sim does (primaryCommands.ts:266-277). Consequence: a leftover narrow BOUNDS from lesson 18 makes this lesson's first step fail; probe Q2: with `BOUNDS 1 5` stored, `X DIVISION ALL` -> `NO CHARS 'DIVISION' FOUND`, and the lesson gives no pointer to PROFILE/BOUNDS. IBM behaves the same way, but the lesson sequence creates the condition silently.
7. Message texts `n LINE(S) EXCLUDED`, `EXCLUDED STATUS FLIPPED` (primaryCommands.ts:55,276): INSUFFICIENT EVIDENCE (messages book not read).
8. Excluded lines not erased: "The excluded lines are not erased. They are simply hidden from view" (EM X line command, p.188; EV-A §3). SUPPORTED.
9. **AUTOSAVE default wording (seed, relevant to the "leave" step and lesson 16)**: module3.ts:59 "AUTOSAVE ON (the default)", module3.ts:86 "(the default on most systems)", explain.ts:118 "(the usual default)", explain.ts:316 "is the usual default". IBM gives no universal default: a missing ZDEFAULT profile "is automatically generated with settings obtained from the ISPF Configuration Table", example "Modes set on: CAPS STATS NULLS NUMBER AUTOSAVE NOTE" (EM "Edit mode defaults", p.21; EV-A §2 row AUTOSAVE default = PARTIAL). "Most systems" cannot be verified: INSUFFICIENT EVIDENCE; say "typically ON (site-configurable)". Not a defect in lesson 21 text itself.

#### Validation and assessment findings
- **FLIP alone passes two steps (CONFIRMED by probe f.probe.ts Q1)**: step `exclude` accepts any `EDITOR_LINES_EXCLUDED` event, and `FLIP` emits that event (primaryCommands.ts:55) with count = all lines; because the runner feeds the same batch to following steps (engine.ts:49-62) and step `flip` accepts `COMMAND_ENTERED FLIP`, typing only `FLIP` on a fresh member advances to the RESET step (stepIndex 3 in the probe), skipping `X DIVISION ALL` entirely. Also `X 5`, `X PROGRAM`, or the prefix line command `X` pass step `exclude`: the string DIVISION is never validated (probe Q4: `X PROGRAM` emits the event).
- Step `flip` requires `command.toUpperCase() === "FLIP"` exactly; `FLIP .A .B`/`FLIP ALL` (valid IBM syntax with labels) would be rejected, although the lesson only asks for plain FLIP. Low.
- Step `reset`: `LINES_REDISPLAYED` (emitted only when excluded lines existed) OR state-only `lines.every(!excluded)`; the state-only branch passes whenever nothing is excluded, e.g. after a FLIP that excluded nothing.
- **Challenge default trivial (CONFIRMED by probe b.probe.ts)**: last step validator = `editorClosed` (module7-8.ts:285) -> `completed` on the first action (even an empty Enter) after start.
- **Scenario isolation**: no resetMembers (nothing is changed), no profile reset; depends on persisted COBOL profile from lesson 18 (fidelity 6). The learner's HELLO COBOL member may have been edited in earlier lessons (e.g. lessons 8-11 edit JCL HELLO; COBOL(HELLO) is used by 11/18) - if edited, `DIVISION` count changes; the lesson text hard-codes outcomes ("Now only the DIVISION lines are shown") that remain true. Low.
- Test (lessons.test.ts:266-278) runs the happy path only; would not detect FLIP-alone.

#### Verified reference IDs and exact topics
- EM (https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54em00_v3r2.pdf): "EXCLUDE - Exclude Lines from the Display" p.230-231; "FLIP - Reverse Exclude Status of Lines" p.234-235; "RESET - Reset the Data Display" p.273-275; "Edit boundaries" p.23; "X - Exclude Lines" p.188; "Edit mode defaults" p.21. EV-A §2 rows EXCLUDE, FLIP, RESET, AUTOSAVE default; EV-A §3 row X/XX.

#### Confirmed deviations (disclosed?)
| Deviation | Disclosed? |
|---|---|
| EXCLUDE operands (WORD/PREFIX/FIRST/LAST/PREV/columns/labels/C'') unsupported; parsed as text | No |
| FLIP ignores labels and special/note lines | No |
| Challenge trivial; FLIP alone satisfies exclude+flip | No |
| Leftover BOUNDS from L18 silently breaks step 1 | No |

#### Recommended correction (minimum viable)
1. Step `exclude` validator: replace with `allOf(eventIs("COMMAND_ENTERED", e => /^(X|EXC|EXCLUDE)\s+DIVISION\b/i.test(e.command)), eventIs("EDITOR_LINES_EXCLUDED"))`-style on the same batch, or state-based: `state.editor.lines.filter(l=>l.excluded).length === 4 && every excluded line matches /DIVISION/`.
2. Step `flip`: accept `^FLIP\b` and require state: DIVISION lines visible and non-DIVISION excluded.
3. Add `challenge: { task: "...", validator: allOf(editorOpen COBOL HELLO, no excluded lines) }` is also weak; require the closing batch to contain `LINES_REDISPLAYED` and the editor to be closed - cannot be stated statelessly; minimum viable: `eventIs("LINES_REDISPLAYED")`.
4. Reset or display the COBOL profile bounds at lesson start (profile-reset support) or add a note: "If the search says NO CHARS FOUND, type BOUNDS to reset any bounds left over from lesson 18."
5. docs/04 line 65: note unsupported EXCLUDE operands.

#### Priority and severity
Challenge trivial and FLIP-alone pass: P1 / High (assessment integrity); unsupported operands / FLIP differences: P3 / Low; bounds leakage: P2 / Medium.

#### Evidence and rationale
module7-8.ts:267,273,279,285; primaryCommands.ts:53-56,266-277; editorPrimaryCommand.ts:190-197; probes f.probe.ts Q1-Q5, b.probe.ts; EM p.23,188,230-231,234-235,273-275. Confirmed defects: 4 (FLIP-alone pass / unvalidated search string; Challenge trivial; unsupported EXCLUDE operands undisclosed; leftover-bounds trap) - content claims themselves are IBM-consistent.

---


## 6. Lessons 22 to 28

### Lesson 22

**Lesson number and ID:** 22 / `l22-dslist-advanced`
**Module and title:** Lists in depth / "DSLIST like an operator: SORT, FIND, EXCLUDE, S"
**Learning objectives (from code):** In DSLIST for {HLQ}: SORT LRECL D, FIND COBOL, EXCLUDE LOADLIB, S on {HLQ}.JCL, then RESET (module9-10.ts:27). Teaches: SORT field [A|D]; FIND/RFIND (PF5); EXCLUDE hides rows, RESET restores; "S = short information, I = full information" (module9-10.ts:28).
**Source files:** src/tutorial/lessons/module9-10.ts:21-68; src/engine/screens/dslistResults.ts:15-289 (esp. 54-59, 85, 176-180, 228-238, 246-270); src/engine/screens/datasetPanels.ts:159-186; tests/tutorial/lessons.test.ts:282-295; docs/05-course-design.md row 22; src/tutorial/validators.ts:57-60; src/tutorial/engine.ts:34-68.
**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- The S/I description is inverted (see D22-1); a learner repeats a false rule.
- Step 4 tells the learner "NX on it" but the "Not Displayed" marker row has no input field, so NX cannot be typed there (D22-2). RESET is the only way back in practice.
- Step 2 relies on seed data ("the load library with RECFM U shows 0", module9-10.ts:39): seed.ts:180 sets LOADLIB lrecl 0. Whether a real RECFM=U load library shows LRECL 0 in DSLIST is INSUFFICIENT EVIDENCE (not in EV-A/B/C or in the UG2 pages read).
- The lesson teaches `SORT LRECL D` with explicit D, which hides the real default-direction difference (D22-3).
- No lesson text says that 3.2 DSLIST has more sort fields (16) and two-field sorts; the learner is not told the simulator's SORT is a subset.

**Simulator fidelity findings**
- D22-1 (confirmed). Short info (S): sim omits the space figures and keeps General Data + "Number of members" (datasetPanels.ts:159-186, footer text line 185 "Short information omits the space and utilisation figures shown by I"). IBM: option S "differs from option I in two respects. Information for partitioned data sets ... lacks the number of maximum and used directory blocks, and the number of members. For sequential data sets, options I and S display the same information." (UG2 own grep, "S - short data set information", printed p.96; DSLIST S line command defers to it at printed p.152.)
- D22-2 (confirmed, internal). `entries()` replaces excluded runs with `{kind:"excluded"}` rows and `fields` only lists `kind === "ds"` rows (dslistResults.ts:85), so there is no command field on the marker; `NX` can only be typed on a visible data set row (which `NX` on a non-excluded row just filters out of the excluded list, a no-op, line 174-175). IBM: NX "unexclude data set ... one data set, or a set of data sets that have been excluded ... are re-shown" (UG2 own grep, printed p.153); message after X is "1 data set(s) not displayed" (printed p.139 message table). How the real panel presents the excluded block and where NX is typed is INSUFFICIENT EVIDENCE in the pages read.
- D22-3 (confirmed). `SORT LRECL` with no direction sorts ascending (`descending: dir === "D"`, dslistResults.ts:234). IBM Table 12: LRECL "Default Sequence: Descending", also BLKSZ, TRACKS, %USED, XT, CREATED, REFERRED descending; NAME, VOLUME, DSORG, RECFM ascending (UG2 own grep, "SORT command", printed p.161-162). Sim implements only 5 of 16 fields (NAME, DSORG, RECFM, LRECL, VOLUME; dslistResults.ts:18) and one sort key; IBM allows field1 + field2 (printed p.161).
- FIND: IBM "finds and displays a character string within the data set name", default operands NEXT and CHARS, X/NX limit the search (UG2 own grep, printed p.157). Sim FIND (name substring, wrap) is consistent for the lesson. PF5 = RFIND: RFIND exists (same page); the PF5 default is INSUFFICIENT EVIDENCE.
- EXCLUDE and RESET: IBM EXCLUDE "excludes data sets from a list based on a character string"; RESET "unexcludes data sets that were excluded ... and removes any pending line commands and messages" (UG2 own grep, printed p.157 and p.159). Sim consistent.
- Step 1 inherits the Dsname Level caveat: with 3.2's "Include Additional Qualifiers" unchecked, level `{HLQ}` lists only the exact name (EV-A §6, UG2 p.128-133). The simulator's behaviour matches only the checked case.
- `Z` (compress) in the same panel returns "COMPRESS COMPLETED" with no state change (dslistResults.ts:176-181); labelled "(simulated)" only in the long message. Not used by this lesson.

**Validation and assessment findings**
- `open-dslist` accepts any level starting with the userid (module9-10.ts:35); fine.
- `short-info` accepts S on ANY data set (`e.short === true`, line 59) although the instruction says {HLQ}.JCL.
- `exclude` accepts any exclusion event; `find` accepts any successful find; `sort` accepts any field (SORT NAME passes though the text says LRECL D). Low-severity looseness.
- `reset` is satisfied by a bare RESET with nothing excluded (LIST_RESET emitted unconditionally, dslistResults.ts:265-269).
- Challenge/default final-step validator is `eventIs("LIST_RESET")`, so the first RESET typed in any DSLIST completes the lesson.
- tests/tutorial/lessons.test.ts:282-295 is a happy-path walk only; no test for wrong S/I content, NX on marker, or sort default direction.

**Verified reference IDs and exact topics**
- UG2 SC19-3628-70, z/OS 3.2, "Data set list utility (option 3.4)": "S - short data set information" printed p.96; line commands "S - information (short)" p.152, "X - exclude data set", "NX - unexclude data set" p.153; primary commands EXCLUDE p.157, FIND and RFIND p.157, RESET p.159, SORT p.161-162 (Table 12). https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54u200_v3r2.pdf (UG2 own grep).
- EV-A §6 rows "Dsname Level semantics" and "3.4 member-list and data set line commands" (UG2 p.128-133, p.147-).

**Confirmed deviations (disclosed?)**
- D22-1 short vs full info inverted: NOT disclosed (lesson and panel state the wrong rule).
- D22-2 NX on marker unreachable: NOT disclosed.
- D22-3 SORT default direction and field subset: NOT disclosed.
- Z compress no-op: partly disclosed ("simulated" in message).

**Recommended correction (minimum viable)**
1. Replace module9-10.ts:57 and datasetPanels.ts:159/185 text with: "S is the short form of I; for a PDS it leaves out the directory-block and member counts." Make `shortInfo` keep space figures and drop `Number of members`/directory rows for a PDS.
2. Change module9-10.ts:51 to "RESET (or NX on a displayed data set that was excluded earlier) brings it back" or give the marker row an NX field.
3. Make `SORT LRECL` default descending per Table 12 (or state "SORT LRECL D" is always typed explicitly in this simulator); add one line in the lesson that 3.2 offers more sort fields.

**Priority and severity:** P1 / High (S/I inversion); NX unreachable P2 / Medium; SORT default P2 / Medium.
**Evidence and rationale:** module9-10.ts:28,57; datasetPanels.ts:159-186; dslistResults.ts:18,85,174-175,234; UG2 printed p.96, p.153, p.157-162 (own grep); EV-A §6.

---

### Lesson 23

**Lesson number and ID:** 23 / `l23-member-info`
**Module and title:** Lists in depth / "Member statistics: I and G"
**Learning objectives (from code):** On the member list of {HLQ}.JCL, show the statistics of HELLO with I, reset them with G, and look again (module9-10.ts:76). Teaches: statistics live in the PDS directory; I shows VV.MM, created, changed, size, user; G resets to 01.00 / today / you; STATS OFF in the profile stops the editor updating them (module9-10.ts:77-78).
**Source files:** src/tutorial/lessons/module9-10.ts:70-115 (esp. 77-78, 88-89, 103-106); src/engine/screens/memberList.ts:142-153; src/engine/screens/memberInfo.ts:12-60; src/catalog/catalog.ts:158-190,296-310; src/catalog/seed.ts:10-20,71-76; tests/tutorial/lessons.test.ts:296-309.
**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- Explanation at module9-10.ts:89, "Every save with STATS ON bumps the modification level and stamps your userid - the audit trail operators rely on", is wrong on two points (D23-1, D23-2).
- "STATS OFF ... stops the editor updating them" (line 78) contradicts IBM (D23-3).
- Starting state has no `resetMembers` (module9-10.ts:79). HELLO's `mod` depends on earlier lessons (L8/L9 save HELLO and increment mod); if the learner never saved HELLO, `mod` is already 0 and G changes only the dates, so the objective "look again" shows nothing to compare (D23-5).
- Step 4 text says "Version.Mod is now 01.00, created and changed today, by you" yet seed HELLO is already 01.00 / owner userid, so only the dates change in the clean case.

**Simulator fidelity findings**
- D23-1 (confirmed). Modification level increments on every save: `mod: (existing.mod ?? 0) + 1` (catalog.ts:185), even if nothing changed, and with no cap at 99. IBM: "The number is automatically incremented by one when the first change is made to the data ... After the modification level number reaches 99, it does not increment" and incrementing is suppressed in listed cases (EM "Statistics for PDS members", EV-A §6 row "audit trail", EM printed p.25-27; EM PDF 58 text: "The editor normally increments the modification level the first time that data is changed").
- D23-2 (confirmed). "audit trail operators rely on": IBM never says this; its words are "These numbers can be useful in controlling library members"; IBM uses "audit trail" only for RECOVERY (EV-A §6 row "ISPF statistics 'audit trail operators rely on'" = PARTIAL/OVERSTATED).
- D23-3 (confirmed). STATS OFF: IBM "If STATS mode is off when you save a member, any previous statistics are lost" (EV-A §2 row STATS, EM p.283). Sim `keepStats` preserves the old stats when `stats === false` (catalog.ts:181-183). The lesson and the sim both state the opposite.
- D23-4 (confirmed). `G` resets immediately with an info message (memberList.ts:147-153; catalog.ts:296-310). IBM: "If you enter line command G, the Reset Member Statistics panel is displayed where you can enter the action to be performed and any additional options for the reset action" (UG2 own grep, "G - reset member statistics", printed p.100 and the chained-commands list p.150; the options include Reset Date/Time, Reset Number of Lines, Reset Mod Level, New Version Number, printed p.164-165). Not disclosed anywhere (docs/03 not read for this; lesson says "G resets them to 01.00 / today / you").
- D23-5 (confirmed). The panel line "Modified lines . . : <mod>" (memberInfo.ts:47) prints the modification level as a line count; IBM treats "Number of Modified Lines" as a separate statistic (UG2 own grep, Reset ISPF statistics, printed p.165, "Current Number of Lines, the Initial Number of Lines, and the Number of Modified Lines"). "Initial size" is set equal to current size (memberInfo.ts:45-46) and the time is fixed "00:00" (memberInfo.ts:44; memberList.ts:32). Panel layout/field labels vs IBM: INSUFFICIENT EVIDENCE (the Member Information panel figure was not read).
- Option range: IBM documents G, I, J as line commands "on a member list that you display from the Library Utility panel" (option 3.1) (UG2 printed p.100, p.150; EV-A §6 rows `Library member list G` and `Member I`). The lesson opens the list from option 2 or 3.4 M. Whether those lists accept I and G is INSUFFICIENT EVIDENCE.
- Batch writes: `saveRecords` called from IEBGENER/SORT writes (programs.ts:53) go through the same stats bump (no `stats:false`), so a job writing a member bumps ISPF stats; the panel footer (memberInfo.ts:51) says other programs may leave them unchanged. Internal inconsistency, outside this lesson's path.

**Validation and assessment findings**
- `info-again` requires `mod === 0` (module9-10.ts:105). Seed HELLO has mod 0, so the check can pass trivially if the learner never saved HELLO; it proves the G event happened only because the previous step required it.
- `leave` uses `onScreen("MEMBER_LIST")`, which is state-only; Challenge/default (last step) completes the moment any member list is shown, i.e. step 1 alone.
- tests/tutorial/lessons.test.ts:296-309 only walks the happy path; no assertion on mod increment rule, STATS OFF, or G panel.

**Verified reference IDs and exact topics**
- EV-A §6: "I - display member information" and "G - reset member statistics", UG2 SC19-3628-70 p.100; "Statistics for PDS members", EM SC19-3621-70 p.25-27.
- EV-A §2: "STATS - Generate Library Statistics", EM p.283.
- UG2 own grep: member list line commands (G, I, J, M, ... "on a member list that you display from the Library Utility panel"), printed p.100 and p.150; Reset ISPF Statistics utility (option 3.5) fields, printed p.164-165. URL https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54u200_v3r2.pdf.

**Confirmed deviations (disclosed?)**
- Mod level bumped on every save: NOT disclosed (explicitly taught).
- STATS OFF keeps stats: NOT disclosed (explicitly taught).
- G resets with no panel: NOT disclosed.
- Fixed time 00:00: disclosed in docs/10 ("Times are not modelled") for JES; for member stats not found in the files read.

**Recommended correction (minimum viable)**
1. Rewrite module9-10.ts:89 to: "With STATS ON the editor adds one to the modification level the first time you change a member in a session and stamps your userid. Operators use the numbers to control library members." Make `saveRecords` bump `mod` only when records changed and cap at 99.
2. Rewrite module9-10.ts:78 to "Saving with STATS OFF discards the member's statistics" and make `keepStats` clear the stats (or remove the sentence).
3. Add `resetMembers: HELLO` to lesson 23 startingState and give HELLO a non-zero seed mod (or have step 1 save it) so G produces a visible change; relabel "Modified lines" or drop it.
4. State in the G step that real ISPF shows a Reset Member Statistics panel first (one-line disclosure).

**Priority and severity:** P1 / High (STATS OFF and per-save bump taught as fact); G panel P2 / Medium; Member Info panel labels P3 / Low.
**Evidence and rationale:** module9-10.ts:78,89,105; catalog.ts:181-185,296-305; memberInfo.ts:44-47; memberList.ts:147-153; EV-A §2, §6; UG2 printed p.100,150,164-165 (own grep).

---

### Lesson 24

**Lesson number and ID:** 24 / `l24-submit`
**Module and title:** Batch jobs and SDSF / "Submit your first job"
**Learning objectives (from code):** Open {HLQ}.JCL(HELLO) in Edit, read the JOB and EXEC statements, SUBMIT it, note the job id in the message (module9-10.ts:123). Teaches: `//name JOB, //step EXEC PGM=, //dd DD`; SUBMIT sends JCL to JES; JES answers `JOB name(JOBnnnnn) SUBMITTED`; the job id is how you find the job in SDSF (line 124). Starting state resets jobs and HELLO (line 125).
**Source files:** src/tutorial/lessons/module9-10.ts:117-148; src/engine/screens/editor.ts:318-322; src/engine/jesActions.ts:14-31; src/jes/submit.ts:124-244; src/catalog/seed.ts:71-76; src/parsers/editorPrimaryCommand.ts:139-141; src/tutorial/explain.ts:397-402; docs/10-jes-sdsf.md:25-28; docs/adr/0012-virtual-jes.md:24-25; src/components/coach/LearningPanel.tsx:76; tests/tutorial/lessons.test.ts:310-318; tests/engine/sdsf.test.ts:8-14.
**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- `teaches` lists `//dd DD` (line 124) but HELLO has no DD statement (seed.ts:71-76: JOB, continuation, EXEC PGM=IEFBR14, `//`). The lesson teaches a statement type it never shows.
- The explanation says IEFBR14 exists "to let JCL allocate or delete data sets" (line 130). That is supported (EV-B §5, JCL UG SA23-1386-70 p.32-33: "IEFBR14 ... does not actually process any data"), but the mechanism is DISP on a DD, which the lesson never shows (known seed "L24 doesn't teach DISP": CONFIRMED).
- Good: the lesson discloses that real jobs wait for an initiator and this one runs at once (line 137).
- The glossary entry for SUBMIT (explain.ts:400) carries a false statement about real ISPF (D24-1); it is shown through Explain, not in the step text.

**Simulator fidelity findings**
- D24-1 (confirmed; the claim is wrong, not the behaviour). explain.ts:400, editor.ts:319, docs/10:27-28 and ADR 0012:25 say "real ISPF submits the data set on disk, so an unsaved change is not submitted; the simulator submits the buffer (documented deviation)". IBM's Edit SUBMIT page: "The SUBMIT primary command submits the member or data set you are editing", with optional label-range, X and NX operands that only make sense on the in-session data (EV-A §1 row 1; EM SC19-3621-70 p.283-284; https://www.ibm.com/docs/en/SSLTBW_3.2.0/com.ibm.zos.v3r2.f54em00/submit.htm). The page does not say whether unsaved edits are included. The "submits the on-disk copy, not the copy being browsed" wording is IBM's text for BROWSE SUBMIT (UG2 p.80; EV-A §1 row 2). So the buffer behaviour is consistent with IBM text and the "deviation" label is unsupported; whether a SAVE is required first is INSUFFICIENT EVIDENCE.
- D24-2 (confirmed). `SUBMIT` ignores all operands (`return { kind: "submit" }`, editorPrimaryCommand.ts:139-141), so `SUBMIT 5 10`, `SUBMIT .A .B X` submit the whole buffer silently. IBM documents label/line-pointer ranges and X/NX (EV-A §1). Undisclosed.
- D24-3 (confirmed). The job's `source` is set to the member even when the submitted buffer differs from the saved member (editor.ts:321; probe G below), while types.ts:34 documents `source` as "undefined for an unsaved editor buffer". Consequence in lessons 27-28 (see there).
- Confirmation message: IBM IKJ56250I `JOB jobname(jobid) SUBMITTED` (EV-A §1 row "Confirmation message"; TSOMSG SA32-0970-70 p.544). The Edit panel short message in the simulator is `JOB USER01H(JOB00001) SUBMITTED` without the `IKJ56250I` id (jesActions.ts:27); the id appears only in the long message. How real ISPF shows it on the Edit panel is INSUFFICIENT EVIDENCE.
- Job id `JOB00001`: matches JES2 `CCCNNNNN` (EV-B §4, JES2 Init & Tuning Reference SA32-0992-70 JOBDEF RANGE); numbering restarts at 1 on lesson start (resetJobs) which real JES2 would not do. Disclosed by simulator framing only.
- Output content (probe B, HELLO): JESMSGLG lines carry ` 2026/10/15` date prefix with no time and no job id; IBM JCL UG sample prefix is ` 15.21.28 JOB17653  IEF403I SORT - STARTED - TIME=15.21.28` (SA23-1386-70 ieab500_v3r2.pdf PDF p.35, own grep; EV-B §4 "Typical line format" CONTRADICTS). IEF374I prints `RC=0000`; IBM IEF374I has no return code (EV-B §2.2). Not exercised by the lesson text.
- JOB card `NOTIFY=&SYSUID` is valid JCL; the simulator does not simulate a notify message. Low.

**Validation and assessment findings**
- `submit` accepts `JOB_SUBMITTED{from:"EDIT"}` for any submission from any Edit session (not just HELLO); `leave` is `editorClosed` (state only).
- Challenge mode: no `challenge` field, so the last step's validator `editorClosed` is used, and LearningPanel shows the lesson objective (LearningPanel.tsx:76). Probe A: `Coached(l24, "challenge"); cmd("2")` completes the lesson on the first action with screen EDIT_ENTRY and no editor open. CONFIRMED trivial pass (known seed "L24 Challenge default editorClosed trivial").
- Tests (lessons.test.ts:310-318, sdsf.test.ts:8-14) are happy-path; sdsf.test.ts:8-9 asserts "SUBMIT in Edit runs the buffer", which locks the unsupported "deviation" rather than IBM behaviour.

**Verified reference IDs and exact topics**
- EV-A §1 rows 1-4: "SUBMIT - Submit Data for Batch Processing", EM SC19-3621-70 p.283-284 (z/OS 3.2); Browse SUBMIT UG2 SC19-3628-70 p.80; IKJ56250I TSOMSG SA32-0970-70 p.544.
- EV-A §7: "SUBMIT command" TSOCR SA32-0975-70 p.269-273.
- EV-B §5: IEFBR14, JCL User's Guide SA23-1386-70 p.32-33; EV-B §1.4 "Null statement" JCL Reference SA23-1385-70 book p.459; EV-B §4 JES2 job id format.
- Own grep: JCL UG sample JESMSGLG/JESYSMSG, ieab500_v3r2.pdf PDF p.35.

**Confirmed deviations (disclosed?)**
- "Real ISPF submits disk copy" claim: disclosed as a deviation but the premise is unsupported by IBM (EV-A §1).
- SUBMIT operands ignored: not disclosed.
- Job runs at once: disclosed.
- Log line prefix/IEF374I RC=: docs/10 says "Times are not modelled (dates only)" (partly disclosed); IEF374I RC= not disclosed.

**Recommended correction (minimum viable)**
1. Replace explain.ts:400, editor.ts:319, docs/10:27-28 and ADR 0012:25 with: "SUBMIT in Edit submits the data you are editing (IBM: 'the member or data set you are editing'). Save first if you want the member on disk to match." Drop "documented deviation".
2. Reject or ignore SUBMIT operands visibly (`NOT SUPPORTED` message) instead of silently submitting everything.
3. Add an `Challenge` check to lesson 24: `challenge: { task, validator: allOf(eventIs("JOB_SUBMITTED"), editorClosed) }` is not state-only; use a state check such as `state.jes.jobs.some(j => j.jobName === `${userid}H`)` plus `editorClosed`.
4. Edit step 1 text: add a DD (e.g. use a SYSPRINT DD SYSOUT=*) or remove `//dd DD` from `teaches`.

**Priority and severity:** P1 / Medium (false claim about IBM behaviour in glossary/docs); trivial Challenge P2 / Medium; SUBMIT operands P3 / Low; DD teaching gap P3 / Low.
**Evidence and rationale:** editor.ts:318-322; explain.ts:400; EV-A §1; probes A, B, G; seed.ts:71-76.

---

### Lesson 25

**Lesson number and ID:** 25 / `l25-sdsf-status`
**Module and title:** Batch jobs and SDSF / "SDSF: where did my job go?"
**Learning objectives (from code):** Submit {HLQ}.JCL(HELLO) with J, jump to SDSF with =S, open ST, find the job with CC 0000 and browse its output with S (module9-10.ts:156). Teaches: J on a member list submits; ST lists JOBNAME, JobID, Owner, Max-RC; CC 0000 means every step ended 0; S browses all the job's output (line 157). Starting state resets jobs only (line 158).
**Source files:** src/tutorial/lessons/module9-10.ts:150-193; src/engine/screens/memberList.ts:154-158; src/engine/screens/sdsf.ts:24-148, 150-235; src/engine/jesActions.ts:38-52; src/jes/submit.ts:124-251; src/tutorial/explain.ts:354-360; docs/10-jes-sdsf.md:29-48; tests/tutorial/lessons.test.ts:319-333; tests/engine/sdsf.test.ts:27-38,72-91.
**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- Step 3 tells the learner the option letter "varies by site - S, SD or M.5" (module9-10.ts:174; also sdsf.ts:65, explain.ts:358, docs/10:37). IBM documents `S` from the ISPF Primary Option Menu "or the ISPF primary menu option that is configured at your site" (SDSF User's Guide SC27-9028-70 ch.1 p.1), and `TSO SDSF`/`TSO ISF` (p.2); SDSF O&C SA23-2274-70 p.447: option 13.14 ships with ISPF and "Many installations prefer to add option S". `SD` is NOT FOUND in any fetched doc; `M.5` is Redbook-era (EV-C h1-h3). So "SD" is unsupported and "M.5" is old.
- Step 3 explanation says "ST shows every job you own; OWNER * would show everyone's" (line 175). IBM: shipped PREFIX/OWNER default is NONE = all jobs; USERID is a site option (SDSF O&C SA23-2274-70 printed p.29; EV-C d3). The simulator's OWNER = userid default is a simplification stated as how SDSF works. PARTIAL.
- Preconditions: starting state resets jobs only, not HELLO (line 158). Probe C: when HELLO was overtyped to IEBGENER (lesson 8's edit) the J-submitted job ends `CC 0012` (IEC130I SYSUT1 DD STATEMENT MISSING) while step 4 says "Find {HLQ}H with Max-RC CC 0000". The step still passes (any S without ddname), so the learner sees a mismatch and no coaching. CONFIRMED conditional on earlier-lesson state (known seed "L25 doesn't reset HELLO"). Lessons 9, 15 and 20 do reset HELLO at their start but may leave it altered at their end (module3.ts:101, module6.ts:16, module7-8.ts:209).
- Explanation (line 182) pastes `$HASP373 STARTED ... IEF142I STEP WAS EXECUTED - COND CODE 0000 ... $HASP395 ENDED - RC=0000: that is a healthy job log` as one log; in the simulator and in IBM's sample IEF142I is in JESYSMSG, not JESMSGLG (JCL UG ieab500 PDF p.35, own grep). Minor wording issue.

**Simulator fidelity findings**
- F25-1 (confirmed). JESMSGLG lines: simulator ` 2026/10/15 $HASP373 USER01H  STARTED - INIT 1    - CLASS A - SYS SYS1`, `IEF403I USER01H - STARTED` (probe B). IBM sample: ` 15.21.28 JOB17653  IEF403I SORT - STARTED - TIME=15.21.28` and `$HASP395 SORT  ENDED` (JCL UG SA23-1386-70 PDF p.35, own grep; EV-B §4 row "Typical line format": CONTRADICTS: time + job id prefix, TIME= field). `$HASP395 ... ENDED - RC=0000` vs documented `jobname ENDED RC= nnnn` family: EV-B §2.4 PARTIAL. The `... ENDED - JCL ERROR` form is not a documented $HASP395 variant (EV-B §2.4).
- F25-2 (confirmed). Job Data Set panel DSIDs: simulator numbers rows 2,3,4,5,... (sdsf.ts:314: `frame.top + i + 2`). IBM JCL UG sample: JESMSGLG 2, JESJCL 3, JESYSMSG 4, step SYSOUT 103, SORTOUT 104 (ieab500_v3r2.pdf PDF p.43, own grep, printed p.21); SDSF UG example DSIDs 2/3/4 for JES data sets (EV-C e). Step-output DSIDs differ. Also the DSID/StepName/Dest columns beyond that are static ("LOCAL").
- F25-3 (confirmed). ST row: fixed `Prty 15`, fixed Queue `PRINT`, `Pos` = sequence within the day, extra `Date` column (sdsf.ts:137-146); header `NP JOBNAME JobID Owner Prty Queue C Pos Max-RC Date` (line 169). IBM default ST columns `NP JOBNAME JobID Owner Prty Queue C Pos SAff ASys Status` with Max-RC available; "Date" is not an ST title (Rd-Date/End-Date); JCL UG sample shows Prty 7 and "Print" (SDSF UG SC27-9028-70 Table 284 p.301-308; JCL UG p.21; EV-C b). Prty 15/Queue PRINT as universal defaults: INSUFFICIENT EVIDENCE (sample values differ). Real Pos is a queue position.
- F25-4. `S` on ST opens one Browse of all data sets with banner lines (jesActions.ts:41). IBM: S "Display the data sets associated with the job" (SDSF UG Table 283 p.303-305; EV-C c1) and Redbook "the JES2 job log is displayed". Banner text is invented; exact real layout INSUFFICIENT EVIDENCE.
- F25-5. `H` -> O and `I` -> ST aliases (sdsf.ts:36-47), DA/PR/INIT "not available": IBM has separate I, H, DA, PR, INIT panels (EV-C a1, a2). Disclosed on the menu rows and in the message ("H SHOWN AS O"), so it is a documented simplification.
- F25-6. `PREFIX name` (no star) is a prefix match in the simulator (sdsf.ts:117; probe H: `PREFIX USER01` and `PREFIX USER` both list USER01H); IBM: bare name is an exact match, `name*` is the prefix form (SDSF UG p.20-21 and PREFIX command p.522-523; EV-C d1, d2). `OWNER` with no operand resets to userid (sdsf.ts:248); IBM: no operand = all (`OWNER *`) (EV-C d4). Not used in this lesson but tests lock it (sdsf.test.ts:78-82).
- F25-7. `J` on the member list: IBM documents J as a line command "on a member list that you display from the Library Utility panel" (UG2 SC19-3628-70 printed p.100; EV-A §6). The lesson reaches the list through option 2; availability there is INSUFFICIENT EVIDENCE.
- F25-8. Jobs that fail JCL conversion/allocation are excluded from the O panel (sdsf.ts:118: `job.status === "OUTPUT"`) while holding spool output; IBM does not say they are absent (EV-C f2 UNRESOLVED; EV-B §4 last rows: a JCL-error job ends with spool output). Contradicts the panel's own help text "O only those with output" (sdsf.ts:152). Inference only.

**Validation and assessment findings**
- `open-sdsf`: `JOB_STATUS_OPENED` is also emitted for `I`, `H` and `O` (sdsf.ts:42-45), so the step accepts them although it says ST.
- `browse`: accepts S on any job (even a failed one), not the CC 0000 job.
- `leave`: `onScreen("SDSF_MENU")` state-only. Challenge/default is this validator, so `=S` alone completes the lesson (probe A2: screen SDSF_MENU, status completed).
- Tests: lessons.test.ts:319-333 happy path (hard-codes `cmd:JOB00001`); sdsf.test.ts:78-82,92-98 assert the OWNER/PREFIX/H/I simplifications as correct behaviour. They establish self-consistency only.

**Verified reference IDs and exact topics**
- EV-C Part 2: a1 "Understanding the SDSF main panel" (SC27-9028-70 p.4-5); a2 "Monitoring jobs" (p.35); b "Status panel (ST)" / Table 284 (p.301-308, JCL UG p.21); c1 Table 283 "ST command action characters" (p.303-305); d1-d3 "Filtering, sorting, and arranging panel information" (p.20-21), "PREFIX" (p.522-523), SDSF O&C SA23-2274-70 p.29; e "Job Data Set panel (JDS)" (p.343-346); h1-h3 "Invoking SDSF from ISPF" (p.1), "Invoking SDSF from TSO" (p.2), O&C p.447. URL https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/isfa600_v3r2.pdf.
- EV-B §4: JES2 Init & Tuning Ref SA32-0992-70 JOBDEF RANGE (p.185); SDSF Table 286 Max-RC values.
- EV-B §2.4: $HASP100/373/395, JES2 Messages SA32-0989-70 p.125/307/310.

**Confirmed deviations (disclosed?)**
- JESMSGLG prefix (date, no time/job id): not disclosed except "Times are not modelled".
- DSID numbering, Prty/Queue/Pos/Date: not disclosed individually; "(SIMULATED)" and docs/10 "No ... priorities" cover it loosely.
- H/I/DA/PR/INIT aliasing: disclosed.
- PREFIX/OWNER semantics: not disclosed.
- SD / M.5: asserted as fact, not a disclosed deviation.

**Recommended correction (minimum viable)**
1. Reword module9-10.ts:174 and sdsf.ts:65, explain.ts:358, docs/10:37 to "S on the ISPF Primary Option Menu, or the option your site configures (13.14 in the standard ISPF menu), or TSO SDSF". Remove `SD`.
2. Reword module9-10.ts:175 to "ST lists jobs matching the PREFIX and OWNER filters; this simulator starts with OWNER = your userid".
3. Add `resetMembers: [{ dsn: "{HLQ}.JCL", member: "HELLO" }]` to lesson 25 startingState.
4. Change JESMSGLG prefix to `hh.mm.ss JOBnnnnn` and add ` - TIME=hh.mm.ss` to IEF403I/IEF404I (EV-B §4).
5. Make step `browse` require the CC 0000 job: `eventIs("JOB_OUTPUT_OPENED", ...)` plus a check that the job opened has `maxRc === 0`.

**Priority and severity:** P2 / Medium (SD/M.5 and OWNER explanation); HELLO precondition P2 / Medium; JESMSGLG format P2 / Medium; Challenge trivial P2 / Medium; DSID/ST column fidelity P3 / Low.
**Evidence and rationale:** module9-10.ts:158,174-175; sdsf.ts:36-47,117,137-146,314; submit.ts:134-156; EV-C a1,b,d1-d4,e,h1-h3; EV-B §4; probes A2, B, C, H.

---

### Lesson 26

**Lesson number and ID:** 26 / `l26-job-output`
**Module and title:** Batch jobs and SDSF / "Reading job output data set by data set"
**Learning objectives (from code):** Submit {HLQ}.JCL(SORTJOB) with TSO SUBMIT, open SDSF ST, list its data sets with ?, browse SORTOUT, then JESMSGLG (module9-10.ts:201). Teaches: TSO SUBMIT dsn(member) from any command line; ? lists JESMSGLG, JESJCL, JESYSMSG and the SYSOUT DDs; program output lives in the DD the program wrote; JESMSGLG has the step return codes (line 202). Starting state resets jobs only (line 203).
**Source files:** src/tutorial/lessons/module9-10.ts:195-243; src/engine/screens/tsoCommand.ts:60-139 (qualify at line 65, submit at 127-139); src/parsers/tsoCommand.ts:56-59; src/catalog/seed.ts:106-117,166-171; src/jes/programs.ts:113-160; src/jes/submit.ts:124-244; src/engine/screens/sdsf.ts:205-235,281-347; tests/tutorial/lessons.test.ts:334-349; tests/jes/jes.test.ts:65-72.
**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- Step 4 asks the learner to look at "the employee records, sorted" in SORTOUT (line 226). The seed employee data is already in ascending order of the sort key, so SORTOUT is byte-identical to the input (probe D: `E00001ADAMS ... E00004DIAZ` in both). The learner cannot observe that a sort occurred (CONFIRMED; seed.ts:166-171 with SORT FIELDS=(1,10,CH,A) at seed.ts:114).
- The lesson names the data sets as "JESMSGLG, JESJCL, JESYSMSG, SYSOUT and SORTOUT" (line 219); the simulator lists SORTOUT before SYSOUT (probe D: `JESMSGLG, JESJCL, JESYSMSG, SORTOUT, SYSOUT`) because programs.ts writes SORTOUT first. Cosmetic.
- "JESMSGLG has the step return codes" (line 202) is supported: IBM's JCL User's Guide sample JESMSGLG contains a step table with column `CC` (SA23-1386-70, ieab500_v3r2.pdf PDF p.35, own grep). The lesson then tells the learner to look for "RC=0000" (line 232), which is the simulator's `$HASP395 ... ENDED - RC=0000`; IBM's sample `$HASP395 SORT  ENDED` carries no RC, and EV-B §2.4 documents `jobname ENDED RC= nnnn` variants (PARTIAL). Both texts exist in IBM material; the "timings table" the lesson mentions has different headings in the simulator (see below).
- The lesson explains that "Every DD with SYSOUT=* becomes a spool data set" (line 220), which is correct and a good teaching point (EV-B §4 and JCL Reference JESDS notes).

**Simulator fidelity findings**
- F26-1 (confirmed deviation in code, partly INSUFFICIENT on IBM side). `qualify()` prefixes the userid only when the name has no dot and does not start with the userid (tsoCommand.ts:65), so an unquoted dotted name (`JCL.CNTL(X)`) is not prefixed. IBM: "When you specify only the user-supplied name, the system adds the prefix specified in your user profile ... and, whenever possible, a descriptive qualifier"; the DELETE example `DELETE Z.Y` fails because it tries to delete 'SAM1.Z.Y' (TSOUG SA32-0971-70 p.19-20; TSOCR SA32-0975-70 p.71; EV-A §7 rows "SUBMIT data set naming" and "Unquoted names and PROFILE PREFIX"). The simulator also never adds a descriptive qualifier. Whether `SUBMIT JCL(SORTJOB)` resolves to `USER01.JCL(SORTJOB)` (what the lesson says, line 207) or to a name with a descriptive qualifier such as CNTL is INSUFFICIENT EVIDENCE ("default descriptive qualifier CNTL for SUBMIT" UNRESOLVED, EV-A §7).
- F26-2 (confirmed). The step table in JESMSGLG is `--TIMINGS (MINS.)--` / `JOBNAME STEPNAME PROCSTEP RC EXCP CPU SRB CLOCK` (submit.ts:157), while the z/OS 3.2 JCL User's Guide sample shows `--- STEP TIMINGS ---` with `STEPNAME PROCSTEP PGMNAME CC USED CPU TIME ELAPSED TIME EXCP SERV PAGE SWAP VIO SWAPS` (own grep, ieab500 PDF p.35). Each JESMSGLG line is prefixed with the date only, not `hh.mm.ss JOBnnnnn` (EV-B §4; same CONTRADICTS as lesson 25 F25-1).
- F26-3 (confirmed). IEF374I is printed with `RC=0000` (submit.ts:208); IBM's IEF374I carries no return code (EV-B §2.2, Vol 8 p.245). IEF237I uses the volser (`USR001 ALLOCATED TO SORTIN`, probe D) where IBM uses a device number, and `JES2 ALLOCATED TO` for SYSOUT/SYSIN is correct (EV-B §2.2 row IEF237I). IEF285I is not produced for SYSIN/SYSOUT data sets, which IBM's sample prints (`IEF285I userid.SORT.JOB17653.D0000103.?  SYSOUT`, own grep PDF p.35). These lines are in JESYSMSG, not read in this lesson.
- F26-4. DFSORT messages in the SYSOUT DD: `ICE000I 0 - CONTROL STATEMENTS FOR 5650-ZOS, Z/OS DFSORT (SIMULATED)` (programs.ts:114); IBM text is `5655-ZOS` with a time/date field (EV-B §2.6, ICEM100 p.31 CONTRADICTS). `ICE026A` used for missing DDs does not exist in IBM docs (ICE026I is the SMF message; closest real message ICE056A, EV-B §2.6). The lesson does not ask the learner to read SYSOUT, so only the error path (not walked) shows ICE026A.
- F26-5 (confirmed). Sorting compares JavaScript strings (programs.ts:145-147) and ignores the format code (CH/ZD/PD/BI) of the SORT FIELDS operand (parseSortFields reads only p, m, order); IBM DFSORT uses EBCDIC collating by default and defines formats CH, ZD, PD, BI ... (DFSORT Application Programming Guide SC23-6878-70 App. D Tables 109/110 and Table 64; EV-B §5 rows "Collating", "Format codes" CONTRADICTS). The seed data does not expose the difference. Not disclosed in the lesson; docs/10 says "SORT ... (SORT FIELDS=(p,l,CH,A|D) or COPY)".
- F26-6. A `?` job data set list shows DSIDs 2,3,4,5,6 (sdsf.ts:314); IBM sample shows step SYSOUT/SORTOUT as 103/104 (same finding as F25-2).
- Positive: SORTOUT SYSOUT=* records appear in a spool data set named by the DD (EV-B §4, JESDS/SYSOUT notes); IEFBR14/IEBGENER DD names SYSUT1/SYSUT2/SYSPRINT/SYSIN agree with DFSMSdfp Utilities Table 29 (EV-B §5).

**Validation and assessment findings**
- `tso-submit`: requires `JOB_SUBMITTED{from:"TSO_COMMAND"}` for ANY TSO SUBMIT (any member, any data set), not SORTJOB.
- `question`: `onScreen("SDSF_JOB_DS")` is state-only and accepts `?` on any job (it would pass on a HELLO job from earlier).
- `sortout`/`jesmsglg`: accept any job's SORTOUT/JESMSGLG, not the job just submitted. Because `resetJobs` clears the spool this is not exploitable in the intended path.
- Challenge/default = last step `onScreen("SDSF_JOB_DS")` (state only): completing needs any job's `?` panel, and `lessons.test.ts` does not cover Challenge for lesson 26. Probe A2 showed Challenge stays "running" at SDSF_MENU (needs a job), but once any job exists (e.g. a HELLO job left from lesson 25 without reset), `?` on it completes the lesson without SORTJOB.
- Tests: lessons.test.ts:334-349 happy path; jes.test.ts:65-72 asserts SORT order of in-line data and the ICE007A branch only, not collating or format.

**Verified reference IDs and exact topics**
- EV-A §7: "SUBMIT command" TSOCR SA32-0975-70 p.269-273; "Entering Data Set Names" TSOUG SA32-0971-70 p.19-20; "DELETE command" TSOCR p.71; IKJ56228I TSOMSG p.535; IKJ56250I p.544.
- EV-B §5: DFSMSdfp Utilities SC23-6864-70 ch.7 Table 29 (p.185-186); DFSORT Application Programming Guide SC23-6878-70 "SORT control statement" p.449-453, Tables 64, 109, 110; EV-B §2.6 DFSORT Messages SC23-6879-70 p.31 (ICE000I), p.38 (ICE026I), p.47 (ICE056A).
- EV-B §2.2: IEF374I Vol 8 SA38-0675-70 p.245; IEF237I p.164; IEF285I p.196-197.
- Own grep: JCL User's Guide SA23-1386-70 ieab500_v3r2.pdf sample JESMSGLG/JESYSMSG (PDF p.35) and SDSF JDS sample (PDF p.43).

**Confirmed deviations (disclosed?)**
- Unquoted-name qualification (no descriptive qualifier; dotted names not prefixed): partially disclosed ("unquoted names get your userid prefixed, as on a real system", tsoCommand.ts:19-20) but that sentence overclaims.
- JESMSGLG layout, IEF374I RC=, ICE000I product number, EBCDIC/format: not disclosed.
- Sorted output identical to input: not disclosed (data design issue).

**Recommended correction (minimum viable)**
1. Change seed `EMPLOYEE` order (or add a fifth record out of order, e.g. `E00005` first) so SORTOUT visibly differs from SORTIN, and keep `SORT FIELDS=(1,10,CH,A)`.
2. In tsoCommand.ts `qualify`, prefix every unquoted name; reword tsoCommand.ts:19-20 and module9-10.ts:207 to "unquoted names get your profile prefix (and possibly a descriptive qualifier)".
3. Print IEF374I without `RC=`; change the JESMSGLG step table to the IBM sample headings; stop printing `RC=` via `$HASP395` or keep it but add a footnote.
4. Make `tso-submit` check the submitted member is SORTJOB (`e.jobName === `${hlq}S``).

**Priority and severity:** P2 / Medium (sort not observable, TSO name qualification overclaim); JESMSGLG/IEF374I/ICE fidelity P3 / Low; Challenge/step looseness P2 / Low.
**Evidence and rationale:** module9-10.ts:207,226,232; seed.ts:114,166-171; tsoCommand.ts:19-20,65; submit.ts:157,208; programs.ts:114,132,145-147; EV-A §7; EV-B §2.2, §2.6, §5; probe D.

---

### Lesson 27

**Lesson number and ID:** 27 / `l27-jcl-error`
**Module and title:** Batch jobs and SDSF / "Debug a JCL ERROR"
**Learning objectives (from code):** Submit {HLQ}.JCL(PAYRPT), see JCL ERROR in SDSF, read IEF212I in JESYSMSG, fix the SYSUT1 data set name with SJ, resubmit and get CC 0000 (module9-10.ts:251). Teaches: JCL ERROR = the job never ran (or a step was skipped); JESYSMSG names the statement and the reason; "IEF212I DATA SET NOT FOUND: the DSN is wrong or not cataloged"; "SJ opens the submitted JCL in Edit" (line 252). Starting state resets jobs and PAYRPT (line 253).
**Source files:** src/tutorial/lessons/module9-10.ts:10-19,245-299; src/engine/screens/sdsf.ts:205-235 (SJ/SE/X at 221-231); src/engine/jesActions.ts:14-31; src/jes/submit.ts:58-95,124-244; src/jes/types.ts:34,44; src/catalog/seed.ts:92-105; src/engine/screens/editor.ts:318-322,372-381; src/tutorial/explain.ts:376-381; docs/10-jes-sdsf.md:44-51; tests/tutorial/lessons.test.ts:350-370; tests/engine/sdsf.test.ts:39-71.
**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- The central workflow taught is "SJ, fix, SUBMIT, PF3 saves the corrected member" (lines 276, 294). IBM says the opposite about saving: from the Output Data Set panel "To display just the JCL for the job, use the SJ action character. You can change and resubmit the JCL from the display; changes you make to the data are not saved" (SDSF User's Guide SC27-9028-70 ch.3 p.371; EV-C c4); `SJ - Use ISPF Edit to edit the JCL. You can make changes and resubmit the JCL` (p.47; EV-C c3). Nothing in EV-C says SJ updates the original PDS member. So the lesson teaches a persistence behaviour IBM does not document, and the real fix workflow (edit the source member through ISPF, save, resubmit) is never taught (known seed CONFIRMED).
- Step 3 asks "which DD, which data set?" and the explanation names the message format correctly. IEF212I names job, step and DD only: IBM text `jobname [procstep] stepname ddname[+ xxx] - DATA SET NOT FOUND` (EV-B §2.2, MVS System Messages Vol 8 SA38-0675-70 p.146-147). The data set name is not in the message; it must be read from JESJCL or the JCL. The question as asked has no answer in the line the learner is told to read (known seed CONFIRMED; the same error is repeated in lesson 28 line 320).
- The lesson never explains why the allocation failed in JCL terms (`DISP=SHR` on a data set that does not exist or is not cataloged, IBM cause "The data set was not cataloged or passed", EV-B §2.2 IEF212I), and never shows the alternative of creating it with `DISP=(NEW,CATLG)`. Known seed "DISP not taught" applies here too.
- The member PAYRPT carries comment lines that reveal the answer: "THIS JOB ENDS WITH A JCL ERROR. FIND OUT WHY IN SDSF (JESYSMSG), FIX THE JCL..." (seed.ts:96-97).
- docs/10:46 calls PAYROLL.DATA "not cataloged"; the seed has no such data set at all (seed.ts:66-230, none named PAYROLL.DATA), and the simulator cannot represent an existing-but-uncataloged data set. The learner cannot catalog it.

**Simulator fidelity findings**
- F27-1 (confirmed). SJ opens the current catalog member, not the JCL JES holds: sdsf.ts:230-231 `openRef(remembered, job.source, "E")`; `job.jcl` is stored (submit.ts:231) but never read. Probe G: after submitting an unsaved fix (job.jcl contains `DSN=USER01.DATA(EMPLOYEE)`), canceling the edit and pressing SJ on that job shows the on-disk `DSN=USER01.PAYROLL.DATA` line. IBM: SJ presents the JCL held by JES for that job (EV-C c4 caveat "SJ presents the JCL held by JES for that job, not the source member"; "The job must have executed on your node or not yet executed").
- F27-2 (confirmed). `SE` is mapped to the same action as SJ and `X` to browse (sdsf.ts:205,221-229). IBM: SE = ISPF Edit of output data sets, SJ = edit the JCL, X = Print (SDSF UG SC27-9028-70 Table 283 p.12 "SET ACTION" legend; EV-C c2 CONTRADICTS). Not walked by this lesson; the help text (sdsf.ts:155) says "SJ edit the JCL that was submitted".
- F27-3 (confirmed). The `SOURCE NOT AVAILABLE` branch (sdsf.ts:230) is unreachable for member or data set submissions because `source` is always supplied (editor.ts:321, memberList.ts:156, tsoCommand.ts:134); types.ts:34 says undefined for unsaved buffers (stale comment).
- F27-4 (confirmed). The allocation-failure job: `IEF237I JES2 ALLOCATED TO SYSIN` for the `DD DUMMY` SYSIN (submit.ts:63-65; probe E output). IBM IEF237I prints `DMY` for a DD DUMMY ("DMY: A DD DUMMY was allocated", Vol 8 p.164; EV-B §2.2). JESMSGLG for this job has `$HASP395 ... ENDED - JCL ERROR` (submit.ts:211); not a documented $HASP395 form (EV-B §2.4; JES2 documents `$HASP165 jobname ENDED AT nodename - JCL ERROR`, p.173-174).
- F27-5 (unverified). That IEF212I (allocation failure at step start) yields Max-RC `JCL ERROR` in SDSF: IBM lists `JCL ERROR` as a Max-RC value (EV-B §4, SDSF UG p.~358; EV-C f2 "JCL ERROR - JCL error") and IEF272I says "An error appeared in a job control statement" among causes; whether this specific allocation failure displays JCL ERROR is INSUFFICIENT EVIDENCE.
- F27-6. The job appears in `ST` only; the `O` panel hides JCL_ERROR jobs (sdsf.ts:118), unresolved in IBM docs (EV-C f2) but contradicted by the simulator's own spool output for the job.
- IEF212I text format itself matches IBM (`IEF212I USER01P REPORT SYSUT1 - DATA SET NOT FOUND`, probe E; EV-B §2.2 SUPPORTS format). IEF272I matches (EV-B §2.2).

**Validation and assessment findings**
- `submit` (JCL_ERROR_GENERATED) is satisfied by any JCL-error job, not PAYRPT.
- `sj` uses `editorOpen(PAYRPT, EDIT)` (state), so the learner can open PAYRPT with option 2 and the step passes without using SJ.
- `fix` is `editorHasLine(/DATA\(EMPLOYEE\)/)` over ANY line, case-sensitive (module9-10.ts:284). Probe m (state injection): replacing a comment line with `//* DATA(EMPLOYEE)` advanced the runner from `fix` to `resubmit` while the SYSUT1 DD was untouched. CONFIRMED (known seed). Resubmission still requires a working fix, so the bypass is shallow.
- `resubmit` is `JOB_COMPLETED{status:"OUTPUT", maxRc:0}` for ANY job, and passes on an unsaved buffer. By design here, but it exercises the same unsupported SUBMIT-buffer path (see lesson 24).
- `save` is `allOf(editorClosed, payrptFixed)`; `payrptFixed` requires `DATA(EMPLOYEE)` with no `i` flag and no `PAYROLL.DATA` anywhere (module9-10.ts:14-19). Probe E: `DSN=user01.data(employee)` runs RC 0 in the simulator (JCL names are upper-cased by `parseDsnRef`, catalog.ts:37) but `payrptFixed` is false, so a learner with CAPS OFF finishes the job yet cannot complete the last step and is given no reason. (Real handling of lowercase JCL: INSUFFICIENT EVIDENCE.) CONFIRMED conditional on CAPS OFF.
- `payrptFixed` rejects every other valid repair (creating `{HLQ}.PAYROLL.DATA`, see lesson 28 probe), although the lesson text (module9-10.ts:282) names one specific fix. For lesson 27 this matches the instruction; it is only a defect for lesson 28.
- Challenge/default: no `challenge` field, so the last-step validator `allOf(editorClosed, payrptFixed)` is used and LearningPanel shows the lesson objective (LearningPanel.tsx:76). Probe n: Challenge mode, open PAYRPT with option 2, `C PAYROLL.DATA DATA(EMPLOYEE)`, PF3 completes the lesson with ZERO jobs submitted. CONFIRMED.
- Tests: lessons.test.ts:350-370 happy path; sdsf.test.ts:56-71 `pf(3) // saves the fix, back to SDSF ST` locks the SJ write-back as intended behaviour.

**Verified reference IDs and exact topics**
- EV-C c2, c3, c4: SDSF User's Guide SC27-9028-70 z/OS 3.2: "SET ACTION" legend p.12; "ISPF Edit or Browse" p.47; "Output Data Set panel (S)" ch.3 p.371. https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/isfa600_v3r2.pdf.
- EV-B §2.2: IEF212I (Vol 8 SA38-0675-70 p.146-147), IEF272I (p.184), IEF237I (p.164); EV-B §2.1 IEFC452I p.532-533; EV-B §2.4 $HASP395 p.310, $HASP165 p.173-174; EV-B §1.1 DISP defaults.
- EV-B §4: SDSF Table 286 Max-RC values (SC27-9028-70 p.~358).

**Confirmed deviations (disclosed?)**
- SJ writes back to the member / opens the member rather than JES-held JCL: NOT disclosed (explicitly taught as real).
- SE = SJ, X = browse: not disclosed (help only).
- DD DUMMY printed as `JES2`: not disclosed.
- Allocation failure => JCL ERROR: not disclosed and unverified.

**Recommended correction (minimum viable)**
1. Reword steps 4, 6, 7 and `teaches`: "SJ opens the JCL JES holds for that job in Edit; you can change it and SUBMIT, but SDSF does not save it back to the member. To keep a fix, edit the member in ISPF (option 2) and SAVE." Then change the lesson's last two steps to: leave SDSF, edit `{HLQ}.JCL(PAYRPT)`, fix, SAVE, SUBMIT. Alternatively keep the simulator write-back but label it `(SIMULATED: real SDSF does not save SJ edits)` in the lesson and on screen.
2. Make SJ open `job.jcl` (the submitted JCL) and have PF3 return without touching the member; remove `job.source` dependency and the unreachable branch.
3. Rewrite step 3 to "which step and DD? then read JESJCL to see the data set on that DD" and fix `hint` at line 320.
4. Print `DMY ALLOCATED TO` for DUMMY DDs.
5. Make `fix` validate the SYSUT1 DD line (a `DD` statement with DSN matching `DATA(EMPLOYEE)` case-insensitively) and `payrptFixed` use `/i`; add a Challenge validator requiring a successful `{HLQ}P` job.

**Priority and severity:** P1 / High (SJ semantics taught as real and required for completion); IEF212I naming P1 / Medium; Challenge completes without a job P2 / Medium; lowercase/comment validator weakness P2 / Medium; DUMMY/`$HASP395` details P3 / Low.
**Evidence and rationale:** module9-10.ts:14-19,252,269-270,276,284,294,296; sdsf.ts:205,221-231; submit.ts:63-65,211,231; seed.ts:96-97; EV-C c2-c4; EV-B §2.2, §2.4; probes E, G, m, n.

---

### Lesson 28

**Lesson number and ID:** 28 / `l28-day-one`
**Module and title:** Batch jobs and SDSF / "Day-One challenge: the payroll report"
**Learning objectives (from code):** Make {HLQ}.JCL(PAYRPT) run to CC 0000 and look at its report in SYSUT2, by whatever route the learner chooses (module9-10.ts:307). Teaches: navigating with =, 3.4 and member lists; submitting and reading SDSF; "Diagnosing IEF212I"; editing and saving JCL (line 308). Starting state resets jobs and PAYRPT (line 309). Challenge: `task` = "Make PAYRPT run to CC 0000 (fix the SYSUT1 data set name, save the member, resubmit). Only the result counts."; validator `allOf(payrptFixed, payrptSucceeded, editorClosed)` (lines 336-339).
**Source files:** src/tutorial/lessons/module9-10.ts:10-19,301-340; src/tutorial/engine.ts:34-68; src/state/TutorialProvider.tsx:95-120,148-155; src/tutorial/validators.ts; src/engine/screens/sdsf.ts; src/jes/submit.ts; src/catalog/seed.ts:92-105; tests/tutorial/lessons.test.ts:371-400; tests/engine/sdsf.test.ts:56-71; docs/10-jes-sdsf.md:44-51; docs/05-course-design.md row 28.
**Technical accuracy status:** CORRECTION REQUIRED

**Educational quality findings**
- Objective vs validation: the objective says "look at its report in SYSUT2" (line 307) and Learn step 4 requires browsing SYSUT2 (lines 329-334). The Challenge validator is state-only (lines 336-339) and the task text omits SYSUT2. Output inspection is therefore not assessed in Challenge (known concern 1 CONFIRMED; locked by lessons.test.ts:371-380 which finishes Challenge with `pf(3)` and no SDSF visit).
- "by whatever route you choose" (line 307) vs `payrptFixed` demanding `DATA(EMPLOYEE)` text and the absence of `PAYROLL.DATA` anywhere in the member (lines 14-19). Probe o: after `RENAME 'USER01.NOTES.TXT' 'USER01.PAYROLL.DATA'` and `SUBMIT JCL(PAYRPT)` the job ends `OUTPUT`, RC 0, a legitimate repair of the failure, but the Challenge stays `running`. A second valid route (allocate or catalog the missing data set) is rejected. CONFIRMED.
- Hint at line 320: "IEF212I names the data set" is wrong (see lesson 27 F27 educational finding; EV-B §2.2).
- "Diagnosing IEF212I" is listed in `teaches` but diagnosis is skippable (see validation).
- The scenario premise ("uncataloged") is a nonexistent data set (seed.ts has no PAYROLL.DATA); the learner cannot reproduce "uncataloged but present" and docs/10:46 mislabels it.
- The member comment gives the answer away ("THIS JOB ENDS WITH A JCL ERROR... FIND OUT WHY IN SDSF (JESYSMSG)", seed.ts:96-97).

**Simulator fidelity findings**
- All of lesson 27's SDSF/SJ fidelity findings (F27-1 to F27-6) apply, because Learn step 3 hints "SJ from SDSF or Edit the member" (line 326) and `payrptFixed` reads the catalog member that only the unsupported SJ write-back (or an explicit SAVE) updates.
- `payrptSucceeded` matches any job named `<userid>P` with status OUTPUT, maxRc 0, no abend (line 11), regardless of which JCL produced it (a different member whose JOB name is `<userid>P` counts); it also cannot tell a post-fix run from a pre-existing run.
- `setMode` restarts the runner without resetting members/jobs (TutorialProvider.tsx:148-155); `startLesson` is the only place `resetMembers`/`resetJobs` run (lines 104-107). Probe I: finish lesson 28 in Learn, switch the same lesson to Challenge on the same simulator state, and the first action (`cmd("2")`) completes it. CONFIRMED (known seed). Likewise lessons 23 and 25 Challenge complete on a trivial first action (probe A2).
- Day-One data sets: `SYSUT2 DD SYSOUT=*` output records are the 4 EMPLOYEE records (probe E "SYSUT2 4"); IBM IEBGENER SYSPRINT text "n RECORDS COPIED FROM SYSUT1 TO SYSUT2"/"PROCESSING ENDED AT EOD" is not found in IBM docs (INSUFFICIENT EVIDENCE; EV-B §5 row "IEBGENER SYSPRINT text"); IEB351I is used for "not found/no DD name" errors (programs.ts:78) though IBM IEB351I is a permanent I/O error (EV-B §2.5 CONTRADICTS); `IEC130I SYSUT1 DD STATEMENT MISSING` lacks the " - " of the documented text (EV-B §2.5 PARTIAL).
- DISP defaults and allocation (known concern 2): the simulator defaults status to NEW and abnormal disposition to the normal disposition (EV-B §1.1 SUPPORTS), but treats `DISP=MOD` of a missing data set as IEF212I NOT FOUND (probe F; IBM creates it, EV-B §1.1 CONTRADICTS), treats PASS/UNCATLG as KEPT, and does not support `&&TEMP` or referbacks (EV-B §1.1, §1.4). These do not occur in lesson 28's PAYRPT.

**Validation and assessment findings**
- Steps 1-2 accept `payrptSucceeded` (lines 315, 321). Probe I: open PAYRPT, `C PAYROLL.DATA DATA(EMPLOYEE)`, SUBMIT, PF3 advanced the runner past `run-it` and `diagnose` without a JCL ERROR ever being generated or JESYSMSG ever opened. CONFIRMED (known seed). In Learn mode this skips the "Diagnosing IEF212I" outcome stated in `teaches`.
- Step 3 `fix-and-save` and Challenge share `allOf(payrptFixed, payrptSucceeded, editorClosed)`: state-only, no event required, rejects PAYROLL.DATA creation (probe o), case-sensitive (lesson 27 probe E).
- Step 4 `report` requires `JOB_OUTPUT_OPENED{ddname:"SYSUT2"}` for any job.
- Challenge is the only assessment of the "day one" skill and does not check diagnosis or output.
- Tests: lessons.test.ts:371-380 (Challenge completes on PF3 after SUBMIT) and :381-400 (Learn path) are happy paths that lock the state-only Challenge; sdsf.test.ts:56-71 locks SJ write-back.

**Verified reference IDs and exact topics**
- EV-B §2.2: IEF212I (SA38-0675-70 Vol 8 p.146-147), IEF272I p.184; EV-B §2.5: IEB351I (Vol 7 SA38-0674-70 p.186), IEC130I p.378; EV-B §1.1 DISP, "Defaults" (JCL Reference SA23-1385-70 book p.147-152); EV-B §5 IEBGENER Table 29 (SC23-6864-70 p.185-186).
- EV-C c3, c4 (SDSF UG SC27-9028-70 p.47, p.371) for SJ.
- EV-C Part 2 b: Table 284; EV-B §4: Table 286.

**Confirmed deviations (disclosed?)**
- State-only Challenge; "any route" claim vs specific-string validator: not disclosed.
- SJ write-back: not disclosed.
- IEB351I/ICE026A/RECORDS COPIED texts: not disclosed.
- COND/IF not evaluated: disclosed in docs/10:52-53 ("COND/IF not evaluated"), not in the lesson; not exercised by PAYRPT.

**Recommended correction (minimum viable)**
1. Add to the Challenge validator: `eventIs`-free but state-based "a job `{HLQ}P` with `maxRc===0` exists whose `jcl` no longer references PAYROLL.DATA or whose SYSUT1 DD resolves to an existing data set" and require that the SYSUT2 output of that job was opened (store a `JOB_OUTPUT_OPENED` flag in state, or drop SYSUT2 from the objective).
2. Replace `payrptFixed` with a semantic check (the successful job's SYSUT1 DD resolved to an existing data set), case-insensitive, accepting a created `PAYROLL.DATA`; or change the objective to "by changing SYSUT1 to {HLQ}.DATA(EMPLOYEE)".
3. Remove steps 1-2 `anyOf(... payrptSucceeded)` or require a `JCL_ERROR_GENERATED`/JESYSMSG event in the run.
4. Make `setMode` (or the first Challenge feed) re-run `startingState` resets, or invalidate stale successful jobs.
5. Fix hint line 320 ("IEF212I names the DD and step; read JESJCL for the data set").

**Priority and severity:** P1 / High (Challenge does not assess diagnosis/output; rejects valid repair; stale-state completion); hint error P1 / Medium; DISP/COND/IEB351I fidelity P3 / Low (not exercised).
**Evidence and rationale:** module9-10.ts:11,14-19,307,315,320-321,326-339; TutorialProvider.tsx:104-107,148-155; probes I, o, F; lessons.test.ts:371-400; EV-B §1.1, §2.2, §2.5; EV-C c3-c4.

---


## 7. Known concerns from the brief (section 3.4), as resolved by the lessons 22 to 28 audit

See also the consolidated verdicts in the [simulator gap matrix](simulator-gap-matrix.md) section 1.

1. **Lesson 28 output inspection - CONFIRMED.** Objective (module9-10.ts:307) and Learn step 4 (lines 329-334) require reading SYSUT2; Challenge `task` omits it and the validator is state-only (lines 336-339). Tests lock it (lessons.test.ts:371-380). Probe I/o.
2. **DISP defaults / allocation - PARTIAL.** Defaults are right: status defaults to NEW (submit.ts:72), normal disposition DELETE for NEW else KEEP, abnormal = normal (submit.ts:107-109); EV-B §1.1 SUPPORTS. Wrong: `DISP=MOD` on a missing data set gives IEF212I (probe F; IBM creates it, EV-B §1.1), PASS and UNCATLG are treated as KEPT (submit.ts:114-115; EV-B §1.1), NEW data sets are catalogued at allocation regardless of CATLG (submit.ts:79-85), no `&&temp`/referbacks (parseDsnRef regex, EV-B §1.4). None of these is exercised by PAYRPT/HELLO/SORTJOB (only DISP=SHR); but lessons 24-28 never teach DISP although IEF212I here is a DISP=SHR-on-missing-data-set failure.
3. **COND recognised vs executed - CONFIRMED.** COND is accepted as an EXEC keyword (jcl.ts:45) and never evaluated: probe F ran S2 with `COND=(0,EQ,S1)` after S1 ended RC 0 (IBM bypasses the step, EV-B §1.2). `IF/THEN/ELSE/ENDIF` is rejected as IEFC605I twice (probe F; IBM valid, EV-B §1.2). Disclosed only in docs/10 ("COND/IF not evaluated"), not in any lesson; not exercised by lessons 22-28.
4. **Unsaved-buffer SUBMIT - PARTIAL.** Behaviour (submit the buffer, editor.ts:318-322) is consistent with IBM Edit SUBMIT text ("the member or data set you are editing", EV-A §1); the justification that "real ISPF submits the on-disk copy" (explain.ts:400, editor.ts:319, docs/10:27, ADR 0012:25) is unsupported/contradicted: on-disk wording is Browse SUBMIT only (UG2 p.80). SUBMIT operands (label range, X, NX) are silently ignored. `Job.source` is set even for an unsaved buffer (probe G), which feeds the SJ defect (lesson 27).
5. **Scenario isolation - CONFIRMED.** `startingState` resets only listed members (restoreMembers, TutorialProvider.tsx:48-59,104-105) and the JES (line 107). Lessons 22, 23 reset nothing; 25 and 26 reset jobs but not HELLO/SORTJOB; data sets and members the scenarios rely on (`{HLQ}.DATA(EMPLOYEE)` for SORTJOB and the PAYRPT fix, absence of `{HLQ}.PAYROLL.DATA` for L27/L28) are never restored, so earlier sandbox work can break them (probe o: creating PAYROLL.DATA makes PAYRPT succeed first time, so L27 step 1 `JCL_ERROR_GENERATED` can never fire). `setMode` restarts the runner without resets (lines 148-155; probe I).
6. **Global vs per-user progress - CONFIRMED.** Catalog, edit profiles and JES are per userid (keys.ts:3-5) but progress, mode and current lesson are global (`ispf-lab:progress:v1`, keys.ts:7; MODE_KEY/LESSON_KEY, TutorialProvider.tsx:20-21,115-117). A second userid on the same browser inherits completed/in-progress status, scores and `currentLessonId` for a catalog and spool it has never touched.
7. **Oversimplified outputs - CONFIRMED.** Examples (all against EV-B/EV-C): JESMSGLG lines with date only (no time/job id) (EV-B §4); step table headings; IEF374I `RC=` (EV-B §2.2); IEF237I `JES2` for DUMMY and volser for data sets (EV-B §2.2); IEF450I template (EV-B §2.2); IEFC606I and IEFC605I reused with invented texts, ICE026A (nonexistent), ICE000I 5650 vs 5655, IEB351I used for not-found (EV-B §2.1, §2.5, §2.6); `$HASP395 ... ENDED - JCL ERROR` (EV-B §2.4); LISTCAT `IN-CAT` lines (EV-B §5); SDSF ST/JDS columns and DSIDs, one-line LOG summary (EV-C g). Mostly disclosed generically by "(SIMULATED)" and docs/10 "Simplifications", not item by item.
8. **Tests establish consistency, not fidelity - CONFIRMED.** Examples: sdsf.test.ts:56-71 and lessons.test.ts:350-370 lock the SJ write-back; sdsf.test.ts:8-9 locks the buffer-SUBMIT premise; sdsf.test.ts:78-82 lock bare-name PREFIX prefix-match and OWNER-no-arg-resets; lessons.test.ts:371-380 locks state-only Challenge; jes.test.ts:40-42 asserts the date-only JESMSGLG lines; lessons tests walk happy paths only and hard-code `JOB00001`/`JOB00002`. A few assertions do agree with IBM (jes.test.ts:89-90 IEF212I/IEF272I format, EV-B §2.2).


### Seed checklist for lessons 22 to 28

| Seed | Result | Where |
|---|---|---|
| L24 Challenge default trivial | CONFIRMED (probe A) | L24 |
| L24 does not teach DISP | CONFIRMED | L24, L27 |
| L25 does not reset HELLO | CONFIRMED; effect conditional (probe C: CC 0012 if HELLO overtyped) | L25 |
| L26 DD walk | Walk fine; SORTOUT identical to SORTIN, ? order SORTOUT before SYSOUT, DSIDs 5/6 vs IBM 103/104 | L26 |
| SJ opens submitted JCL / saving writes back the member (module9-10.ts:252,275-277,294) | CONFIRMED; contradicts IBM "not saved" (EV-C c4); SJ opens current member (probe G) | L27, L28 |
| L27 step 5 regex any line, case-sensitive | CONFIRMED (probe m) | L27 |
| L27 resubmit passes on unsaved fix | CONFIRMED (by design) | L27 |
| L27 steps 1-2 accept payrptSucceeded | REFUTED for L27 (steps 1-2 are event validators); CONFIRMED for L28 | L27/L28 |
| "IEF212I names the data set" (:269,:320) | CONFIRMED wrong (EV-B §2.2); :269 phrased as a question, :320 is a false hint | L27, L28 |
| L28 objective reads SYSUT2 vs state-only Challenge | CONFIRMED | L28 |
| payrptFixed rejects creating/cataloging PAYROLL.DATA | CONFIRMED (probe o) | L28 |
| payrptSucceeded = any job `<userid>P` RC 0 | CONFIRMED | L28 |
| setMode does not reset data | CONFIRMED (probe I) | L28 (also 23, 25) |
| :77,94 G/I claims | PARTIAL: G opens a Reset Member Statistics panel in IBM; I/G documented for 3.1 lists | L23 |
| :89 "audit trail operators rely on" | CONFIRMED overstated (EV-A §6) | L23 |
| DSLIST claims; Z fake compress | S/I inverted CONFIRMED; Z compress no-op CONFIRMED (not in lesson) | L22 |
| L23 mod level once per session | CONFIRMED sim bumps every save (catalog.ts:185); IBM first change only | L23 |
| Day-One "uncataloged" is a nonexistent data set | CONFIRMED (seed.ts has no PAYROLL.DATA; docs/10:46) | L27, L28 |
| ST columns/Prty/Queue/Date; DSIDs; job numbering | CONFIRMED PARTIAL fidelity; numbering format JOBnnnnn fine, restart at 1 a simplification | L25 |
| JCL ERROR jobs absent from O | Unsupported inference (EV-C f2, EV-B §4); internally inconsistent | L25, L27 |

## Appendix A. Cross-lesson observations by auditor

### A.1 Lessons 1 to 14

1. **Engine/Challenge design (lessons 1-14):** Challenge mode evaluates the last step's validator (or `challenge.validator`) after EVERY dispatch (engine.ts:41-46, store.ts:61-63). Where that validator is state-only and the lesson's starting state already satisfies it, the Challenge completes on the first keypress. Confirmed trivial: L2, L3 (POM), L5 (first Enter), L7 (open a member list), L13 (TEST.JCL absent), L6 (TEST.JCL exists), L9/L11 (any save of the member), L10 (any CANCEL). Conditionally trivial: L8, L14 after `setMode` (catalog not reset). Not trivial by design: L1, L4, L12.
2. **`setMode` does not reset data** (TutorialProvider.tsx:148-155): `startLesson` restores `resetMembers` but switching Learn -> Challenge only restarts the runner.
3. **Lesson start on DSLIST_SEARCH with `clearStack`** (L5, L7-L10, L12): PF3 on the entry panel is a no-op and the Option line rejects `2`; hints in L8-L10 ("PF3 to the POM", "Option 2") do not work. `=2`/RETURN work.
4. **Mistake scoring counts instructed probes:** L1 (invalid option) and L7 (SAVE in Browse) require an error message, costing 10 points each (engine.ts:38).
5. **Event-only "save" steps (L9 step 6, L11 step 6)** dead-end if the learner already saved; prefer state validators (as L8/L14 do).
6. **Persistence of lesson products:** HELLO (edited/broken by L8/L9), CUSTOMER (L11 damaged), TEST.JCL (L6/L13), REXX members (L12) persist across runs; only seed members are restorable (TutorialProvider.tsx:48-59). Replays of L6, L12, L13 can dead-end. Suggest `LessonStart.resetDatasets`/`deleteMembers`.
7. **Case handling:** sim default CAPS OFF + case-insensitive validators accept lowercase JCL (L8, L14). IBM sets CAPS from data (EM p.20-21).
8. **Message wording vs IBM:** FIND/CHANGE/pending messages (L10, L11) differ from IBM's "CHARS 'x' FOUND/changed" (count not in short message) and "MOVE/COPY pending". ISPF message IDs and exact texts for INVALID OPTION, SAVE, DATA SET ALREADY EXISTS are INSUFFICIENT EVIDENCE (ISPF Messages and Codes SC19-3622-70 not in the evidence set).
9. **Sim-invented UI presented as ISPF:** MODIFIED badge (L8), Browse line numbers (L7), Default scroll amount in option 0 (L3), Dsorg/Recfm/Lrecl in the default DSLIST view (L4). Recommend a "trainer aid" label convention and a docs/03 "deviations" list shown in the Explain drawer.
10. **Tests encode defects:** lessons.test.ts:64-68 asserts two PF3s after typed 3.4 (L2). Only L2, L6, L8, L9, L14 have dedicated lesson tests among L1-14.
11. **Cross-lesson reuse:** L25 does not reset HELLO/jobs itself (relies on L24); L26 uses SORTJOB which L10 scrambles in the buffer only (CANCEL), safe unless the learner SAVEs.

### A.2 Lessons 15 to 21

1. **Challenge mode is broken for 7 of 7 audited lessons.** `feedEvents` (engine.ts:41-46) falls back to the last step's validator, evaluated after every dispatch (TutorialProvider.tsx:123-146). Last steps are cleanup steps ("leave", "PF3"). Probed results (b/c.probe.ts): L15, L18, L21 complete on any first action; L16 on PF4 anywhere; L17 on typing `3.4`; L19 on `CAPS OFF`+PF3 (or immediately once a JCL profile exists); L20 on any CANCEL. Fix pattern: give every lesson an explicit `challenge`, and add one parametrised test "Challenge validator is false after an unrelated action on a fresh state" for all 28 lessons (lessons 1-14, 22-28 not audited here, so I make no claim about them).
2. **Possible mis-completion on lesson start (code-read, NOT probed)**: `startLesson` dispatches `LOAD_CATALOG`/`GOTO` (TutorialProvider.tsx:104-111) before `setLessonId/setRunner` (112-113); the `onEvents` effect still holds the previous lesson/runner and, in challenge mode, `feedEvents` evaluates a state-only validator even for events that cannot belong to it. Hypothesis only; verify before relying on it.
3. **No scenario reset for editor profiles.** `LessonStart` (types.ts:31-38) can reset members and jobs but not `editProfiles`, `retrieveStack` or `screens`. Profiles are persisted to localStorage per userid. Observed leaks: L18 BOUNDS (COBOL), L19 CAPS (JCL), L20 RECOVERY ON (JCL, permanent), abandoned split screens (L15, code-read). These leaks change later lessons' behaviour (L21 step 1; L19 Challenge; JCL typing in L24/L27/L28 if CAPS left ON). Add `resetProfiles?: string[]` and `resetRetrieve?: boolean` to `LessonStart`.
4. **Undisclosed IBM mismatches in docs/03 and docs/04 (the stated documentation of deviations)**: docs/04:79 (BOUNDS no-operand), :85 (two =PROF> lines), :95-97 ("Defaults: CAPS OFF ... ISPF ships RECOVERY/SETUNDO OFF"), :107 ("not the editor"); docs/03:137-148 (screen model, "Maximum 8", typed drafts retained). The repo rule "Behaviour changes update docs/03, docs/04 and a test" is met, but the docs record simulator behaviour as if it were IBM behaviour; "Deviation" notes exist only for line commands, HEX, NUMBER, CREATE/COPY (docs/04:52,89-90).
5. **Defaults are installation-controlled** (EM "Edit mode defaults", p.21: no shipped profiles; Configuration Table/ZDEFAULT). Statements "(the) default" for CAPS, NUMBER, AUTOSAVE, RECOVERY, SETUNDO appear in module3.ts:59,86; module7-8.ts:194,233; explain.ts:118,281,316,330; docs/04:95-97. Replace with "typical" and point to PROFILE.
6. **Tests prove paths, not fidelity or assessment strength**: lessons.test.ts:149-278 drives only happy paths; the L17 test passes although the lesson completes after the first PF3 (probe a.probe.ts), L18 passes with a failing FIND available as a false positive, etc. Add negative-path tests (named in the probes).
7. **Message texts are unverified everywhere** (SCREEN ENDED, UNDO COMPLETE, INVALID BOUNDS, NO COMMAND TO RETRIEVE, MAXIMUM SCREENS ACTIVE ...): ISPF Messages and Codes SC19-3622-70 (f54mc00) was not read in this audit. Recommend a dedicated pass.
8. **Typed `3.4` keeps UTILITY_SELECTION on the stack** (navigation.ts:71-78) - an implied (not literal) conflict with UG1 p.20 "bypass the second menu"; affects PF3 counts in lessons 2, 16, 17.
9. **F12 keylist hybrid** (Retrieve vs Cancel) is applied in docs/03:18-19 and reducer.ts:56-60; IBM default CUA display uses F12=Cancel and Table 11 uses F12=Retrieve (UG1 p.24, p.67). The panel legend is "authoritative" per docs/03 but the lesson text asserts one reading.
10. **Positive findings**: UNDO granularity and SAVE boundary, CANCEL, RESET/EXCLUDE/FLIP, jump ending an Edit session with AUTOSAVE, shared retrieve stack, no-retention of PF-key commands, bounds applying to FIND/CHANGE/EXCLUDE, bounds persisting in the profile, profile-per-type naming, JCL column-71 rule, X on the Option line in split mode - all match IBM text read in this audit.


### A.3 Lessons 22 to 28

1. **Challenge mode is weak across the module.** Last-step defaults: L22 `LIST_RESET` event, L23 `onScreen(MEMBER_LIST)`, L24 `editorClosed`, L25 `onScreen(SDSF_MENU)`, L26 `onScreen(SDSF_JOB_DS)`, L27 `payrptFixed + editorClosed`. Probes: L23, L24, L25 complete on the first trivial action; L27 completes with zero jobs submitted. Only L28 has a bespoke validator, and that is state-only.
2. **A single unsupported premise carries lessons 24, 27, 28:** the "documented deviation" of SUBMIT, and SJ write-back. Both are stated as how real ISPF/SDSF works.
3. **Hidden state coupling** (HELLO in 25, DATA(EMPLOYEE) in 26/27/28, PAYROLL.DATA absence, Learn to Challenge switch) is not reset; only `resetMembers`/`resetJobs` exist.
4. **Fabricated or misapplied message ids** live in code reachable from other lessons or error paths: IEFC606I (jcl.ts:204,214,229; absent from IBM Vol 8, EV-B §2.1), ICE026A (programs.ts:132,137,155), IEB351I (programs.ts:78,83), IEF374I `RC=`. Lessons 22-28 do not read those paths, but the glossary teaches `iefc605i`, `iefc452i`.
5. **Time and job log layout** are the biggest visible gap between SDSF output here and IBM's sample logs (EV-B §4).
6. **Naming/qualification:** `qualify()` leaves dotted unquoted names unprefixed (probe: `LISTDS NOTES.TXT` gives NOT FOUND), against TSO naming (EV-A §7); lesson 26 only uses an undotted name.
7. **Explanation text vs panel:** explain.ts:358 says DA is shown in SDSF while the simulator rejects DA; the glossary says SJ edits "the JCL that was submitted".
8. **Good practices to keep:** every SDSF title carries (SIMULATED); lesson 24 says the job runs at once; IEF212I/IEF272I formats match IBM; lessons use `{HLQ}` and the userid; ISPF-style messages instead of dialogs.

## Appendix B. Claims that could not be verified (INSUFFICIENT EVIDENCE), with the search needed

### B.1 Lessons 1 to 14

| Claim | Where | Search/evidence needed |
|---|---|---|
| TSO userid max 7 characters | module1.ts:21, login.ts:9 | TSO/E Customization or RACF userid rules (z/OS TSO/E Customization SA32-0976; RACF Security Admin Guide "user ID" 1-7 chars) |
| Exact text `INVALID OPTION` and PF1 behaviour for it | module1.ts:46, navigation.ts:8 | z/OS ISPF Messages and Codes SC19-3622-70 (f54mc00), ISRU/ISPP message list for invalid primary-menu selection |
| `Default scroll amount` in option 0 | module1.ts:130 | UG2 Settings panel Figure 23 (image) - already CONTRADICTED by field list, visual confirmation optional |
| LISTCAT screen output format | tsoCommand.ts:76 | z/OS DFSMS Access Method Services Commands (SC23-6846-70, idai200) LISTCAT output examples; TSO LISTCAT NAME-only listing |
| DSLIST "same information" as LISTCAT (catalog vs VTOC) | module1.ts:147 | UG2 3.4 "Volume serial" topic p.129 (list from VTOC if volume given, else catalog - appears in my read p.132 but not re-read for L3) |
| Directory-block capacity ("a handful of member entries") | module2.ts:131 | DFSMS Using Data Sets (SC23-6855-70) PDS directory block structure |
| Real response to SAVE in Browse | primaryCommands.ts:26 | ISPF Messages and Codes: Browse "invalid command" message text, or live system |
| Effect of SAVE/END on a new empty member | module4.ts:27-35, editor.ts:375 | EM "SAVE"/"END" pages for empty data; live z/OS test |
| Rename of a member "only rewrites the directory entry" | module4.ts:43 | DFSMS Using Data Sets / IEBCOPY or ISPF `R` implementation notes |
| Parentheses on the 3.3 To data set name rename the member | module4.ts:76 | UG1 "Move/Copy utility" To panel field descriptions ("Libraries and Data Sets" chapter, p.~98-110) |
| Default state of DSLIST "Enhanced member list for Edit, View, Browse" | module4.ts:20 | ISPF Planning and Customizing GC19-3623-70 (config table) or live 3.4 > Options |
| Asterisks in `*BOTTOM OF DATA REACHED*` | module3.ts:220,223 | Live ISPF or ISPF Messages (ISRE message list) |
| ISPF statistics "audit trail operators rely on" etc. are out of L1-14 scope | (module9-10) | n/a |
| MOVE/COPY pending shown "in the prefix area" | module3.ts:165 | Live ISPF screenshot / EM figures of pending C |
| PF3 count after a typed `3.4` (IBM text covers `3.3` by example) | module1.ts:102 | Live ISPF test of `3.4` then PF3, or UG1 text on nested option returns |

### B.2 Lessons 15 to 21

- Exact ISPF message texts used by the simulator in lessons 15-21 (listed in cross-lesson 7).
- What a new logical screen displays after SPLIT (module6.ts:27 "Primary Option Menu").
- SWAPBAR default state (on/off) on a fresh ISPF.
- View mode save/discard semantics and the "read-only" characterisation (module6.ts:34, explain.ts:178).
- COBOL area A/B column numbers (module7-8.ts:112,124; explain.ts:302): no COBOL language reference read.
- Whether RESET removes the fixed `COLS` primary-command line (only the line-command `=COLS>` flag is documented for RESET).
- Order of processing and "the rest wait" for multiple line commands on the 3.4 Data Set List (documented only for member lists: "press Enter again", UG1 p.99).
- Exact IBM wording of the DSLIST excluded-rows marker (only the "1 data set(s) not displayed" message was read, UG2 p.139).
- "Most systems" default for AUTOSAVE ON (module3.ts:86).
- Behaviour of `RETRIEVE` with an empty stack beyond the UG1 p.55 text (sim message `NO COMMAND TO RETRIEVE`).
- Printed page numbers are derived from PDF offsets (EM -32, UG1 -28, UG2 -38, JCL Ref -46) and may be off by one.
- Cross-lesson item 2 (start-of-lesson mis-completion) is a code-read hypothesis, not a probe.

### B.3 Lessons 22 to 28

- Real appearance of the excluded-block marker in DSLIST and where NX is typed (UG2 p.139/153 give only the message "1 data set(s) not displayed").
- PF5 as the default RFIND key in DSLIST.
- That a RECFM=U load library shows LRECL 0 in DSLIST.
- Layout and field labels of the Member Information panel; whether I and G work on member lists reached via option 2 or 3.4 M (documented only for lists from the Library Utility panel, UG2 p.100, p.150); the options on the Reset Member Statistics panel beyond what UG2 p.164-165 lists.
- Whether Edit SUBMIT requires a prior SAVE (IBM page is silent, EV-A §1).
- How real ISPF shows IKJ56250I on the Edit panel.
- Whether `SUBMIT JCL(SORTJOB)` resolves to `USER01.JCL(SORTJOB)` or to a name with a descriptive qualifier such as CNTL (EV-A §7 UNRESOLVED).
- Whether an IEF212I allocation failure shows `JCL ERROR` as Max-RC in SDSF; which spool data set (JESMSGLG vs JESYSMSG) carries IEF212I in a real job (IBM sample JCL User's Guide has no IEF212I).
- Whether JCL-error jobs appear on SDSF O/H (EV-C f2; depends on MSGCLASS).
- Default `Prty 15`/`Queue PRINT`, real `Pos` semantics, SYSOUT DSID numbering beyond the 3.2 guide's 103/104 sample.
- Layout of SDSF `S` on ST (banner lines).
- IEBGENER SYSPRINT texts ("n RECORDS COPIED...", "PROCESSING ENDED AT EOD") (EV-B §5).
- Real handling of lowercase JCL in DSN operands.
- Whether `M.5` exists in any current ISPF menu (Redbook-era only, EV-C h3).

## Post-M3 correction (2026-10-16)

Lesson 24's teaches line said "JES answers JOB name(JOBnnnnn) SUBMITTED" and the SUBMIT glossary entry said "ISPF answers IKJ56250I". The M3 b-01 second-pass examination found the message is issued by the TSO SUBMIT command (TSO/E Command Reference p.121, TSO/E Messages p.544) and JES assigns the job number; both texts now say so. No other existing lesson text changed in the M3 hardening.
