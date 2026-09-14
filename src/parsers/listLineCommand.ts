/**
 * Line commands typed in the leftmost column of DSLIST and member-list panels.
 * Reference: docs/03-ispf-behaviour-reference.md §DSLIST line commands, §Member list line commands.
 * IBM z/OS ISPF User's Guide Vol II, "Data Set List Utility (option 3.4)" and "Member list commands".
 */
export const DSLIST_LINE_COMMANDS = ["E", "B", "V", "M", "D", "R", "I", "S", "CO", "MO", "X", "NX", "Z", "="] as const;
export const MEMBER_LINE_COMMANDS = ["E", "B", "V", "D", "R", "C", "M", "S", "I", "G", "J", "="] as const;

export type DslistLineCommand = (typeof DSLIST_LINE_COMMANDS)[number];
export type MemberLineCommand = (typeof MEMBER_LINE_COMMANDS)[number];

export type ListLineParse<T extends string> = { ok: true; cmd: T } | { ok: false; error: string } | null;

function parse<T extends string>(raw: string, allowed: readonly T[]): ListLineParse<T> {
  const s = raw.trim().toUpperCase();
  if (!s) return null;
  if ((allowed as readonly string[]).includes(s)) return { ok: true, cmd: s as T };
  return { ok: false, error: "INVALID LINE COMMAND" };
}

export const parseDslistLineCommand = (raw: string) => parse(raw, DSLIST_LINE_COMMANDS);
export const parseMemberLineCommand = (raw: string) => parse(raw, MEMBER_LINE_COMMANDS);
