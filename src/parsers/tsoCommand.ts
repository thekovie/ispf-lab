/**
 * Parser for the ISPF option 6 TSO command shell (a small, deterministic subset).
 * Reference: docs/03-ispf-behaviour-reference.md §Option 6.
 */
import { tokenize, unquote } from "./editorPrimaryCommand";

export type TsoCommand =
  | { kind: "empty" }
  | { kind: "listcat"; level: string }
  | { kind: "listds"; dsn: string; members: boolean }
  | { kind: "delete"; dsn: string }
  | { kind: "rename"; from: string; to: string }
  | { kind: "time" }
  | { kind: "help" }
  | { kind: "ispf" }
  | { kind: "submit"; dsn: string }
  | { kind: "invalid"; raw: string; error: string };

export function parseTsoCommand(raw: string): TsoCommand {
  const s = raw.trim();
  if (!s) return { kind: "empty" };
  const tokens = tokenize(s);
  const verb = tokens[0].toUpperCase();
  const args = tokens.slice(1);
  const strip = (t: string) => unquote(t).toUpperCase();
  switch (verb) {
    case "LISTCAT":
    case "LISTC": {
      const lvl = args.find((a) => /^(LEVEL|LVL)\(/i.test(a));
      const level = lvl ? lvl.replace(/^[A-Z]+\(/i, "").replace(/\)$/, "") : "";
      return { kind: "listcat", level: level.toUpperCase() };
    }
    case "LISTDS":
    case "LISTD": {
      if (!args[0]) return { kind: "invalid", raw: s, error: "DATA SET NAME REQUIRED" };
      return { kind: "listds", dsn: strip(args[0]), members: args.some((a) => a.toUpperCase() === "MEMBERS") };
    }
    case "DELETE":
    case "DEL": {
      if (!args[0]) return { kind: "invalid", raw: s, error: "DATA SET NAME REQUIRED" };
      return { kind: "delete", dsn: strip(args[0]) };
    }
    case "RENAME":
    case "REN": {
      if (args.length < 2) return { kind: "invalid", raw: s, error: "OLD AND NEW NAMES REQUIRED" };
      return { kind: "rename", from: strip(args[0]), to: strip(args[1]) };
    }
    case "TIME":
      return { kind: "time" };
    case "HELP":
    case "H":
      return { kind: "help" };
    case "ISPF":
    case "PDF":
      return { kind: "ispf" };
    case "SUBMIT":
    case "SUB":
      if (!args[0]) return { kind: "invalid", raw: s, error: "DATA SET NAME REQUIRED" };
      return { kind: "submit", dsn: strip(args[0]) };
    default:
      return { kind: "invalid", raw: s, error: `COMMAND ${verb} NOT FOUND` };
  }
}
