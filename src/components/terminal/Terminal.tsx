"use client";
/**
 * Terminal renderer: turns a RenderedScreen into 24 rows of text and fields,
 * keeps typed drafts locally until Enter / a PF key submits them (ISPF semantics),
 * and owns keyboard handling (Enter, Tab, F-keys, Insert).
 * Reference: docs/02-architecture.md §Terminal renderer, docs/06-design-direction.md.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Fields, Row } from "@/engine/types";
import { useSimulator } from "@/state/SimulatorProvider";
import { FieldInput } from "./FieldInput";
import { PfKeyStrip } from "./PfKeyStrip";
import { StatusLine } from "./StatusLine";
import "./terminal.css";

const ROWS = 24;
const F_KEYS: Record<string, number> = { F1: 1, F2: 2, F3: 3, F4: 4, F5: 5, F6: 6, F7: 7, F8: 8, F9: 9, F10: 10, F11: 11, F12: 12 };

interface TerminalProps {
  /** field id to visually hint (Learn mode) */
  highlightField?: string;
  compact?: boolean;
}

/** ISPF shows the PF key legend on one or two rows of the screen. */
function pfFooter(keys: { key: number; label: string }[]): string[] {
  const items = keys.map((k) => `F${k.key}=${k.label}`);
  const lines: string[] = [];
  let line = "";
  for (const it of items) {
    if ((line + "  " + it).trim().length > 80) {
      lines.push(line.trim());
      line = it;
    } else line = line ? line + "  " + it : it;
  }
  lines.push(line);
  return lines;
}

function initialDrafts(rows: Row[]): Fields {
  const out: Fields = {};
  for (const row of rows) for (const seg of row) if (seg.kind === "field") out[seg.id] = seg.value;
  return out;
}

