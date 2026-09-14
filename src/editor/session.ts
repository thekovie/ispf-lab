/**
 * Editor session lifecycle + helpers shared by line and primary commands.
 * Reference: docs/04-editor-commands.md §Session.
 */
import { DEFAULT_PAGE_COLS, DEFAULT_PAGE_SIZE, type EditorEvent, type EditorLine, type EditorMode, type EditorResult, type EditorSession } from "./types";
import { defaultProfile, profileNameFor, type EditProfile } from "./profile";

export interface OpenOptions {
  mode: EditorMode;
  dsn: string;
  member?: string;
  lrecl: number;
  readOnly: boolean;
  records: string[];
  isNew?: boolean;
  scrollAmount?: string;
  pageSize?: number;
  profile?: EditProfile;
}

export function openSession(o: OpenOptions): EditorSession {
  const lrecl = o.lrecl > 0 ? o.lrecl : 80;
  const texts = o.records.map((r) => r.padEnd(lrecl).slice(0, lrecl));
  const lines: EditorLine[] = texts.map((text, i) => ({ id: i + 1, text, excluded: false }));
  return {
    mode: o.mode,
    dsn: o.dsn,
    member: o.member,
    lrecl,
    readOnly: o.readOnly,
    isNew: o.isNew ?? false,
    lines,
    original: texts,
    nextId: lines.length + 1,
    pending: [],
    dirty: false,
    top: 0,
    leftCol: 0,
    pageSize: o.pageSize ?? DEFAULT_PAGE_SIZE,
    pageCols: DEFAULT_PAGE_COLS,
    profile: o.profile ?? defaultProfile(profileNameFor(o.dsn)),
    profileDirty: false,
    special: [],
    history: [],
    cursor: { lineId: lines[0]?.id ?? null, col: 0 },
    scrollAmount: o.scrollAmount ?? "PAGE",
  };
}

export function bufferRecords(s: EditorSession): string[] {
  return s.lines.map((l) => l.text);
}

export function isDirty(s: EditorSession): boolean {
  const cur = bufferRecords(s);
  if (cur.length !== s.original.length) return true;
  return cur.some((t, i) => t !== s.original[i]);
}

export function normalizeText(s: EditorSession, text: string): string {
  const t = s.profile.caps ? text.toUpperCase() : text;
  return t.padEnd(s.lrecl).slice(0, s.lrecl);
}

/** Apply typed-over record text (keyed by line id). Called before prefix commands, as ISPF does. */
export function applyTextEdits(s: EditorSession, edits: Record<number, string>): EditorResult {
  if (s.mode === "BROWSE") return { session: s, events: [] };
  let changed = 0;
  const lines = s.lines.map((l) => {
    const next = edits[l.id];
    if (next === undefined) return l;
    const norm = normalizeText(s, next);
    if (norm === l.text) return l;
    changed++;
    return { ...l, text: norm };
  });
  if (changed === 0) return { session: s, events: [] };
  const session = { ...s, lines, dirty: true };
  const events: EditorEvent[] = [{ type: "EDITOR_TEXT_CHANGED", count: changed }];
  return { session, events };
}

export function indexOfId(s: EditorSession, id: number): number {
  return s.lines.findIndex((l) => l.id === id);
}

export function clampTop(s: EditorSession, top: number): number {
  const max = Math.max(0, s.lines.length - 1);
  return Math.min(Math.max(0, top), max);
}

export function withMarkedDirty(s: EditorSession): EditorSession {
  return { ...s, dirty: isDirty(s) };
}

export function revertToOriginal(s: EditorSession): EditorSession {
  return {
    ...s,
    lines: s.original.map((text, i) => ({ id: i + 1, text, excluded: false })),
    nextId: s.original.length + 1,
    pending: [],
    dirty: false,
    history: [],
  };
}

/** SAVE boundary: the buffer becomes the original and earlier interactions are no longer undoable. */
export function commitSaved(s: EditorSession): EditorSession {
  return { ...s, original: bufferRecords(s), dirty: false, isNew: false, history: [] };
}

/**
 * NUMBER ON (educational subset): for 80-byte fixed records, columns 73-80 carry an 8-digit sequence
 * number (00000100, 00000200, ...). Real ISPF also supports COBOL numbers in 1-6 and STD numbering
 * for other record formats; those are out of scope and documented in docs/04.
 */
export function renumber(s: EditorSession): EditorSession {
  if (s.lrecl !== 80) return s;
  const lines = s.lines.map((l, i) => ({ ...l, text: l.text.slice(0, 72).padEnd(72) + String((i + 1) * 100).padStart(8, "0") }));
  return { ...s, lines };
}

export function unnumber(s: EditorSession): EditorSession {
  if (s.lrecl !== 80) return s;
  const lines = s.lines.map((l) => ({ ...l, text: l.text.slice(0, 72).padEnd(80) }));
  return { ...s, lines };
}
