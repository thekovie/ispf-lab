# 0017 — Lesson `requires` is advice, `sources` is checked by format only, and lessons start with the menu underneath

Date: 2026-10-15 · Status: Accepted (milestone M2, approved by the project owner after the M1 closure review)

## Context
The M0 review reduced the planned lesson metadata to two optional fields, `requires` and `sources`, and rejected a code-side source
registry that fails the build on a broken id, a competency framework, and fields such as `difficulty`, `estimatedMinutes` and
`reviewStatus`. The closure review also left GAP-73 open: a lesson that starts on its first panel (for example the Data Set List
Utility) has an empty panel stack, so PF3 does nothing, where real ISPF returns to the menu.

## Decision
1. **`Lesson.requires?: string[]`** names earlier lessons worth finishing first. It is **advice, never a lock**: the coach panel shows a
   "Before you start" note while a required lesson is not completed, and the lesson starts as usual. The starting state of every
   lesson must still stand on its own (authoring standard; M1a already made L13, L14 and L25 self-sufficient). A test requires each id to
   exist, to name an earlier lesson, and to appear once.
2. **`Lesson.sources?: string[]`** lists evidence ids such as `SRC-003#disp-defaults` from `docs/curriculum/verified-sources.md`. The
   test checks the **format only**. It does not read the document, so a registry that lags a lesson cannot break the build, which is what
   the M0 review rejected. Existing lessons are not backfilled: the audit cites evidence rows and page numbers, not per-lesson SRC ids,
   and inventing a mapping would be a claim without a source. New lessons add `sources` as part of their spec.
3. **`LessonStart.underMenu`** puts the Primary Option Menu under the starting screen. Every lesson that starts below the menu (L5, L7-L10,
   L12) sets it, and a test fails for any new lesson that starts on another panel without it. The setup dispatch is ignored by the
   runner, as before, so it is not learner activity.

## Consequences
- No stored data changes: lesson ids, step ids and the progress record are untouched (the compatibility test still passes).
- `requires` is only declared for L13 (its text names lesson 6). Other lessons keep course order as their implicit sequence until a
  new lesson needs more. Adding `requires` is a content decision, not a code one.
- The note reads the saved progress, which is global per browser (ADR 0014), so it follows the browser, not the userid.
- `leaves`, `difficulty`, `estimatedMinutes` and `reviewStatus` from the first metadata sketch in the authoring standards are dropped.
- A hard lock, a "recommended path" view and per-track grouping stay out of scope (milestone M5, if ever approved).
