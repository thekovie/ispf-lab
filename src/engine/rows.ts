/**
 * Small helpers for composing 80-column terminal rows.
 */
import type { Color, Row, Segment } from "./types";

export const COLS = 80;

export const t = (text: string, color: Color = "white", bold = false): Segment => ({ kind: "text", text, color, bold });
export const label = (text: string): Segment => t(text, "cyan");
export const heading = (text: string): Segment => t(text, "white", true);
export const dim = (text: string): Segment => t(text, "dim");
export const f = (id: string, width: number, value = "", extra: Partial<Segment & { kind: "field" }> = {}): Segment => ({
  kind: "field",
  id,
  width,
  value,
  color: "green",
  ...extra,
});
export const blank: Row = [t("")];

/** Title row: centred title with a right-aligned short message slot. */
export function titleRow(title: string, message?: string, messageColor: Color = "yellow"): Row {
  const msg = message ?? "";
  const left = Math.max(1, Math.floor((COLS - title.length) / 2));
  const titleText = " ".repeat(left) + title;
  const pad = Math.max(1, COLS - titleText.length - msg.length);
  return [heading(titleText), t(" ".repeat(pad)), t(msg, messageColor, true)];
}

export function menuRow(option: string, name: string, description: string): Row {
  return [t(" "), t(option.padStart(2), "white", true), t("  "), label(name.padEnd(12)), t(description, "white")];
}

export function rule(ch = "-"): Row {
  return [dim(ch.repeat(COLS))];
}

export function padRow(text: string, color: Color = "white"): Row {
  return [t(text.slice(0, COLS).padEnd(COLS), color)];
}

export function commandRow(id: string, value: string, promptText = "Command ===>", width = 60): Row {
  return [label(promptText + " "), f(id, width, value)];
}

export function optionRow(id: string, value: string, width = 60): Row {
  return commandRow(id, value, "Option ===>", width);
}
