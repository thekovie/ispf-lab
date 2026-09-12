/**
 * Resolves prefix-area (line) commands for one Enter press.
 * Reference: docs/04-editor-commands.md §Line commands.
 *
 * Algorithm: merge pending + newly typed → parse → pair blocks → validate copy/move
 * (exactly one source group and one A/B destination) → apply immediates → apply copy/move.
 * Anything incomplete stays in `session.pending` and is redisplayed, as ISPF does.
 */
import { parseEditorLineCommand, type EditorLineCommand } from "@/parsers/editorLineCommand";
import * as ops from "./lineOps";
import type { EditorEvent, EditorMessage, EditorResult, EditorSession, PendingCommand } from "./types";

export const LINE_MSG = {
  INVALID: "INVALID LINE COMMAND",
  DEST_REQUIRED: "DESTINATION REQUIRED",
  BLOCK_INCOMPLETE: "BLOCK COMMAND INCOMPLETE",
  DEST_NOT_ALLOWED: "DESTINATION NOT ALLOWED",
  CONFLICT: "CONFLICTING LINE COMMANDS",
  PENDING: "MOVE/COPY IS PENDING",
  BROWSE: "LINE COMMANDS NOT ALLOWED IN BROWSE",
} as const;

interface Entry {
  lineId: number;
  raw: string;
  cmd: EditorLineCommand;
}

type SingleEntry = Entry & { cmd: { kind: "single" } };

const BLOCK_TO_SINGLE: Record<string, string> = {
  DD: "D",
  RR: "R",
  CC: "C",
  MM: "M",
  XX: "X",
  LCC: "LC",
  UCC: "UC",
  "((": "(",
  "))": ")",
  "<<": "<",
  ">>": ">",
};

export function applyLineCommands(s: EditorSession, typed: Record<number, string>): EditorResult {
  if (s.mode === "BROWSE") {
    const any = Object.values(typed).some((v) => v.trim() !== "");
    return { session: s, events: [], message: any ? { text: LINE_MSG.BROWSE, severity: "error" } : undefined };
  }
  const merged = mergePending(s, typed);
  const parsed = parseEntries(s, merged);
  if ("error" in parsed) {
    return { session: { ...s, pending: toPending(merged) }, events: [], message: { text: parsed.error, severity: "error" } };
  }
  const entries = parsed.entries;
  const { pairs, unpaired } = pairBlocks(entries);
  const singles = entries.filter((e): e is SingleEntry => e.cmd.kind === "single");
  const dests = singles.filter((e) => e.cmd.cmd === "A" || e.cmd.cmd === "B");
  const sources = collectSources(s, singles, pairs, entries);

  const events: EditorEvent[] = [];
  let session: EditorSession = { ...s, pending: [] };
  let message: EditorMessage | undefined;
  const keepPending: Entry[] = [...unpaired];
  if (unpaired.length > 0) message = { text: LINE_MSG.BLOCK_INCOMPLETE, severity: "info" };

  if (sources.length > 1 || dests.length > 1) {
    keepPending.push(...dests, ...sources.flatMap((x) => x.keep));
    message = { text: LINE_MSG.CONFLICT, severity: "error" };
  } else if (sources.length === 1 && dests.length === 0) {
    keepPending.push(...sources[0].keep);
    message = { text: LINE_MSG.DEST_REQUIRED, severity: "info" };
  } else if (sources.length === 0 && dests.length === 1) {
    keepPending.push(dests[0]);
    message = { text: LINE_MSG.PENDING, severity: "info" };
  }

  const keepIds = new Set(entries.map((e) => e.lineId));
  session = ops.pruneUnusedInserts(session, keepIds);
  session = applySingles(session, singles, events);
  session = applyPairs(session, pairs, events);

  if (sources.length === 1 && dests.length === 1) {
    const src = sources[0];
    const d = dests[0];
    if (src.ids.includes(d.lineId) && src.move) {
      keepPending.push(...src.keep, d);
      message = { text: LINE_MSG.DEST_NOT_ALLOWED, severity: "error" };
    } else {
      session = ops.copyOrMove(session, src.ids, d.lineId, d.cmd.cmd === "B", d.cmd.count, src.move);
      events.push({ type: src.move ? "EDITOR_LINES_MOVED" : "EDITOR_LINES_COPIED", count: src.ids.length, detail: d.cmd.cmd });
    }
  }

  const stillPresent = new Set(session.lines.map((l) => l.id));
  const pending: PendingCommand[] = keepPending
    .filter((e) => stillPresent.has(e.lineId))
    .map((e) => ({ lineId: e.lineId, raw: e.raw }));
  return { session: { ...session, pending }, events, message };
}

/** Typed blank cancels a pending command on that line; typed text replaces it. */
function mergePending(s: EditorSession, typed: Record<number, string>): Map<number, string> {
  const merged = new Map<number, string>();
  for (const p of s.pending) merged.set(p.lineId, p.raw);
  for (const [k, v] of Object.entries(typed)) {
    const id = Number(k);
    if (v.trim() === "") merged.delete(id);
    else merged.set(id, v.trim().toUpperCase());
  }
  return merged;
}

function parseEntries(s: EditorSession, merged: Map<number, string>): { entries: Entry[] } | { error: string } {
  const order = new Map(s.lines.map((l, i) => [l.id, i] as const));
  const entries: Entry[] = [];
  for (const [lineId, raw] of merged) {
    if (!order.has(lineId)) continue;
    const parsed = parseEditorLineCommand(raw);
    if (!parsed) continue;
    if (!parsed.ok) return { error: parsed.error };
    entries.push({ lineId, raw, cmd: parsed.command });
  }
  entries.sort((a, b) => order.get(a.lineId)! - order.get(b.lineId)!);
  return { entries };
}

