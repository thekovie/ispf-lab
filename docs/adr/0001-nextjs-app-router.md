# 0001 — Next.js App Router + React 19 + TypeScript + Tailwind v4, pnpm

Date: 2026-09-11 · Status: Accepted

## Context
The brief requires Next.js, TypeScript, React, Tailwind, client-side state, local persistence, and an architecture that
can gain a backend later. The user's most recent projects use Next 16 / React 19 / Tailwind v4 / ESLint 9.

## Options
1. Next.js App Router (matches the user's toolchain; static prerender; server routes available later).
2. Vite + React (lighter, but the brief names Next.js).
3. Next.js Pages Router (older conventions).

## Decision
Option 1 with pnpm (user's choice). All app code is client-rendered behind `"use client"` boundaries; pages are
statically prerendered. No API routes in the MVP.

## Consequences
- React-compiler lint rules (no ref reads in render, no setState in effects) shaped the state design (ADR 0002).
- Adding accounts later means adding route handlers and a storage adapter, not touching the engine.