export function Terminal({ highlightField, compact }: TerminalProps) {
  const sim = useSimulator();
  const { screen, state, version, store } = sim;
  const [drafts, setDrafts] = useState<Fields>(() => initialDrafts(screen.rows));
  const [insertMode, setInsertMode] = useState(state.settings.insertMode);
  const [cursor, setCursor] = useState<{ field: string | null; col: number }>({ field: null, col: 0 });
  const inputs = useRef(new Map<string, HTMLInputElement>());

  // New screen version → discard drafts (state derived during render, per React guidance).
  const [seenVersion, setSeenVersion] = useState(version);
  if (seenVersion !== version) {
    setSeenVersion(version);
    setDrafts(initialDrafts(screen.rows));
  }
  const [seenInsertDefault, setSeenInsertDefault] = useState(state.settings.insertMode);
  if (seenInsertDefault !== state.settings.insertMode) {
    setSeenInsertDefault(state.settings.insertMode);
    setInsertMode(state.settings.insertMode);
  }

  // Refocus the field the engine asked for after every screen change.
  useEffect(() => {
    const target = screen.focus && inputs.current.get(screen.focus) ? screen.focus : screen.fields[0];
    const el = target ? inputs.current.get(target) : undefined;
    if (el) {
      el.focus();
      const editorField = target?.startsWith("line:") || target?.startsWith("prefix:");
      const pos = editorField ? (target?.startsWith("line:") ? state.editor?.cursor.col ?? 0 : 0) : el.value.length;
      el.setSelectionRange(Math.min(pos, el.value.length), Math.min(pos, el.value.length));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const register = useCallback((id: string, el: HTMLInputElement | null) => {
    if (el) inputs.current.set(id, el);
    else inputs.current.delete(id);
  }, []);

  const onChange = useCallback((id: string, value: string) => {
    setDrafts((d) => (d[id] === value ? d : { ...d, [id]: value }));
  }, []);

  const onCursor = useCallback((id: string, col: number) => setCursor({ field: id, col }), []);

  const submitEnter = useCallback(() => store.enter(drafts), [store, drafts]);
  const submitPf = useCallback((key: number) => store.pf(key, drafts), [store, drafts]);

  const moveFocus = useCallback(
    (delta: number) => {
      const order = screen.fields.filter((id) => inputs.current.has(id));
      if (order.length === 0) return;
      const idx = order.indexOf(cursor.field ?? "");
      const next = order[(idx + delta + order.length) % order.length];
      const el = inputs.current.get(next);
      el?.focus();
      el?.setSelectionRange(0, 0);
      setCursor({ field: next, col: 0 });
    },
    [screen.fields, cursor.field],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitEnter();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        moveFocus(e.shiftKey ? -1 : 1);
        return;
      }
      if (e.key === "Insert") {
        e.preventDefault();
        setInsertMode((m) => !m);
        return;
      }
      const pf = F_KEYS[e.key];
      if (pf) {
        e.preventDefault();
        submitPf(pf);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        // move between editor record fields keeping the column
        const id = cursor.field;
        if (!id || !(id.startsWith("line:") || id.startsWith("prefix:"))) return;
        const same = screen.fields.filter((f) => f.startsWith(id.startsWith("line:") ? "line:" : "prefix:"));
        const i = same.indexOf(id);
        const next = same[i + (e.key === "ArrowDown" ? 1 : -1)];
        if (!next) return;
        e.preventDefault();
        const el = inputs.current.get(next);
        el?.focus();
        const col = Math.min(cursor.col, el?.value.length ?? 0);
        el?.setSelectionRange(col, col);
        setCursor({ field: next, col });
      }
    },
    [submitEnter, submitPf, moveFocus, cursor, screen.fields],
  );

  const position = useMemo(() => {
    let row = 1;
    let col = 1;
    screen.rows.forEach((r, ri) => {
      let c = 0;
      for (const seg of r) {
        if (seg.kind === "field" && seg.id === cursor.field) {
          row = ri + 1;
          col = c + cursor.col + 1;
        }
        c += seg.kind === "field" ? seg.width : seg.text.length;
      }
    });
    return { row, col };
  }, [screen.rows, cursor]);

  const footerLines = state.settings.pfKeysShown ? pfFooter(screen.pfKeys) : [""];
  const dataRows = ROWS - footerLines.length;
  const visibleRows = screen.rows.slice(0, dataRows);
  const padding = Math.max(0, dataRows - visibleRows.length);

  return (
    <div className={`terminal-frame${compact ? " terminal-frame--compact" : ""}`}>
      <div className="terminal" role="application" aria-label="ISPF terminal" onKeyDown={onKeyDown} tabIndex={-1}>
        {visibleRows.map((row, i) => (
          <div className="trow" key={i}>
            {row.map((seg, j) =>
              seg.kind === "text" ? (
                <span key={j} className={`tseg tseg--${seg.color ?? "white"}${seg.bold ? " tseg--bold" : ""}`}>
                  {seg.text}
                </span>
              ) : (
                <FieldInput
                  key={seg.id}
                  segment={seg}
                  value={drafts[seg.id] ?? seg.value}
                  insertMode={insertMode}
                  onChange={onChange}
                  onCursor={onCursor}
                  register={register}
                  highlighted={highlightField === seg.id}
                />
              ),
            )}
          </div>
        ))}
        {Array.from({ length: padding }, (_, i) => (
          <div className="trow" key={`pad-${i}`}>
            {" "}
          </div>
        ))}
        {footerLines.map((line, i) => (
          <div className="trow trow--pf" key={`pf-${i}`}>
            {line}
          </div>
        ))}
      </div>
      <StatusLine
        row={position.row}
        col={position.col}
        insertMode={insertMode}
        mode={state.editor ? state.editor.mode : screen.title}
        dirty={!!state.editor?.dirty}
        userid={state.userid}
        loggedIn={state.loggedIn}
      />
      <PfKeyStrip keys={screen.pfKeys} onPf={submitPf} insertMode={insertMode} onToggleInsert={() => setInsertMode((m) => !m)} onEnter={submitEnter} />
    </div>
  );
}
