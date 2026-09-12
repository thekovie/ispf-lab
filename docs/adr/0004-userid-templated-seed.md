# 0004 — Seed catalog templated on the logon userid; no personal names

Date: 2026-09-11 · Status: Accepted

## Context
The brief's example HLQ was the author's name. The user asked that no personal name appear in the product, and
that it feel like a real ISPF where the userid is the HLQ.

## Options
1. `buildSeed(hlq)` produces `<HLQ>.JCL`, `<HLQ>.COBOL`, … for whatever userid is typed at LOGON; lessons use a
   `{HLQ}` placeholder.
2. A fixed neutral HLQ (`USER01`) for everyone.

## Decision
Option 1 (default `USER01`). Catalogs are stored per userid, so logging on as another id keeps the previous one.
`SYS1.*` libraries are shared and read-only. Tests assert the author's name never appears in seed or lessons.

## Consequences
- Lesson text, validators and field ids resolve `{HLQ}` at runtime (`fillHlq`).
- Instructors can hand out different userids to different learners on one machine.
