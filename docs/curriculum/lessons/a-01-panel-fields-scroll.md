# a-01-panel-fields-scroll — Panel fields and the Scroll amount

Track / module:           A ISPF fundamentals / The editor (display position: after lesson 8)
Number and stable ID:     lesson 29, `a-01-panel-fields-scroll` (never changes)
Audience and difficulty:  beginner
Lesson type:              interactive
Prerequisites:            `l01-meet-ispf` (declared in `requires`; advice only). Leaves behind: member `{HLQ}.DATA(SCROLL)` (60 lines), recreated on every start
Estimated time:           10 minutes
Review status:            **draft** — an author check and a second-pass AI source examination (claim-level evidence in `../m3-evidence-matrix.md`; findings and resolutions in this spec's last section). **Not an independent review.** Independent source review, fidelity review and expert review are pending (authoring standards section 9). Hidden from learners by the draft gate (ADR 0018).

## Learning objectives
1. Find the Scroll field on an Edit panel and say what it holds.
2. Set the amount to PAGE or HALF (or a number) and predict how far PF8 moves the data.
3. Use an amount on the command line as a one-time override that leaves the field unchanged.

## Terminology
Scroll amount; PAGE; HALF; MAX; one-time override.

## Conceptual explanation (original wording; sources in brackets)
- Many ISPF panels show a scroll amount at the top. It decides how many lines or columns each scroll command moves. Typing over it changes it. [SRC-013 UG1 printed p.17, p.59]
- Valid amounts are a number (0 to 9999), PAGE, HALF, DATA, CSR and MAX. PAGE is a full page of the visible data, HALF is half of the scrollable area. The field accepts at most four digits; a scroll command may carry a larger number. [SRC-013 p.17, p.59-60]
- MAX goes to the limit of the data and applies only to the next scroll. [SRC-013 p.17, p.60]
- An amount given with the scroll command (`UP 3`) is a temporary, one-time override of the field. [SRC-013 p.60]
- ISPF saves separate amounts for Browse, for Edit and View, and for member lists. [SRC-013 p.60]

## Worked example
Member `{HLQ}.DATA(SCROLL)` has 60 numbered lines, so a screen shows only part of it. With Scroll at PAGE, PF8 shows the next page. With HALF, PF8 moves half a page. `DOWN 3` moves 3 lines once and the field still reads HALF.

## Guided activity
1. Open `{HLQ}.DATA(SCROLL)` in Edit and find `Scroll ===>`.
2. Press PF8 with PAGE: one page moves.
3. Type HALF over PAGE and press PF8: half a page moves.
4. Type `DOWN 3` on the command line: 3 lines move and the field stays HALF.
5. Type `DOWN MAX`: the last page shows; the field stays HALF.
6. PF3 to leave (nothing changed).

## Independent challenge
"Open `{HLQ}.DATA(SCROLL)` in Edit. Set Scroll to HALF and scroll down with it, scroll a one-time number of lines (for example `DOWN 3`), then jump to the last page with a one-time MAX, leaving the field at HALF." No steps shown. The one-time number was added in the M3 hardening because the lesson teaches "a number is that many lines" and the first Challenge never required one.

## Common mistakes
- Typing HALF on the command line instead of the field: the simulator answers `COMMAND NOT RECOGNIZED`; the amount belongs in the Scroll field, or after `DOWN`/`UP`.
- Expecting MAX typed in the field to stay: in real ISPF a MAX scroll is one-time wherever MAX was typed, and the amount reverts afterwards (UG1 p.17, p.60). The simulator now does the same.

## Expected results
The simulator shows a fixed number of data lines per screen (its page size); HALF moves half of that. The member is longer than one screen, so every step visibly moves.

## Simulator limitations (shown to the learner)
- Only the Edit panel's Scroll field can be changed. Data set lists and member lists show a fixed `PAGE`.
- DATA and CSR scroll a full page here; in ISPF DATA is one line less than a page and CSR follows the cursor.
- The form "type a number on the command line, then press the scroll key" is not supported; use `DOWN 3`.
- The simulator keeps one amount per edit session, seeded from the option 0 default (a convenience real ISPF does not have, lesson 3). Real ISPF keeps at least three saved amounts (Browse, Edit and View, member lists; UG1 p.9 also lists Data Set List).

## References
SRC-013 *z/OS ISPF User's Guide Vol I* SC19-3627-70: Scroll field, printed p.17; Scrolling, printed p.59-60 (checked against the PDF text on 2026-10-15; the HTML topic URL was not fetched).

## Validation design
- Events: `EDITOR_SCROLLED` carries the amount used (PAGE, HALF, MAX, CSR, DATA or a number of lines); the state check reads `editor.scrollAmount`.
- Learn steps: page (amount PAGE), half (amount HALF), once (amount `3` and the field still HALF), max (amount MAX), then leave.
- False positives considered: scrolling with an unrelated amount (amount differs); HALF set but never used (no event); `DOWN 3` while the field is not HALF (state check fails); scrolling elsewhere (the event requires the editor).
- Alternatives accepted: PF7/PF8 or `UP`/`DOWN`; `DOWN HALF` on the command line yields amount HALF and passes the half step (the point is knowing HALF); the Challenge also needs the field to be HALF at the end.
- Challenge outcome: SCROLL opened in Edit, then a scroll with amount HALF, then a scroll with amount MAX, and the field is HALF. False on the start state and on leftovers (member recreated and setting reset on every start).

## Starting state and reset
`resetSettings: ["scrollDefault"]`, `createMembers` for `{HLQ}.DATA(SCROLL)` (60 records), screen Primary Option Menu. A restart recreates the member and asks first if the learner changed it.

## Second-pass examination: findings and resolutions (2026-10-16)
| Finding | Resolution |
|---|---|
| a-01-C20 (HIGH): spec said a MAX typed in the field is not one-time; IBM says it is, and the simulator kept it | simulator fixed (`scrollBeforeMax`), regression tests in `tests/engine/editorFlow.test.ts`, spec and Challenge test corrected |
| "line 2" is the simulator's layout; real ISPF defaults to the command line at the bottom | lesson text labels it |
| "PAGE" at the start is the simulator's seed | lesson text labels it |
| "full screen" -> "full page of the visible data"; "MAX goes to the end" -> "to the limit in the direction you scroll" | lesson text corrected |
| `COMMAND NOT RECOGNIZED` is the simulator's own text | stays labelled simulated; real text UNVERIFIED |
