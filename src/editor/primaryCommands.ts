/**
 * Editor `Command ===>` semantics. SAVE/CANCEL/END/CREATE/COPY are returned as effects
 * because they need the catalog, which the screen engine owns.
 * Reference: docs/04-editor-commands.md §Primary commands.
 */
import type { EditorPrimaryCommand, FindDirection, ScrollAmount } from "@/parsers/editorPrimaryCommand";
import { clampTop, renumber, unnumber } from "./session";
import { undo, undoAvailable } from "./history";
import { boundsWindow, type EditProfile } from "./profile";
import { addSpecial, clearSpecial } from "./special";
import type { EditorEvent, EditorMessage, EditorResult, EditorSession } from "./types";

const info = (text: string): EditorMessage => ({ text, severity: "info" });
const error = (text: string): EditorMessage => ({ text, severity: "error" });
const SQ = String.fromCharCode(39);
const q = (t: string) => SQ + t + SQ;

export function applyPrimaryCommand(s: EditorSession, cmd: EditorPrimaryCommand): EditorResult {
  const none: EditorResult = { session: s, events: [] };
  switch (cmd.kind) {
    case "empty":
      return none;
    case "invalid":
      return { ...none, message: error(cmd.error) };
    case "save":
      if (s.mode === "BROWSE") return { ...none, message: error("SAVE NOT ALLOWED IN BROWSE") };
      if (s.mode === "VIEW") return { ...none, message: error("SAVE NOT ALLOWED IN VIEW") };
      return { ...none, effect: { kind: "save" } };
    case "cancel":
      return { ...none, effect: { kind: "cancel" } };
    case "end":
      return { ...none, effect: { kind: "end" } };
    case "create":
      if (s.mode === "BROWSE") return { ...none, message: error("COMMAND NOT ALLOWED IN BROWSE") };
      return { ...none, effect: { kind: "create", member: cmd.member, replace: cmd.replace } };
    case "copy":
      if (s.mode === "BROWSE") return { ...none, message: error("COMMAND NOT ALLOWED IN BROWSE") };
      return { ...none, effect: { kind: "copy", member: cmd.member } };
    case "explain":
      return { ...none, effect: { kind: "explain", term: cmd.term } };
    case "submit":
      if (s.mode === "BROWSE") return { ...none, message: error("COMMAND NOT ALLOWED IN BROWSE") };
      return { ...none, effect: { kind: "submit" } };
    case "reset":
      return reset(s, cmd.what);
    case "undo": {
      if (s.mode === "BROWSE") return { ...none, message: error("COMMAND NOT ALLOWED IN BROWSE") };
      if (!undoAvailable(s)) return { ...none, message: error("UNDO NOT AVAILABLE, SETUNDO OFF"), };
      const r = undo(s);
      if (!r.undone) return { ...none, message: info("NO MORE TO UNDO") };
      return { session: r.session, events: [{ type: "EDITOR_UNDO" }], message: info("UNDO COMPLETE") };
    }
    case "flip": {
      const lines = s.lines.map((l) => ({ ...l, excluded: !l.excluded }));
      return { session: { ...s, lines }, events: [{ type: "EDITOR_LINES_EXCLUDED", count: lines.filter((l) => l.excluded).length }], message: info("EXCLUDED STATUS FLIPPED") };
    }
    case "top":
      return scrollTo(s, 0);
    case "bottom":
      return scrollTo(s, Math.max(0, s.lines.length - s.pageSize));
    case "locate":
      return scrollTo(s, Math.max(0, Math.min(cmd.line, s.lines.length) - 1));
    case "scroll":
      return scroll(s, cmd.direction, cmd.amount);
    case "caps":
      return setProfile(s, { caps: cmd.on }, `CAPS ${onOff(cmd.on)}`);
    case "hex":
      return setProfile(s, { hex: cmd.on }, `HEX ${onOff(cmd.on)}`);
    case "stats":
      return setProfile(s, { stats: cmd.on }, `STATS ${onOff(cmd.on)}`);
    case "recovery":
      return setProfile(s, { recovery: cmd.on }, `RECOVERY ${onOff(cmd.on)}${cmd.on ? " - CHANGES ARE RECORDED FOR UNDO" : ""}`);
    case "setundo":
      return setProfile(s, { setundo: cmd.on }, `SETUNDO ${onOff(cmd.on)}`);
    case "autosave":
      return setProfile(s, { autosave: cmd.mode }, `AUTOSAVE ${cmd.mode}`);
    case "num": {
      if (s.lrecl !== 80) return { ...none, message: error("NUMBER SUPPORTED FOR LRECL 80 ONLY") };
      const r = setProfile(s, { number: cmd.on }, `NUMBER ${onOff(cmd.on)}`);
      const session = cmd.on ? { ...renumber(r.session), dirty: true } : r.session;
      return { ...r, session, events: cmd.on ? [...r.events, { type: "EDITOR_TEXT_CHANGED", count: session.lines.length }] : r.events };
    }
    case "unnum": {
      const r = setProfile(s, { number: false }, "SEQUENCE NUMBERS REMOVED");
      return { ...r, session: { ...unnumber(r.session), dirty: true }, events: [...r.events, { type: "EDITOR_TEXT_CHANGED", count: s.lines.length }] };
    }
    case "bounds": {
      if (cmd.show) return { session: addSpecial(s, "BNDS", s.lines[s.top]?.id ?? null), events: [{ type: "EDITOR_BOUNDS" }] };
      const left = cmd.left ?? 1;
      const right = cmd.right ?? 0;
      if (left < 1 || left > s.lrecl || (right !== 0 && (right < left || right > s.lrecl))) return { ...none, message: error("INVALID BOUNDS") };
      const r = setProfile(s, { bounds: { left, right } }, `BOUNDS ${left} ${right || s.lrecl}`);
      return { ...r, events: [...r.events, { type: "EDITOR_BOUNDS" }] };
    }
    case "cols":
      return { session: addSpecial(s, "COLS", null), events: [{ type: "EDITOR_COLS" }] };
    case "profile":
      return { session: addSpecial(s, "PROF", null), events: [] };
    case "find":
      return find(s, cmd.text, cmd.direction, false);
    case "rfind":
      if (!s.lastFind) return { ...none, message: error("NO PREVIOUS FIND") };
      return find(s, s.lastFind.text, s.lastFind.direction === "FIRST" || s.lastFind.direction === "ALL" ? "NEXT" : s.lastFind.direction, true);
    case "exclude":
      return exclude(s, cmd.text, cmd.all);
    case "change":
      return change(s, cmd.from, cmd.to, cmd.all, cmd.direction);
    case "rchange":
      if (!s.lastChange) return { ...none, message: error("NO PREVIOUS CHANGE") };
      return change(s, s.lastChange.from, s.lastChange.to, false, "NEXT");
    default:
      return none;
  }
}

