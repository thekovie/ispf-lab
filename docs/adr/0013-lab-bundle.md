# 0013 — Export/Import Lab is one versioned bundle, validated field by field

Date: 2026-09-14 · Status: Accepted

## Context
v0.1 exported the catalog only (`{app:"ispf-lab", catalog}`) and imported it with a two-line check. Priority 2
added per-userid edit profiles and Priority 5 adds a job queue; learners moving between machines want everything.
Imported files are untrusted input that ends up in `localStorage` and in the engine.

## Options
1. Keep separate exports per store (catalog, profiles, progress …) — four files to carry, easy to mix versions.
2. One bundle `{format, version, exportedAt, userid, catalog, editProfiles, progress, settings}` with a validator
   that rebuilds each object from known keys, and a migration path for the v0.1 shape.
3. A schema library (zod) — a new dependency for one file.

## Decision
Option 2 (`src/persistence/labBundle.ts`). `parseBundle` enforces a 5 MB cap, JSON-only, format/version, data-set
and member name rules, record arrays of strings, profile/progress/settings shapes; unknown keys are dropped, derived
fields (`dsorg`, `id`) are recomputed, and `readOnly` is only honoured when literally `true`. The v0.1 export is
accepted as version 1 and migrated with empty profiles/progress. `applyBundle` writes per-userid keys plus the
global progress/settings and returns counts for the confirmation note. Catalog-only `exportCatalog/importCatalog`
were removed.

## Consequences
- New stores (Priority 5 jobs) extend the bundle by adding a validated optional field; old files still import.
- Import replaces the target userid's data after a confirm dialog; there is no merge.
- Errors are `BundleError`s with plain-language reasons shown on the Progress page.
