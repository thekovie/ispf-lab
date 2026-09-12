# Design direction

## Direction

**"A logon screen turned into a lesson."** The product is a terminal; the site around it borrows the terminal's
grammar (panel titles, textual rules, `Option ===>` rows, PF-key legends) instead of card-and-hero web conventions.
Tone: technical, dense, retro-futurist, readable. Memorable detail: the landing hero is the real simulator typing
itself.

Anti-patterns deliberately avoided: file icons, folder trees, floating action buttons, modal dialogs for ISPF errors,
gradients/blobs, cards inside cards, dark-mode-by-default-without-intent (the CRT look *is* the product).

## Tokens (`src/app/globals.css`)

| Token | Value | Role |
|---|---|---|
| `--crt-bg` | `#06090d` | screen background |
| `--crt-bezel` / `--crt-surface` / `--crt-surface-2` | `#0d1319` / `#0b1016` / `#111922` | frame, panels |
| `--crt-border` | `#1f2b36` | rules and borders |
| `--crt-green` | `#33ff66` | input fields, data (unprotected) |
| `--crt-cyan` | `#4fd1ff` | labels, legends |
| `--crt-white` | `#e6edf3` | titles, protected text |
| `--crt-amber` | `#ffb000` | attention: messages, pending commands, calls-to-action |
| `--crt-red` | `#ff5c5c` | error short messages |
| `--crt-blue` | `#5b8def` | reserved for protected emphasis |
| `--crt-dim` | `#5c6c7a` | markers, rules, tips |

Colour is semantic: green = you can type here, cyan = label, white = protected, amber = attention, red = error.

## Typography

IBM Plex Mono (weights 400/500/700) for everything terminal-like; IBM Plex Sans (400/500/600) only for long-form
explainer paragraphs. Two families, loaded with `next/font` and `display: swap`. Terminal font size 15px in the lab,
fitted to the container on the landing page (ResizeObserver, 80 columns must always fit).

## Terminal (`src/components/terminal/terminal.css`)

80×24 grid in `ch` units, `box-sizing: content-box`, `white-space: pre`, segments `flex-shrink: 0` so a row can
never wrap. Fields are `<input>`s with transparent background and a faint underline; focus = brighter background and
inset glow; editor records lose the underline so the screen reads as text. Scanline overlay is decorative and
removed for `prefers-reduced-motion`. Learn-mode field hint: amber pulsing inset outline (static when reduced motion).

Status line: `4B  USER01  EDIT  MODIFIED …  ^ INSERT  05/019` — the 3270 operator information area.
PF strip: physical-key-like buttons, active keys bright, inactive dimmed, Insert toggle and Enter on the right.

## Coach panel

Laid out like an ISPF panel: cyan uppercase section labels, dashed rules, amber left edge, mono type. No card
shadows, no icons.

## Landing (`src/components/landing`)

Hero: headline + four `Option`-style rows (1 Learn … 4 Sandbox) + an `Option ===>` input, and the self-typing
terminal on the right. Sections carry `Row n of 6` markers and dashed rules. The panel-anatomy figure is a coloured
`<pre>` with callouts. Motion: typewriter, blinking cursor, nothing else; both stop under reduced motion.
Keyboard: `1`–`4` navigate; `NAMES` on the option line lists alternative project names.

## Mobile gate

`/lab/*` requires `innerWidth ≥ 1024` and `(pointer: fine)`. Otherwise a terminal-styled "TERMINAL TOO SMALL"
notice with a copy-link button; nothing from the simulator mounts. The landing page and `/resources` remain fully
usable; the landing CTA shows the notice inline instead of navigating.

## Responsive checkpoints

1440 / 1024 (lab), 768 / 390 (landing + gate). Verified by screenshots during Phase 8 (see project log).

## Icon

A 16-unit design grid drawn procedurally by `scripts/make-icons.mjs`: rounded dark square (`--crt-bg`) with a
bezel ring, a short cyan title row, two dim protected rows, and a green block cursor with a soft phosphor glow beside
a dim green field underline — "the place where you type". Exported as favicon.ico (16/32/48), 512 px PNG, 180 px
Apple touch icon and 192/512 px PWA icons. The Open Graph card (`src/app/opengraph-image.tsx`) pairs a Primary
Option Menu panel with a stacked "Learn / ISPF / by typing." headline in IBM Plex Mono.
