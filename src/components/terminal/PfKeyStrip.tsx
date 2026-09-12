"use client";
/**
 * Clickable PF keys below the terminal. Clicking dispatches exactly the same
 * PF action as pressing the physical function key.
 */
import type { PfKeyDef } from "@/engine/types";

interface PfKeyStripProps {
  keys: PfKeyDef[];
  onPf: (key: number) => void;
  insertMode: boolean;
  onToggleInsert: () => void;
  onEnter: () => void;
}

const ALL_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function PfKeyStrip({ keys, onPf, insertMode, onToggleInsert, onEnter }: PfKeyStripProps) {
  const byKey = new Map(keys.map((k) => [k.key, k.label]));
  return (
    <div className="pf-strip" role="toolbar" aria-label="Program function keys">
      {ALL_KEYS.map((n) => {
        const label = byKey.get(n);
        return (
          <button
            key={n}
            type="button"
            className={`pf-key${label ? "" : " pf-key--inactive"}`}
            onClick={() => onPf(n)}
            title={label ? `PF${n} = ${label}` : `PF${n} is not active on this panel`}
          >
            <span className="pf-key__num">F{n}</span>
            <span className="pf-key__label">{label ?? " "}</span>
          </button>
        );
      })}
      <span className="pf-strip__spacer" />
      <button type="button" className={`pf-key pf-key--mode${insertMode ? " pf-key--on" : ""}`} onClick={onToggleInsert} title="Toggle insert/overwrite (Insert key)">
        <span className="pf-key__num">Ins</span>
        <span className="pf-key__label">{insertMode ? "INSERT" : "OVRWRT"}</span>
      </button>
      <button type="button" className="pf-key pf-key--enter" onClick={onEnter} title="Enter">
        <span className="pf-key__num">Enter</span>
        <span className="pf-key__label">⏎</span>
      </button>
    </div>
  );
}
