"use client";
/**
 * Landing hero: a self-typing 80x24 terminal driven by the real screen engine
 * (createInitialState + reduce + render), so what visitors see is exactly the simulator.
 * Pressing Enter or clicking it opens the lab. Reference: docs/06-design-direction.md §Landing.
 */
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createInitialState } from "@/engine/initialState";
import { reduce, render } from "@/engine/reducer";
import type { Fields, SimulatorState } from "@/engine/types";

type Step = { type: "type"; field: string; text: string } | { type: "enter"; fields?: Fields } | { type: "pause"; ms: number } | { type: "focus"; field: string };

const SCRIPT: Step[] = [
  { type: "pause", ms: 900 },
  { type: "enter", fields: { userid: "USER01" } },
  { type: "pause", ms: 1100 },
  { type: "type", field: "option", text: "3.4" },
  { type: "enter" },
  { type: "pause", ms: 900 },
  { type: "enter", fields: { level: "USER01" } },
  { type: "pause", ms: 1200 },
  { type: "focus", field: "cmd:USER01.JCL" },
  { type: "type", field: "cmd:USER01.JCL", text: "E" },
  { type: "enter" },
  { type: "pause", ms: 1000 },
  { type: "focus", field: "cmd:HELLO" },
  { type: "type", field: "cmd:HELLO", text: "E" },
  { type: "enter" },
  { type: "pause", ms: 1400 },
  { type: "focus", field: "prefix:3" },
  { type: "type", field: "prefix:3", text: "R" },
  { type: "enter" },
  { type: "pause", ms: 1200 },
  { type: "type", field: "command", text: "CHANGE IEFBR14 IEBGENER ALL" },
  { type: "enter" },
  { type: "pause", ms: 1600 },
  { type: "type", field: "command", text: "CANCEL" },
  { type: "enter" },
  { type: "pause", ms: 1200 },
  { type: "enter", fields: { command: "" } },
];

const TYPE_MS = 90;

interface Frame {
  state: SimulatorState;
  typed: Fields;
  focus?: string;
}

function initial(): Frame {
  return { state: createInitialState("USER01", "2026/01/01"), typed: { userid: "USER01" }, focus: "userid" };
}

export function HeroTerminal({ interactive = true }: { interactive?: boolean }) {
  const router = useRouter();
  const [frame, setFrame] = useState<Frame>(initial);
  const [reduced, setReduced] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const [fontPx, setFontPx] = useState(13);

  // 80 columns must fit the container: IBM Plex Mono advance width is 0.6em.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () => setFontPx(Math.max(5, Math.min(14, (el.clientWidth - 40) / 48.4)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let current = initial();
    const schedule = (fn: () => void, ms: number) => {
      timer = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };
    const run = (i: number) => {
      if (cancelled) return;
      if (i >= SCRIPT.length) {
        current = initial();
        setFrame(current);
        schedule(() => run(0), 1500);
        return;
      }
      const step = SCRIPT[i];
      switch (step.type) {
        case "pause":
          schedule(() => run(i + 1), step.ms);
          return;
        case "focus":
          current = { ...current, focus: step.field };
          setFrame(current);
          schedule(() => run(i + 1), 200);
          return;
        case "type": {
          let k = 0;
          const tick = () => {
            if (cancelled) return;
            k++;
            current = { ...current, typed: { ...current.typed, [step.field]: step.text.slice(0, k) }, focus: step.field };
            setFrame(current);
            if (k < step.text.length) schedule(tick, TYPE_MS);
            else schedule(() => run(i + 1), 350);
          };
          tick();
          return;
        }
        case "enter": {
          const fields = { ...current.typed, ...(step.fields ?? {}) };
          const r = reduce(current.state, { type: "ENTER", fields });
          current = { state: r.state, typed: {}, focus: undefined };
          setFrame(current);
          schedule(() => run(i + 1), 300);
          return;
        }
      }
    };
    schedule(() => run(0), 400);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reduced]);

  const screen = useMemo(() => render(frame.state), [frame.state]);
  const open = () => router.push("/lab");

  return (
    <div
      ref={wrap}
      style={{ "--term-font-size": `${fontPx.toFixed(2)}px` } as React.CSSProperties}
      className={`hero-terminal${interactive ? " hero-terminal--interactive" : ""}`}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : -1}
      onClick={interactive ? open : undefined}
      onKeyDown={interactive ? (e) => e.key === "Enter" && open() : undefined}
      aria-label="Live ISPF demo. Press Enter or click to open the lab."
    >
      <div className="terminal hero-terminal__screen">
        {screen.rows.slice(0, 23).map((row, i) => (
          <div className="trow" key={i}>
            {row.map((seg, j) =>
              seg.kind === "text" ? (
                <span key={j} className={`tseg tseg--${seg.color ?? "white"}${seg.bold ? " tseg--bold" : ""}`}>
                  {seg.text}
                </span>
              ) : (
                <span key={seg.id} className={`hero-field${frame.focus === seg.id ? " hero-field--focus" : ""}`} style={{ width: `${seg.width}ch` }}>
                  {(frame.typed[seg.id] ?? seg.value).slice(0, seg.width)}
                  {frame.focus === seg.id && <span className="hero-cursor" aria-hidden="true" />}
                </span>
              ),
            )}
          </div>
        ))}
        <div className="trow trow--pf">{screen.pfKeys.map((k) => `F${k.key}=${k.label}`).join("  ")}</div>
      </div>
      {interactive && <div className="hero-terminal__cta mono">Press Enter or click to start</div>}
    </div>
  );
}
