/**
 * Parser for the `Option ===>` / `Command ===>` line on menu panels.
 * Reference: docs/03-ispf-behaviour-reference.md §Primary Option Menu.
 */
export type OptionCommand =
  | { kind: "empty" }
  | { kind: "path"; path: string[]; jump: boolean }
  | { kind: "exit" }
  | { kind: "tso"; command: string }
  | { kind: "explain"; term: string }
  | { kind: "help" }
  | { kind: "invalid"; raw: string };

const ALIASES: Record<string, string[]> = {
  DSLIST: ["3", "4"],
  DSL: ["3", "4"],
  ISRDDN: ["3", "4"],
  SETTINGS: ["0"],
  UTIL: ["3"],
  UTILITIES: ["3"],
  S: ["S"],
  SD: ["S"],
  SDSF: ["S"],
  "M.5": ["S"],
};

export function parseOptionCommand(raw: string): OptionCommand {
  const s = raw.trim();
  if (!s) return { kind: "empty" };
  const upper = s.toUpperCase();
  if (upper === "X" || upper === "EXIT" || upper === "END" || upper === "LOGOFF") return { kind: "exit" };
  if (upper === "HELP" || upper === "?") return { kind: "help" };
  if (upper.startsWith("TSO ")) return { kind: "tso", command: s.slice(4).trim() };
  if (upper.startsWith("EXPLAIN ")) return { kind: "explain", term: s.slice(8).trim() };
  if (ALIASES[upper]) return { kind: "path", path: ALIASES[upper], jump: false };
  if (upper.startsWith("=") && ALIASES[upper.slice(1)]) return { kind: "path", path: ALIASES[upper.slice(1)], jump: true };
  const jump = upper.startsWith("=");
  const body = jump ? upper.slice(1) : upper;
  if (/^[0-9]+(\.[0-9]+)*$/.test(body)) return { kind: "path", path: body.split("."), jump };
  return { kind: "invalid", raw: s };
}
