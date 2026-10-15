# 0018 — Display order is separate from lesson numbers, draft lessons are gated, and concepts can be checked with multiple-choice questions

Date: 2026-10-16 · Status: Accepted (milestone M3 hardening, decisions given by the project owner after the M3 progress report)

## Context
M3 added eight lessons (numbers 29-36) and left them at the end of the course, after the Day-One capstone, in a new "Foundations"
module. They belong earlier (the Scroll field after the editor basics, data set types after allocation, the big picture before the
first job), but lesson ids and numbers are stable identifiers (stored progress keys on id, docs and links use numbers). The same
review found that the drafts, which the standards forbid publishing before independent review, were visible everywhere the lesson
list is used (landing page counts, menu, progress page, structured data, "next lesson" after lesson 28), and that the repository is
public with a hosting integration that builds every pushed branch. The b-01 lesson also had no way to assess recall of concepts that
have no simulator event.

## Decision
1. **Display order is the order of the `LESSONS` array** (`src/tutorial/lessons/index.ts`). `id` and `number` never change. The new
   lessons sit where they teach best and take the module of their neighbours ("The editor", "Data sets", "Batch jobs and SDSF"); the
   original 28 keep their relative order. Numbers therefore appear out of sequence in the menu (29 after 8); that is accepted rather
   than renumbering anything. Tests pin: unique numbers 1-36, original 28 in relative order, every lesson after the lessons it
   `requires`, each module's lessons adjacent.
2. **`Lesson.draft?: boolean`**. A draft lesson is dropped from `LESSONS`, `MODULES`, `lessonById` and `nextLesson` unless
   `NEXT_PUBLIC_SHOW_DRAFT_LESSONS=1`. `next dev` and the test run set it (`next.config.ts`, `vitest.config.mts`); a production build does not,
   so a preview or production deployment shows the 28 reviewed lessons and the counters say 28. Reviewers build with the flag to see the
   drafts. Removing `draft` from a lesson is the act of publishing it and needs the review recorded in its spec.
3. **Check questions** (`Lesson.questions`, `LessonStep.questionId`, `answered(id)` validator, `answerQuestion` in the engine): a
   multiple-choice question with one keyed answer. A wrong choice counts as a mistake, a right one is remembered by the runner until
   restart, and a step or the Challenge passes with `answered(id)`. It is the smallest mechanism that assesses recall without a simulator event: no
   new event type, no persistence, no free text. It is not a scored exam: choices can be retried (each wrong try costs the usual 10 points).
   b-01 uses three questions (which piece gives the session, receives the job, shows the output); its Challenge needs the trace **and** the answers.

## Consequences
- Stored progress is unchanged; a learner who somehow holds progress for a draft id keeps it, the lesson is just not listed.
- `ProgressView`, landing, menu and structured data need no change: they already read `LESSONS`.
- The question mechanism is deliberately small. A richer assessment (several question types, explanations per option, shuffling) is a
  later decision; shuffling would break determinism of tests and is not done.
- CI now also runs on pushes to `feat/**` branches so a feature branch can be verified without opening a pull request.
- The gate protects deployments, not the source: the draft text is readable in the public repository once pushed.
