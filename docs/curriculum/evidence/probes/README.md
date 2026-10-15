# Probe scripts: status and how to read them

These are the exploratory scripts used during the Phase 0 audit and the M0 review. Evidence value differs by folder.

| Folder / files | Author | What they do | Evidence status |
|---|---|---|---|
| `probe-*.probe.ts.txt`, `probe2-*.probe.ts.txt` | Phase 0 auditors | Drive the real simulator and runner and **print** results with `console.log`. **None contains an `expect()`**, so they pass whatever happens | Exploratory. The M0 reviewer executed all ten and reproduced their key console results, but a green run proves nothing by itself. **Superseded by the asserting regression tests added in M1a** (see `tests/tutorial/`, each test names the finding it covers) |
| `m0-review/*.probe.ts.txt` + `*.out.txt` | M0 reviewer | Independent, parametrised checks (Challenge completion on the start state, single and scripted shortcut actions, L6 replay, Browse rendering) with the raw output of the run | Reproduced results. Outputs are snapshots from 2026-10-15 against commit `e97a91b` |

Rules for contributors:

- Do not delete these files: they are the audit evidence. Add new evidence beside them.
- A new probe that is meant to guard behaviour belongs under `tests/` as an asserting test, not here.
- To re-run a text probe: copy it and `m0-review/vitest.config.mjs.txt` into an empty folder **outside the repo**, remove the `.txt` suffix, and run `vitest` there. The config aliases `@` and `@tests` to this repo's `src` and `tests`.

## Where each probe is now covered by an asserting test (M1a)

| Probe(s) | Finding | Asserting test |
|---|---|---|
| audit `b`, `c`, `l` (A, A2), `n`; M0 `m0-challenge`, `m0-single`, `m0-seq` | Challenge completes with no or few actions (F-01) | `tests/tutorial/challenge.test.ts` ("not completed by doing nothing", "not completed by the shortcut: ...") using `SHORTCUTS` in `tests/tutorial/walks.ts` |
| M0 `m0-l6`, audit `l`/C | replay dead end, leftover state (F-02, F-16) | `challenge.test.ts` ("can be run twice", "scenario isolation"), `provider.test.tsx` (restart, mode switch) |
| audit `d` (profile leak) | edit profiles leak between lessons | `scenario.test.ts` (`resetProfiles`), isolation matrix |
| M0 race hypothesis (no probe: needs React) | `startLesson` event race (F-03) | `provider.test.tsx` "startLesson does not complete the previous lesson" |
| audit `a` (L17 step 5), `f` (L21 FLIP alone), `m` (L27 comment), `n` (L27 zero jobs), `o` (L28 alternate repair), `e`, `g`, `h` | validator and SJ/PREFIX fidelity defects | **M1b**: listed as `it.todo` in `tests/tutorial/challenge-routes.test.ts`; not asserted yet so as not to lock in the defects |