const onOff = (b: boolean) => (b ? "ON" : "OFF");

function setProfile(s: EditorSession, patch: Partial<EditProfile>, msg: string): EditorResult {
  const profile = { ...s.profile, ...patch };
  return { session: { ...s, profile, profileDirty: true }, events: [{ type: "EDITOR_PROFILE_CHANGED", detail: Object.keys(patch).join(",") }], message: info(msg) };
}

/** RESET [ALL|EXCLUDED|SPECIAL|COMMAND|LABEL] per ISPF Edit "RESET — Reset the Data Display". */
function reset(s: EditorSession, what: "ALL" | "EXCLUDED" | "SPECIAL" | "COMMAND" | "LABEL"): EditorResult {
  let session = s;
  const events: EditorResult["events"] = [];
  if (what === "ALL" || what === "EXCLUDED") {
    const n = s.lines.filter((l) => l.excluded).length;
    session = { ...session, lines: session.lines.map((l) => (l.excluded ? { ...l, excluded: false } : l)) };
    if (n) events.push({ type: "EDITOR_LINES_REDISPLAYED", count: n });
  }
  if (what === "ALL" || what === "SPECIAL") session = clearSpecial(session);
  if (what === "ALL" || what === "COMMAND") session = { ...session, pending: [] };
  // LABEL: labels are not implemented; accepted for fidelity.
  return { session, events };
}

function scrollTo(s: EditorSession, top: number): EditorResult {
  const t = clampTop(s, top);
  const ev: EditorEvent[] = t !== s.top ? [{ type: "EDITOR_SCROLLED" }] : [];
  return { session: { ...s, top: t }, events: ev };
}