interface Pair {
  cmd: string;
  from: number;
  to: number;
}

function pairBlocks(entries: Entry[]): { pairs: Pair[]; unpaired: Entry[] } {
  const pairs: Pair[] = [];
  const open = new Map<string, Entry>();
  for (const e of entries) {
    if (e.cmd.kind !== "block") continue;
    const first = open.get(e.cmd.cmd);
    if (first) {
      pairs.push({ cmd: e.cmd.cmd, from: first.lineId, to: e.lineId });
      open.delete(e.cmd.cmd);
    } else open.set(e.cmd.cmd, e);
  }
  return { pairs, unpaired: [...open.values()] };
}

interface Source {
  ids: number[];
  move: boolean;
  keep: Entry[];
}

function collectSources(s: EditorSession, singles: SingleEntry[], pairs: Pair[], entries: Entry[]): Source[] {
  const sources: Source[] = [];
  for (const e of singles) {
    if (e.cmd.cmd === "C" || e.cmd.cmd === "M") {
      sources.push({ ids: ops.idsFrom(s, e.lineId, e.cmd.count), move: e.cmd.cmd === "M", keep: [e] });
    }
  }
  for (const p of pairs) {
    if (p.cmd === "CC" || p.cmd === "MM") {
      const keep = entries.filter((e) => e.lineId === p.from || e.lineId === p.to);
      sources.push({ ids: ops.idsBetween(s, p.from, p.to), move: p.cmd === "MM", keep });
    }
  }
  return sources;
}

const SHIFT_CMDS = new Set(["(", ")", "<", ">"]);

function applySingles(start: EditorSession, singles: SingleEntry[], events: EditorEvent[]): EditorSession {
  let session = start;
  for (const e of singles) {
    const { cmd, count } = e.cmd;
    const id = e.lineId;
    const ids = () => new Set(ops.idsFrom(session, id, count));
    if (SHIFT_CMDS.has(cmd)) {
      const n = count === 1 ? 2 : count;
      const fn = cmd === "(" || cmd === "<" ? ops.shiftLeft(n) : ops.shiftRight(n);
      session = ops.transformIds(session, new Set(ops.idsFrom(session, id, 1)), fn);
      continue;
    }
    switch (cmd) {
      case "I":
        session = ops.insertBlank(session, id, count);
        events.push({ type: "EDITOR_LINE_INSERTED", count });
        break;
      case "D":
        session = ops.deleteIds(session, ids());
        events.push({ type: "EDITOR_LINE_DELETED", count });
        break;
      case "R":
        session = ops.repeatLine(session, id, count);
        events.push({ type: "EDITOR_LINE_REPEATED", count });
        break;
      case "X":
        session = ops.setExcluded(session, ids(), true);
        events.push({ type: "EDITOR_LINES_EXCLUDED", count });
        break;
      case "S":
        session = ops.setExcluded(session, ids(), false);
        break;
      case "F":
        session = ops.showEdgeOfExcludedBlock(session, id, count, true);
        break;
      case "L":
        session = ops.showEdgeOfExcludedBlock(session, id, count, false);
        break;
      case "COLS":
        session = { ...session, colsAfter: id };
        break;
      case "TS":
        session = ops.textSplit(session, id, session.cursor.lineId === id ? session.cursor.col : session.lrecl);
        events.push({ type: "EDITOR_LINE_INSERTED", count: 1 });
        break;
      case "LC":
        session = ops.transformIds(session, ids(), (t) => t.toLowerCase());
        break;
      case "UC":
        session = ops.transformIds(session, ids(), (t) => t.toUpperCase());
        break;
      default:
        break; // C, M, A, B are resolved by the copy/move step
    }
  }
  return session;
}

function applyPairs(start: EditorSession, pairs: Pair[], events: EditorEvent[]): EditorSession {
  let session = start;
  for (const p of pairs) {
    const ids = new Set(ops.idsBetween(session, p.from, p.to));
    const single = BLOCK_TO_SINGLE[p.cmd];
    if (SHIFT_CMDS.has(single)) {
      const fn = single === "(" || single === "<" ? ops.shiftLeft(2) : ops.shiftRight(2);
      session = ops.transformIds(session, ids, fn);
      continue;
    }
    switch (single) {
      case "D":
        session = ops.deleteIds(session, ids);
        events.push({ type: "EDITOR_LINE_DELETED", count: ids.size });
        break;
      case "R":
        session = ops.repeatBlock(session, p.from, p.to);
        events.push({ type: "EDITOR_LINE_REPEATED", count: ids.size });
        break;
      case "X":
        session = ops.setExcluded(session, ids, true);
        events.push({ type: "EDITOR_LINES_EXCLUDED", count: ids.size });
        break;
      case "LC":
        session = ops.transformIds(session, ids, (t) => t.toLowerCase());
        break;
      case "UC":
        session = ops.transformIds(session, ids, (t) => t.toUpperCase());
        break;
      default:
        break; // CC / MM are resolved by the copy/move step
    }
  }
  return session;
}

function toPending(merged: Map<number, string>): PendingCommand[] {
  return [...merged].map(([lineId, raw]) => ({ lineId, raw }));
}
