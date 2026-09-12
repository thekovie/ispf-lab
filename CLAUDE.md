@AGENTS.md

# ISPF Lab — brief for AI collaborators

Read `docs/00-project-log.md` first (what exists and why), then `docs/02-architecture.md`.

## Rules that must hold

- The engine layers (`src/catalog`, `src/parsers`, `src/editor`, `src/engine`, `src/tutorial`, `src/persistence`)
  are pure TypeScript: no React, no DOM, no `window`. React lives in `src/state`, `src/components`, `src/app`.
- Navigation logic belongs in `src/engine/screens/*` and `src/engine/navigation.ts`, never in components.
- User mistakes produce ISPF-style short/long messages via `fail()`; never dialogs or thrown errors.
- Lessons validate events and state (`src/tutorial/validators.ts`); never DOM.
- No personal names in seed, lessons or UI; the userid is the HLQ (`{HLQ}` placeholder in lesson text).
- Every row a screen renders must fit 80 columns.
- Behaviour changes update `docs/03-ispf-behaviour-reference.md` / `docs/04-editor-commands.md` and a test.
- Append to `docs/00-project-log.md` for a phase of work; add an ADR for a non-obvious decision; add a CHANGELOG line.

## Commands

`pnpm dev` · `pnpm test` · `pnpm check` (typecheck + lint + test) · `pnpm build`

## Gotchas

- ESLint runs the React-compiler rules: no reading refs during render, no synchronous setState inside effects.
  Read browser storage in `useState` initializers (components under `DesktopGate` only mount on the client) or use
  `useSyncExternalStore`.
- `Terminal.tsx` keeps typed drafts locally and submits them on Enter/PF (3270 semantics). Do not "fix" that.
- Typed-over line numbers are stripped by `typedPrefix` in `src/engine/screens/editor.ts`.
