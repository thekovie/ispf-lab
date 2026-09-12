/**
 * ISPF editor session model (pure data, no DOM).
 * Reference: docs/04-editor-commands.md; z/OS ISPF Edit and Edit Macros.
 */
import type { FindDirection } from "@/parsers/editorPrimaryCommand";

export type EditorMode = "EDIT" | "BROWSE" | "VIEW";

export interface EditorLine {
  /** stable identity so line commands survive inserts/deletes */
  id: number;
  text: string;
  excluded: boolean;
  /** created by an I command and not yet typed on; pruned on the next Enter if still blank */
  inserted?: boolean;
}

/** A prefix-area command that could not be completed yet (single CC, C without A/B ...). */
export interface PendingCommand {
  lineId: number;
  raw: string;
}

export interface EditorCursor {
  lineId: number | null;
  col: number;
}

export interface EditorSession {
  mode: EditorMode;
  dsn: string;
  member?: string;
  lrecl: number;
  readOnly: boolean;
  /** true when the member did not exist when the editor was opened */
  isNew: boolean;
  lines: EditorLine[];
  /** snapshot for CANCEL and dirty tracking */
  original: string[];
  nextId: number;
  pending: PendingCommand[];
  dirty: boolean;
  /** index (into lines) of the first displayed line */
  top: number;
  /** 0-based first displayed data column */
  leftCol: number;
  /** number of data lines visible per page */
  pageSize: number;
  /** data columns visible per page */
  pageCols: number;
  caps: boolean;
  nums: boolean;
  hex: boolean;
  /** show the COLS ruler after this line id (null = hidden) */
  colsAfter: number | null;
  cursor: EditorCursor;
  lastFind?: { text: string; direction: FindDirection };
  lastChange?: { from: string; to: string };
  scrollAmount: string;
}

export interface EditorEvent {
  type:
    | "EDITOR_LINE_INSERTED"
    | "EDITOR_LINE_DELETED"
    | "EDITOR_LINE_REPEATED"
    | "EDITOR_LINES_COPIED"
    | "EDITOR_LINES_MOVED"
    | "EDITOR_LINES_EXCLUDED"
    | "EDITOR_TEXT_CHANGED"
    | "EDITOR_FIND"
    | "EDITOR_CHANGE"
    | "EDITOR_SCROLLED";
  count?: number;
  detail?: string;
}

export interface EditorMessage {
  text: string;
  severity: "info" | "error";
}

export interface EditorResult {
  session: EditorSession;
  events: EditorEvent[];
  message?: EditorMessage;
  /** side effects the screen engine must perform */
  effect?: { kind: "save" } | { kind: "cancel" } | { kind: "end" } | { kind: "explain"; term: string } | { kind: "create"; member: string; replace: boolean } | { kind: "copy"; member: string };
}

export const DEFAULT_PAGE_SIZE = 18;
export const DEFAULT_PAGE_COLS = 72;
