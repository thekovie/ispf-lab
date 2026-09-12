/**
 * Parser for the editor `Command ===>` line.
 * Reference: docs/04-editor-commands.md §Primary commands; z/OS ISPF Edit and Edit Macros, "Edit primary commands".
 */
export type ScrollAmount = { kind: "page" } | { kind: "half" } | { kind: "max" } | { kind: "csr" } | { kind: "data" } | { kind: "lines"; n: number };

export type FindDirection = "NEXT" | "PREV" | "FIRST" | "LAST" | "ALL";

export type EditorPrimaryCommand =
  | { kind: "empty" }
  | { kind: "save" }
  | { kind: "cancel" }
  | { kind: "end" }
  | { kind: "find"; text: string; direction: FindDirection }
  | { kind: "rfind" }
  | { kind: "change"; from: string; to: string; all: boolean; direction: FindDirection }
  | { kind: "rchange" }
  | { kind: "exclude"; text: string; all: boolean }
  | { kind: "reset" }
  | { kind: "locate"; line: number }
  | { kind: "top" }
  | { kind: "bottom" }
  | { kind: "scroll"; direction: "UP" | "DOWN" | "LEFT" | "RIGHT"; amount?: ScrollAmount }
  | { kind: "caps"; on: boolean }
  | { kind: "num"; on: boolean }
  | { kind: "hex"; on: boolean }
  | { kind: "cols" }
  | { kind: "create"; member: string; replace: boolean }
  | { kind: "copy"; member: string }
  | { kind: "profile" }
  | { kind: "explain"; term: string }
  | { kind: "invalid"; raw: string; error: string };

const DQ = '"';
const SQ = "'";

/** Tokenize honouring quoted strings ("a b" or 'a b'). */
export function tokenize(input: string): string[] {
  const out: string[] = [];
  let i = 0;
  const s = input.trim();
  while (i < s.length) {
    const ch = s[i];
    if (ch === " ") {
      i++;
      continue;
    }
    if (ch === DQ || ch === SQ) {
      const end = s.indexOf(ch, i + 1);
      if (end === -1) {
        out.push(s.slice(i + 1));
        break;
      }
      out.push(s.slice(i + 1, end));
      i = end + 1;
      continue;
    }
    let j = i;
    while (j < s.length && s[j] !== " ") j++;
    out.push(s.slice(i, j));
    i = j;
  }
  return out;
}

/** Strip surrounding TSO-style single quotes. */
export function unquote(t: string): string {
  let s = t;
  if (s.startsWith(SQ)) s = s.slice(1);
  if (s.endsWith(SQ)) s = s.slice(0, -1);
  return s;
}

export function parseScrollAmount(tok: string | undefined): ScrollAmount | undefined {
  if (!tok) return undefined;
  const u = tok.toUpperCase();
  if (u === "PAGE" || u === "P") return { kind: "page" };
  if (u === "HALF" || u === "H") return { kind: "half" };
  if (u === "MAX" || u === "M") return { kind: "max" };
  if (u === "CSR" || u === "C") return { kind: "csr" };
  if (u === "DATA" || u === "D") return { kind: "data" };
  if (/^\d+$/.test(u)) return { kind: "lines", n: parseInt(u, 10) };
  return undefined;
}

const DIRECTIONS: Record<string, FindDirection> = { NEXT: "NEXT", PREV: "PREV", FIRST: "FIRST", LAST: "LAST", ALL: "ALL" };

export function pullDirection(tokens: string[]): { direction: FindDirection; rest: string[] } {
  let direction: FindDirection = "NEXT";
  const rest: string[] = [];
  for (const t of tokens) {
    const d = DIRECTIONS[t.toUpperCase()];
    if (d && rest.length > 0) direction = d;
    else rest.push(t);
  }
  return { direction, rest };
}

export function parseEditorPrimaryCommand(raw: string): EditorPrimaryCommand {
  const s = raw.trim();
  if (!s) return { kind: "empty" };
  const tokens = tokenize(s);
  const verb = tokens[0].toUpperCase();
  const args = tokens.slice(1);
  const invalid = (error: string): EditorPrimaryCommand => ({ kind: "invalid", raw: s, error });

  switch (verb) {
    case "SAVE":
      return { kind: "save" };
    case "CANCEL":
    case "CAN":
      return { kind: "cancel" };
    case "END":
      return { kind: "end" };
    case "RFIND":
      return { kind: "rfind" };
    case "RCHANGE":
      return { kind: "rchange" };
    case "RESET":
    case "RES":
      return { kind: "reset" };
    case "TOP":
      return { kind: "top" };
    case "BOTTOM":
    case "BOT":
      return { kind: "bottom" };
    case "COLS":
      return { kind: "cols" };
    case "PROFILE":
    case "PROF":
      return { kind: "profile" };
    case "FIND":
    case "F": {
      if (args.length === 0) return invalid("PUT STRING TO FIND ON COMMAND LINE");
      const { direction, rest } = pullDirection(args);
      return { kind: "find", text: rest.join(" "), direction };
    }
    case "CHANGE":
    case "CHG":
    case "C": {
      const all = args.some((a) => a.toUpperCase() === "ALL");
      const { direction, rest } = pullDirection(args.filter((a) => a.toUpperCase() !== "ALL"));
      if (rest.length < 2) return invalid("PUT STRINGS TO CHANGE ON COMMAND LINE");
      return { kind: "change", from: rest[0], to: rest[1], all, direction };
    }
    case "EXCLUDE":
    case "EXC":
    case "X": {
      if (args.length === 0) return invalid("PUT STRING TO EXCLUDE ON COMMAND LINE");
      const all = args.some((a) => a.toUpperCase() === "ALL");
      const rest = args.filter((a) => a.toUpperCase() !== "ALL");
      return { kind: "exclude", text: rest.join(" "), all };
    }
    case "LOCATE":
    case "LOC":
    case "L": {
      if (!/^\d+$/.test(args[0] ?? "")) return invalid("INVALID LINE NUMBER");
      return { kind: "locate", line: parseInt(args[0], 10) };
    }
    case "UP":
    case "DOWN":
    case "LEFT":
    case "RIGHT": {
      const amount = parseScrollAmount(args[0]);
      if (args[0] && !amount) return invalid("INVALID SCROLL AMOUNT");
      return { kind: "scroll", direction: verb, amount };
    }
    case "CAPS":
    case "NUM":
    case "HEX": {
      const on = (args[0] ?? "ON").toUpperCase();
      if (on !== "ON" && on !== "OFF") return invalid("INVALID KEYWORD");
      const kind = verb.toLowerCase() as "caps" | "num" | "hex";
      return { kind, on: on === "ON" };
    }
    case "CREATE":
    case "CRE":
    case "REPLACE":
    case "REP": {
      if (!args[0]) return invalid("MEMBER NAME REQUIRED");
      return { kind: "create", member: args[0].toUpperCase(), replace: verb.startsWith("REP") };
    }
    case "COPY": {
      if (!args[0]) return invalid("MEMBER NAME REQUIRED");
      return { kind: "copy", member: args[0].toUpperCase() };
    }
    case "EXPLAIN":
      return { kind: "explain", term: args.join(" ") };
    default:
      return invalid("COMMAND NOT RECOGNIZED");
  }
}
