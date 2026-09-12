# ISPF Lab

An interactive, browser-based simulator that teaches beginners how to navigate IBM z/OS **ISPF** — the Primary
Option Menu, option 3.4, member lists, and the record-oriented ISPF editor with its line commands — with a lesson
engine that verifies what you actually do.

> Educational ISPF training simulator. Not affiliated with or endorsed by IBM. z/OS, ISPF and TSO are trademarks of
> IBM Corporation. This is a deterministic simulation with a virtual catalog; it is **not** a z/OS emulator, a TN3270
> client or a mainframe connection.

## What it does

- **Simulated ISPF**: TSO/E LOGON (any userid becomes your HLQ), Primary Option Menu, options 0, 1, 2, 3 (3.1 Library,
  3.2 Data Set incl. Allocate, 3.3 Move/Copy, 3.4 DSLIST), 6 (TSO subset); member lists; confirmation panels;
  Browse / View / Edit.
- **ISPF editor**: overtype records, prefix-area line commands (`I In D Dn DD R RR C CC M MM A B X XX S F L COLS TS
  LC UC …`), primary commands (`SAVE CANCEL FIND RFIND CHANGE RCHANGE EXCLUDE RESET LOCATE TOP BOTTOM UP DOWN LEFT
  RIGHT CAPS COLS CREATE REPLACE COPY …`), PF3 saves, PF12 cancels, terminal-style error messages — never web dialogs.
- **Course**: 14 lessons in 5 modules, in Learn / Practice / Challenge modes, validated by simulator events and the
  resulting catalog (any legitimate ISPF route is accepted). Sandbox mode = the whole simulator, no lesson.
- **Explain**: a glossary of z/OS terminology (`EXPLAIN PDS` on any command line).
- **Local only**: catalog, settings and progress live in your browser (localStorage); reset, export and import from
  the Progress page. No account, no server.
- **Landing page** that works on any device; the simulator itself requires a desktop-class viewport and keyboard.

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # 127 engine tests (Vitest)
pnpm check        # typecheck + lint + test
pnpm build        # production build
pnpm icons        # regenerate favicon.ico / icon PNGs from scripts/make-icons.mjs
```

For production set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) so canonical URLs, Open Graph tags, `sitemap.xml`
and `robots.txt` carry the real origin.

Open `/`, press `1` (Learn) — or go straight to `/lab`. Log on as `USER01` (or any 1–7 character userid), type `3.4`,
press Enter.

## Keyboard

Enter processes the panel · Tab / Shift+Tab move between fields · F1 help · F3 end/back · F5 repeat find ·
F6 repeat change · F7 / F8 scroll · F10 / F11 scroll left / right · F12 cancel · Insert toggles overtype.
Browsers intercept some F-keys, so the clickable PF strip under the terminal performs the identical action.

## Documentation

| Document | Purpose |
|---|---|
| [docs/00-project-log.md](docs/00-project-log.md) | Phase-by-phase journal: what was built, decisions, verification |
| [docs/01-prd.md](docs/01-prd.md) | Requirements distilled from the brief |
| [docs/02-architecture.md](docs/02-architecture.md) | The eight layers, state/event model, data flow |
| [docs/03-ispf-behaviour-reference.md](docs/03-ispf-behaviour-reference.md) | Every panel, command and message the simulator implements |
| [docs/04-editor-commands.md](docs/04-editor-commands.md) | Editor line and primary command semantics |
| [docs/05-course-design.md](docs/05-course-design.md) | The 14 lessons, validators, coaching UI, glossary |
| [docs/06-design-direction.md](docs/06-design-direction.md) | Visual direction, tokens, typography, mobile gate |
| [docs/07-testing.md](docs/07-testing.md) | Test strategy and what each file covers |
| [docs/08-resources.md](docs/08-resources.md) | The reference guides the course follows |
| [docs/adr/](docs/adr/README.md) | Architecture Decision Records |
| [docs/spec/original-brief.md](docs/spec/original-brief.md) | The original specification, verbatim |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to run, test, add a lesson or a panel, report a fidelity gap |
| [CHANGELOG.md](CHANGELOG.md) | Release notes |

## Project layout

```
src/
  app/            Next.js routes: / (landing), /lab, /lab/progress, /resources
  catalog/        virtual data-set catalog (pure)
  parsers/        command parsers (pure)
  editor/         ISPF editor engine (pure)
  engine/         screen/navigation reducer + one handler per panel (pure)
  tutorial/       lessons, validators, runner, glossary (pure)
  persistence/    StorageAdapter + catalog/progress/settings stores
  state/          SimulatorStore + React providers
  components/     terminal renderer, coach panel, shell, landing
tests/            Vitest suites mirroring the layers
docs/             see above
```

## Name

The project is called **ISPF Lab**. Names also considered, kept for a possible rebrand: Option34, PanelDrill,
GreenScreen Dojo, PF3 Academy, DSLIST Dojo, TSO Trainer, Sim3270 (type `NAMES` on the landing page's option line).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Vitest · pnpm. See [docs/adr](docs/adr/README.md).

## License

MIT (see LICENSE). Content of the reference guides remains the property of their publishers.