function amountLines(s: EditorSession, amount?: ScrollAmount): number {
  const a = amount ?? defaultAmount(s);
  switch (a.kind) {
    case "page":
    case "csr":
    case "data":
      return s.pageSize;
    case "half":
      return Math.max(1, Math.floor(s.pageSize / 2));
    case "max":
      return Number.MAX_SAFE_INTEGER;
    case "lines":
      return a.n;
  }
}

function defaultAmount(s: EditorSession): ScrollAmount {
  const u = s.scrollAmount.toUpperCase();
  if (u === "HALF") return { kind: "half" };
  if (u === "MAX") return { kind: "max" };
  if (/^\d+$/.test(u)) return { kind: "lines", n: parseInt(u, 10) };
  return { kind: "page" };
}

function scroll(s: EditorSession, direction: "UP" | "DOWN" | "LEFT" | "RIGHT", amount?: ScrollAmount): EditorResult {
  const n = amountLines(s, amount);
  if (direction === "UP") {
    if (s.top === 0) return { session: s, events: [], message: info("*** TOP OF DATA ***") };
    return scrollTo(s, n === Number.MAX_SAFE_INTEGER ? 0 : s.top - n);
  }
  if (direction === "DOWN") {
    const maxTop = Math.max(0, s.lines.length - s.pageSize);
    if (s.top >= maxTop) return { session: s, events: [], message: info("*** BOTTOM OF DATA ***") };
    return scrollTo(s, n === Number.MAX_SAFE_INTEGER ? maxTop : Math.min(maxTop, s.top + n));
  }
  const cols = amount?.kind === "lines" ? amount.n : amount?.kind === "half" ? Math.floor(s.pageCols / 2) : s.pageCols;
  const maxLeft = Math.max(0, s.lrecl - s.pageCols);
  const leftCol =
    direction === "LEFT"
      ? amount?.kind === "max" ? 0 : Math.max(0, s.leftCol - cols)
      : amount?.kind === "max" ? maxLeft : Math.min(maxLeft, s.leftCol + cols);
  if (leftCol === s.leftCol) return { session: s, events: [], message: info(direction === "LEFT" ? "*** LEFT EDGE ***" : "*** RIGHT EDGE ***") };
  return { session: { ...s, leftCol }, events: [{ type: "EDITOR_SCROLLED" }] };
}

interface Hit {
  index: number;
  col: number;
}

/** Search honours the edit BOUNDS: only columns inside the window are examined (ISPF "BOUNDS"). */
function searchFrom(s: EditorSession, text: string, direction: FindDirection, startIndex: number, startCol: number): Hit | null {
  const needle = text.toUpperCase();
  const { start, end } = boundsWindow(s.profile, s.lrecl);
  const hay = (i: number) => {
    const t = s.lines[i].text.toUpperCase();
    return " ".repeat(start) + t.slice(start, end);
  };
  if (direction === "FIRST" || direction === "ALL") {
    for (let i = 0; i < s.lines.length; i++) {
      const c = hay(i).indexOf(needle);
      if (c >= 0) return { index: i, col: c };
    }
    return null;
  }
  if (direction === "LAST") {
    for (let i = s.lines.length - 1; i >= 0; i--) {
      const c = hay(i).lastIndexOf(needle);
      if (c >= 0) return { index: i, col: c };
    }
    return null;
  }
  if (direction === "PREV") {
    for (let i = startIndex; i >= 0; i--) {
      const c = i === startIndex ? (startCol > 0 ? hay(i).lastIndexOf(needle, startCol - 1) : -1) : hay(i).lastIndexOf(needle);
      if (c >= 0) return { index: i, col: c };
    }
    return null;
  }
  for (let i = startIndex; i < s.lines.length; i++) {
    const c = hay(i).indexOf(needle, i === startIndex ? startCol : 0);
    if (c >= 0) return { index: i, col: c };
  }
  return null;
}

function cursorIndex(s: EditorSession): number {
  const i = s.lines.findIndex((l) => l.id === s.cursor.lineId);
  return i < 0 ? s.top : i;
}

function countAll(s: EditorSession, text: string): number {
  const needle = text.toUpperCase();
  if (!needle) return 0;
  return s.lines.reduce((n, l) => n + (l.text.toUpperCase().split(needle).length - 1), 0);
}

