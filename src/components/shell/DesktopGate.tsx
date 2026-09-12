"use client";
/**
 * The simulator needs a keyboard and an 80-column display. Small / touch-only
 * viewports get a terminal-styled notice instead; nothing from the simulator mounts.
 * Reference: docs/06-design-direction.md §Mobile gate, ADR 0007.
 */
import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";

const MIN_WIDTH = 1024;

function subscribe(cb: () => void) {
  window.addEventListener("resize", cb);
  const mq = window.matchMedia("(pointer: fine)");
  mq.addEventListener("change", cb);
  return () => {
    window.removeEventListener("resize", cb);
    mq.removeEventListener("change", cb);
  };
}

function snapshot(): "capable" | "small" {
  const wide = window.innerWidth >= MIN_WIDTH;
  const fine = window.matchMedia("(pointer: fine)").matches;
  return wide && fine ? "capable" : "small";
}

/** SSR renders "unknown" so the first client paint matches; the check runs after hydration. */
export function useIsSimulatorCapable(): "capable" | "small" | "unknown" {
  return useSyncExternalStore(subscribe, snapshot, () => "unknown");
}

export function DesktopRequiredNotice() {
  return (
    <div className="gate">
      <pre className="gate__panel mono" aria-label="Terminal too small">
{`------------------  ISPF LAB  ------------------
              TERMINAL TOO SMALL

 The ISPF emulator needs a physical keyboard
 and an 80-column display. Please open this
 page on a desktop or laptop to try it.

 What works here:
   /            the introduction to ISPF
   /resources   the reference guides

------------------------------------------------`}
      </pre>
      <div className="gate__actions">
        <button type="button" className="crt-button" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
          Copy link for later
        </button>
        <Link href="/" className="crt-button crt-button--ghost">
          Back to introduction
        </Link>
        <Link href="/resources" className="crt-button crt-button--ghost">
          Resources
        </Link>
      </div>
      <p className="mono text-xs text-crt-dim">Educational ISPF training simulator. Not affiliated with or endorsed by IBM.</p>
    </div>
  );
}

export function DesktopGate({ children }: { children: ReactNode }) {
  const capable = useIsSimulatorCapable();
  if (capable === "unknown") return <div className="gate gate--pending" aria-busy="true" />;
  if (capable === "small") return <DesktopRequiredNotice />;
  return <>{children}</>;
}
