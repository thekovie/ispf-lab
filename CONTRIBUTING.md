# Contributing to ISPF Lab

Thanks for helping people learn ISPF. This file tells you how the repository is organised, how to run and test it,
and how to add the three things people most often add: a lesson, a panel, a glossary term.

## Running

```bash
pnpm install
pnpm dev            # dev server
pnpm test           # Vitest, all suites
pnpm test:watch
pnpm check          # typecheck + lint + test — run before every PR
pnpm build
```

Node 20+ and pnpm 10 are expected. The app has no environment variables and no backend.

## Ground rules

1. **The engine is pure.** Nothing under `src/catalog`, `src/parsers`, `src/editor`, `src/engine`, `src/tutorial`
   or `src/persistence` may import React or touch the DOM. Navigation logic lives in `src/engine/screens/*`, never
   in components.
2. **ISPF errors are terminal messages.** Use `fail(state, "SHORT MESSAGE", "longer explanation")`; never throw or
   open a dialog for a user mistake.
3. **z/OS terminology.** "Partitioned data set", "member", "high-level qualifier" — not folder, file, prefix.
   Analogies are allowed if flagged as analogies.
4. **No personal names** in seed data, lessons or UI. The userid is the HLQ; lesson text uses `{HLQ}`.
5. **Every behaviour is documented and tested.** A change to what the simulator does updates
   `docs/03-ispf-behaviour-reference.md` (or `docs/04-editor-commands.md`) and a test in `tests/`.
6. **Log the work.** Non-trivial changes get a line in `CHANGELOG.md`; a phase of work gets an entry in
   `docs/00-project-log.md`; a non-obvious choice gets an ADR in `docs/adr/`.

## How to add a lesson

1. Pick the module file in `src/tutorial/lessons/module*.ts` (or create `module6.ts`).
2. Copy an existing `Lesson` object. Fill `id` (kebab-case, `lNN-…`), `number`, `module`, `title`, `description`,
   `objective`, `teaches`, `startingState` (screen to open; members to restore from the seed), and `steps`.
3. Each step needs `instruction`, `hint`, `validator`, optionally `explanation` and `highlightField`.
   Compose validators from `src/tutorial/validators.ts` (`onScreen`, `eventIs`, `editorOpen`, `memberSatisfies`, …).
   Prefer state-based checks so every legitimate ISPF route passes. If a step should only pass after a user action,
   combine with an event (`eventIs("MEMBER_SAVED", …)`) or a state that only the action produces.
4. Register it in `src/tutorial/lessons/index.ts` (keep `number` order).
5. Add a `Coached` walk in `tests/tutorial/lessons.test.ts` that completes the lesson through the reducer.
6. Add the row to `docs/05-course-design.md` and cite the reference guide it follows.

## How to add a panel (screen)

1. Add the frame to `ScreenFrame` in `src/engine/types.ts` (typed params, no `any`).
2. Create `src/engine/screens/<name>.ts` exporting a `ScreenHandler` with `help`, `render`, `onEnter`, optional
   `onPf`. Compose rows with `src/engine/rows.ts`; keep every row ≤ 80 columns.
3. Register it in `src/engine/registry.ts`; if it is reachable by option number, add the path in
   `src/engine/navigation.ts#frameForPath`.
4. Emit semantic events (`SimEvent`) for anything a lesson might care about.
5. Tests in `tests/engine/navigation.test.ts`; document it in `docs/03-ispf-behaviour-reference.md`.

## How to add a glossary term

Append to `GLOSSARY` in `src/tutorial/explain.ts`: `term`, `aliases` (lower-case), `summary` (one sentence),
`detail`, optional `analogy` (flagged in the UI), optional `readMore` pointing at an id in `src/content/resources.ts`.

## Reporting an ISPF fidelity gap

Mainframe-experienced readers are the most valuable contributors. If the simulator differs from real ISPF, open an
issue with the **ISPF behaviour mismatch** template: what you typed, what ISPF Lab did, what real ISPF does, and a
manual reference (page or section). Fixes go to docs/03 or docs/04 first, then code and tests.

## Pull requests

- Conventional commits: `feat(editor): …`, `fix(dslist): …`, `docs(log): …`, `test(tutorial): …`.
- `pnpm check` green; no `console.log`; files under ~400 lines; functions focused.
- Describe the behaviour change and link the doc section you updated.
