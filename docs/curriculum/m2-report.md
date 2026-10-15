# M2 report - lesson metadata and start stack

**Date:** 2026-10-15. **Branch:** `feat/m2-lesson-metadata` (from `feat/m1-closure`). **Status:** implemented, awaiting your review.
M3 is **not started**. Decisions: [ADR 0017](../adr/0017-lesson-metadata-and-start-stack.md).

## 1. Scope (as approved)

The reduced M2 from the M0 review: optional `requires` and `sources` on `Lesson`, plus the start-stack option that closes GAP-73, which
the closure report proposed for M2. Nothing else: no `difficulty`, `estimatedMinutes`, `reviewStatus`, source registry or hard lock.

## 2. What changed

| Item | Change |
|---|---|
| `Lesson.requires?` | Earlier lessons worth finishing first. **Advice, never a lock.** The coach panel shows a "Before you start" note while one is not completed; the lesson starts normally. Pure helper `missingPrerequisites` in `src/tutorial/prerequisites.ts` |
| `Lesson.sources?` | Evidence ids (`SRC-003#anchor`). **Format checked only**, not looked up in `verified-sources.md` (the M0 review rejected a registry that fails the build on a broken id) |
| `LessonStart.underMenu?` | Puts the Primary Option Menu under the starting screen so PF3 returns to the menu (GAP-73). Set on L5, L7, L8, L9, L10, L12 |
| Content | Only L13 declares `requires: ["l06-allocating"]` (its own text names lesson 6). No `sources` are backfilled: the audit cites evidence rows and pages, not per-lesson SRC ids, so a mapping would be invented |
| Gates | `metadata.test.ts`: every `requires` id exists, is an earlier lesson and appears once; `sources` format; any lesson that starts below the menu must set `underMenu` (so a new lesson cannot reintroduce GAP-73) |
| Docs | ADR 0017, authoring standards (the metadata sketch now lists only the two fields), docs/05, docs/07, roadmap |

## 3. Verification

| Check | Result |
|---|---|
| `pnpm check` | exit 0, no warnings: **30 test files, 1,803 tests passed** (closure: 28 files, 1,784) |
| `pnpm build` | exit 0, compiled successfully |
| Failing first | 10 tests failed against the stubbed helper and unchanged lessons (prerequisite listing, L13 `requires`, start-stack rule, PF3 on six lessons); the panel note test failed before the component change |
| Compatibility | `compat.test.tsx` still passes: lesson ids, step ids, progress key and shape unchanged. No new storage key, no network, no new dependency |
| Walks | All 28 legitimate routes, the Challenge baselines, the stale-state matrix and the 28 x 28 isolation matrix pass with the new start stack |
| Browser (Chrome, console clean) | Lesson 13 with lesson 6 not completed shows the note and starts; lesson 5 shows no note, and PF3 on its first panel returns to the Primary Option Menu with no mistake recorded ([screenshot](evidence/m2-browser/m1-l13-prerequisite-note.webp)) |

## 4. Behaviour changes

- Lessons 5, 7, 8, 9, 10 and 12: PF3 on the first panel now goes to the menu instead of doing nothing. (Challenge starts are the same.)
- Lesson 13 shows an advisory note until lesson 6 is completed.

## 5. Not done / limits

- The note appears for L13 only; adding `requires` elsewhere is a content decision for the lesson author.
- Progress is global per browser (ADR 0014), so the note follows the browser, not the userid.
- Sources are not shown to the learner (a "References" panel is M5) and not cross-checked against the evidence document.
- CI still has not run (nothing is pushed); see the closure report.

## 6. Decisions for you

1. Accept ADR 0017 (advice-only prerequisites; format-only sources; menu-underneath rule).
2. Authorise M3. The first gate is unchanged from the closure report: a-01, b-01, b-02 have no simulator prerequisite; b-03 to b-06 and b-10 each need one small simulator fix first.
