# 0014 — Lesson progress is one record per browser; the app is single-learner

Date: 2026-10-15 · Status: Accepted (decision D1 of the M0 acceptance review)

## Context
`ispf-lab:progress:v1`, the current-lesson key and the mode key carry no userid, while the catalog, edit profiles
and JES state are keyed per userid (`src/persistence/keys.ts`). A second userid on the same browser therefore sees the
first userid's completions. The M0 review confirmed this (finding F-13) and rated it P2: the product is local-first
and used by one person per browser profile.

## Options
1. Key progress, mode and current lesson by userid, with a one-time migration of the existing `v1` record.
2. Keep one record per browser and state the scope explicitly.

## Decision
Option 2. Progress belongs to the browser profile, not to a logon userid. The userid is the high-level qualifier of the
training data, not an account. No storage key changes, so existing progress stays valid.

## Consequences
- No migration and no risk to saved progress.
- Logging on as another userid keeps completed-lesson marks while the catalog and jobs are that userid's own. The
  Progress page and `README` say so.
- Import Lab overwrites browser-wide progress; the confirm dialog already says this.
- Revisit if multi-learner use appears (shared classroom browsers): that needs a keyed record and a migration, and
  would supersede this ADR.
