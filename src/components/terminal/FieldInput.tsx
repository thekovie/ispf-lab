"use client";
/**
 * One ISPF input field: fixed width, monospace, overwrite typing by default
 * (Insert key toggles), automatic upper-casing except for editor records.
 */
import { useCallback, type KeyboardEvent, type ChangeEvent } from "react";
import type { Segment } from "@/engine/types";

type FieldSegment = Extract<Segment, { kind: "field" }>;

interface FieldInputProps {
  segment: FieldSegment;
  value: string;
  insertMode: boolean;
  onChange: (id: string, value: string) => void;
  onCursor: (id: string, col: number) => void;
  highlighted?: boolean;
  register: (id: string, el: HTMLInputElement | null) => void;
}

const isPrintable = (e: KeyboardEvent<HTMLInputElement>) => e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;

export function FieldInput({ segment, value, insertMode, onChange, onCursor, highlighted, register }: FieldInputProps) {
  const { id, width, password, noUpper, editorLine } = segment;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (insertMode || !isPrintable(e)) return;
      const el = e.currentTarget;
      const current = el.value; // DOM value: always current, even between React commits
      const start = el.selectionStart ?? current.length;
      const end = el.selectionEnd ?? start;
      if (start !== end) return; // a selection: let the browser replace it
      e.preventDefault();
      if (start >= width) return;
      const ch = noUpper ? e.key : e.key.toUpperCase();
      const padded = current.padEnd(start);
      const next = (padded.slice(0, start) + ch + padded.slice(start + 1)).slice(0, width);
      el.value = next;
      el.setSelectionRange(start + 1, start + 1);
      onChange(id, next);
      onCursor(id, start + 1);
    },
    [insertMode, width, noUpper, id, onChange, onCursor],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.slice(0, width);
      onChange(id, noUpper ? raw : raw.toUpperCase());
    },
    [id, width, noUpper, onChange],
  );

  return (
    <input
      ref={(el) => register(id, el)}
      data-field={id}
      className={`ispf-field${editorLine ? " ispf-field--record" : ""}${highlighted ? " ispf-field--hint" : ""}`}
      style={{ width: `${width}ch`, color: segment.color ? `var(--crt-${segment.color})` : undefined }}
      type={password ? "password" : "text"}
      value={value}
      maxLength={width}
      spellCheck={false}
      autoComplete="off"
      autoCapitalize="off"
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onSelect={(e) => onCursor(id, e.currentTarget.selectionStart ?? 0)}
      onFocus={(e) => onCursor(id, e.currentTarget.selectionStart ?? 0)}
      aria-label={id}
    />
  );
}