function visibleTop(s: EditorSession, index: number): number {
  return index < s.top || index >= s.top + s.pageSize ? index : s.top;
}

function find(s: EditorSession, text: string, direction: FindDirection, repeat: boolean): EditorResult {
  const start = cursorIndex(s);
  const startCol = repeat || direction === "NEXT" ? s.cursor.col + (s.lastFind ? 1 : 0) : 0;
  const hit = searchFrom(s, text, direction, start, startCol);
  const lastFind = { text, direction };
  const events: EditorEvent[] = [{ type: "EDITOR_FIND", detail: text }];
  if (!hit) {
    const anywhere = searchFrom(s, text, "FIRST", 0, 0);
    const message = anywhere ? info("*BOTTOM OF DATA REACHED*") : error(`NO CHARS ${q(text)} FOUND`);
    return { session: { ...s, lastFind }, events, message };
  }
  const line = s.lines[hit.index];
  const message = direction === "ALL" ? info(`${countAll(s, text)} CHARS ${q(text)} FOUND`) : info(`CHARS ${q(text)} FOUND`);
  const lines = s.lines.map((l, i) => (i === hit.index && l.excluded ? { ...l, excluded: false } : l));
  return {
    session: { ...s, lastFind, lines, cursor: { lineId: line.id, col: hit.col }, top: visibleTop(s, hit.index) },
    events,
    message,
  };
}

function exclude(s: EditorSession, text: string, all: boolean): EditorResult {
  const needle = text.toUpperCase();
  const { start, end } = boundsWindow(s.profile, s.lrecl);
  let n = 0;
  const lines = s.lines.map((l) => {
    if (l.excluded || !l.text.toUpperCase().slice(start, end).includes(needle) || (!all && n > 0)) return l;
    n++;
    return { ...l, excluded: true };
  });
  if (n === 0) return { session: s, events: [], message: error(`NO CHARS ${q(text)} FOUND`) };
  return { session: { ...s, lines }, events: [{ type: "EDITOR_LINES_EXCLUDED", count: n }], message: info(`${n} LINE(S) EXCLUDED`) };
}

function fit(s: EditorSession, text: string): string {
  return text.padEnd(s.lrecl).slice(0, s.lrecl);
}

function escapeRegExp(t: string): string {
  return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function change(s: EditorSession, from: string, to: string, all: boolean, direction: FindDirection): EditorResult {
  const lastChange = { from, to };
  const events: EditorEvent[] = [{ type: "EDITOR_CHANGE", detail: `${from}>${to}` }];
  if (all) {
    let n = 0;
    const re = new RegExp(escapeRegExp(from), "gi");
    const { start, end } = boundsWindow(s.profile, s.lrecl);
    const lines = s.lines.map((l) => {
      const inside = l.text.slice(start, end).replace(re, () => {
        n++;
        return to;
      });
      const replaced = l.text.slice(0, start) + inside + l.text.slice(end);
      return replaced === l.text ? l : { ...l, text: fit(s, replaced) };
    });
    if (n === 0) return { session: { ...s, lastChange }, events, message: error(`NO CHARS ${q(from)} FOUND`) };
    return {
      session: { ...s, lines, lastChange, dirty: true },
      events: [...events, { type: "EDITOR_TEXT_CHANGED", count: n }],
      message: info(`${n} CHARS ${q(from)} CHANGED TO ${q(to)}`),
    };
  }
  const start = cursorIndex(s);
  const hit = searchFrom(s, from, direction === "FIRST" ? "FIRST" : "NEXT", start, direction === "FIRST" ? 0 : s.cursor.col);
  if (!hit) return { session: { ...s, lastChange }, events, message: error(`NO CHARS ${q(from)} FOUND`) };
  const line = s.lines[hit.index];
  const newText = fit(s, line.text.slice(0, hit.col) + to + line.text.slice(hit.col + from.length));
  const lines = s.lines.map((l, i) => (i === hit.index ? { ...l, text: newText, excluded: false } : l));
  return {
    session: { ...s, lines, lastChange, dirty: true, top: visibleTop(s, hit.index), cursor: { lineId: line.id, col: hit.col + to.length } },
    events: [...events, { type: "EDITOR_TEXT_CHANGED", count: 1 }],
    message: info(`CHARS ${q(from)} CHANGED TO ${q(to)}`),
  };
}
