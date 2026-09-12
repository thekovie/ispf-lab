/**
 * Parser for one cell of the editor prefix (line-command) area.
 * Reference: docs/04-editor-commands.md §Line commands; z/OS ISPF Edit and Edit Macros, "Line commands".
 */
export type SingleLineCmd = "I" | "D" | "R" | "C" | "M" | "A" | "B" | "X" | "S" | "F" | "L" | "COLS" | "TS" | "LC" | "UC" | "(" | ")" | "<" | ">";
export type BlockLineCmd = "DD" | "RR" | "CC" | "MM" | "XX" | "LCC" | "UCC" | "((" | "))" | "<<" | ">>";

export type EditorLineCommand =
  | { kind: "single"; cmd: SingleLineCmd; count: number }
  | { kind: "block"; cmd: BlockLineCmd };

export type EditorLineParse = { ok: true; command: EditorLineCommand } | { ok: false; error: string } | null;

const SINGLE_RE = /^(COLS|TS|LC|UC|I|D|R|C|M|A|B|X|S|F|L|\(|\)|<|>)(\d{0,4})$/;
const BLOCK_RE = /^(DD|RR|CC|MM|XX|LCC|UCC|\(\(|\)\)|<<|>>)$/;

export function parseEditorLineCommand(raw: string): EditorLineParse {
  const s = raw.trim().toUpperCase();
  if (!s) return null;
  const block = s.match(BLOCK_RE);
  if (block) return { ok: true, command: { kind: "block", cmd: block[1] as BlockLineCmd } };
  const single = s.match(SINGLE_RE);
  if (single) {
    const cmd = single[1] as SingleLineCmd;
    const count = single[2] ? parseInt(single[2], 10) : 1;
    if (count < 1) return { ok: false, error: "INVALID LINE COMMAND" };
    return { ok: true, command: { kind: "single", cmd, count } };
  }
  return { ok: false, error: "INVALID LINE COMMAND" };
}
