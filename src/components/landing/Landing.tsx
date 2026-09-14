"use client";
/**
 * Landing page: an educational introduction to ISPF laid out as ISPF panels.
 * Keyboard: type 1-4 (or Enter) to open the lab in that mode, like an Option line.
 * Reference: docs/06-design-direction.md §Landing page.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RESOURCES } from "@/content/resources";
import { GLOSSARY } from "@/tutorial/explain";
import { LESSONS, MODULES } from "@/tutorial/lessons";
import { useIsSimulatorCapable } from "@/components/shell/DesktopGate";
import { HeroTerminal } from "./HeroTerminal";
import "@/components/terminal/terminal.css";
import "./landing.css";

const MODES = [
  { n: "1", name: "Learn", desc: `${LESSONS.length} guided lessons in ${MODULES.length} modules. Every step is checked by the simulator, not by you.`, mode: "learn" },
  { n: "2", name: "Practice", desc: "Same objectives, no hand-holding. Hints on request.", mode: "practice" },
  { n: "3", name: "Challenge", desc: "Only the final result counts. Mistakes and hints lower the score.", mode: "challenge" },
  { n: "4", name: "Sandbox", desc: "The whole simulated ISPF, no lesson running. Allocate, edit, copy, delete.", mode: "sandbox" },
];

const NAMES = ["Option34", "PanelDrill", "GreenScreen Dojo", "PF3 Academy", "DSLIST Dojo", "TSO Trainer", "Sim3270"];
const TEASER = ["PDS", "member", "HLQ", "3.4", "PF3", "line command", "SPLIT"];

const KEYS: [string, string][] = [
  ["Enter", "process the panel"],
  ["Tab", "next field"],
  ["F1", "help"],
  ["F2", "split screen"],
  ["F3", "end / back"],
  ["F5", "repeat find"],
  ["F7 / F8", "scroll up / down"],
  ["F9", "swap screen"],
  ["F10 / F11", "scroll left / right"],
  ["F12", "cancel"],
];

function Section({ title, row, children }: { title: string; row: string; children: React.ReactNode }) {
  const id = title.replace(/\W+/g, "-").toLowerCase();
  return (
    <section className="lsec" aria-labelledby={id}>
      <div className="lsec__head">
        <h2 className="lsec__title" id={id}>
          {title}
        </h2>
        <span className="lsec__rule" />
        <span className="lsec__row">{row}</span>
      </div>
      {children}
    </section>
  );
}

export function Landing() {
  const router = useRouter();
  const capable = useIsSimulatorCapable();
  const [option, setOption] = useState("");
  const [msg, setMsg] = useState("");
  const isSmall = capable === "small";

  const go = (mode?: string) => {
    if (isSmall) {
      setMsg("TERMINAL TOO SMALL - the lab needs a desktop or laptop with a keyboard.");
      return;
    }
    router.push(mode ? `/lab?mode=${mode}` : "/lab");
  };

  const submit = (raw: string) => {
    const v = raw.trim().toUpperCase();
    if (!v) return go();
    const m = MODES.find((x) => x.n === v || x.name.toUpperCase() === v);
    if (m) return go(m.mode);
    if (v === "NAMES") return setMsg(`Also considered: ${NAMES.join(", ")}.`);
    if (v === "3.4" || v === "=3.4") return go("sandbox");
    if (v.startsWith("EXPLAIN")) return router.push(`/lab?explain=${encodeURIComponent(v.slice(7).trim() || "ISPF")}`);
    if (v === "X" || v === "END") return setMsg("You are already outside ISPF. Type 1 to go in.");
    setMsg("INVALID OPTION - type 1, 2, 3 or 4 (this is how ISPF answers, too).");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.getAttribute("role") === "button")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const m = MODES.find((x) => x.n === e.key);
      if (!m) return;
      if (isSmall) setMsg("TERMINAL TOO SMALL - the lab needs a desktop or laptop with a keyboard.");
      else router.push(`/lab?mode=${m.mode}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSmall, router]);

  return (
    <div className="landing">
      <nav className="landing__nav" aria-label="Site">
        <span className="panel-title">ISPF LAB</span>
        <span className="landing__nav-spacer" />
        <Link href="/lab">Lab</Link>
        <Link href="/lab/progress">Progress</Link>
        <Link href="/resources">Resources</Link>
      </nav>

      <header className="hero">
        <div>
          <div className="hero__panel-title" aria-hidden="true">
            <span>ISPF Primary Option Menu</span>
          </div>
          <h1 className="hero__title">
            Learn <em>ISPF</em> by typing, not by reading about it.
          </h1>
          <p className="hero__lead">
            ISPF Lab is a browser-based simulator of the IBM z/OS ISPF interface: the Primary Option Menu, option 3.4, member lists and the
            record-oriented editor with its line commands. A lesson engine watches what you actually do and moves you on when you get it
            right. Nothing leaves your browser.
          </p>
          <ul className="option-list">
            {MODES.map((m) => (
              <li key={m.n}>
                <a
                  href={`/lab?mode=${m.mode}`}
                  onClick={(e) => {
                    e.preventDefault();
                    go(m.mode);
                  }}
                >
                  <span className="option-list__num">{m.n}</span>
                  <span className="option-list__name">{m.name}</span>
                  <span className="option-list__desc">{m.desc}</span>
                </a>
              </li>
            ))}
          </ul>
          <form
            className="option-line"
            onSubmit={(e) => {
              e.preventDefault();
              submit(option);
            }}
          >
            <label className="option-line__label" htmlFor="landing-option">
              Option ===&gt;
            </label>
            <input id="landing-option" className="option-line__input" value={option} onChange={(e) => setOption(e.target.value)} autoComplete="off" spellCheck={false} />
            <span className="option-line__hint">type a number and press Enter</span>
          </form>
          <div className="option-line__msg" role="status">
            {msg}
          </div>
          {isSmall && (
            <div className="notice-inline">
              The simulator needs a keyboard and an 80-column screen: open this page on a desktop or laptop. The introduction below works everywhere.
            </div>
          )}
        </div>
        <HeroTerminal interactive={!isSmall} />
      </header>

      <Section title="What is ISPF?" row="Row 1 of 6">
        <div className="two-col">
          <div>
            <p>
              <strong>ISPF</strong> (Interactive System Productivity Facility) is the full-screen interface most people use to work on IBM
              <strong> z/OS</strong> mainframes. It runs on top of <strong>TSO</strong>, the command layer you log on to, and it presents
              everything as <strong>panels</strong>: a title, a short message area, an <code>Option ===&gt;</code> or <code>Command ===&gt;</code>{" "}
              line, a body of fields, and a legend of <strong>PF keys</strong>.
            </p>
            <p>
              The unusual part is the rhythm. A 3270 terminal is an overtype device: you fill in fields, type one-letter commands next to list
              entries or over line numbers, and <em>nothing happens until you press Enter</em>. Then the whole panel is processed at once. PF3
              ends the current panel and returns to the previous one. Errors appear as a short message in the top-right corner.
            </p>
          </div>
          <div>
            <p>
              Data lives in <strong>data sets</strong>, not files in folders. A <strong>partitioned data set</strong> (PDS, DSORG=PO) such as
              <code> USER01.JCL</code> holds named <strong>members</strong>: <code>USER01.JCL(HELLO)</code>. A <strong>sequential</strong> data
              set (PS) is one stream of records. Names are qualifiers separated by periods; the first one, the{" "}
              <strong>high-level qualifier</strong>, is usually your userid.
            </p>
            <p>
              ISPF Lab reproduces this interaction model faithfully enough that the muscle memory transfers: the same menus, the same 3.4, the
              same <code>I</code>, <code>D</code>, <code>R</code>, <code>C</code>/<code>A</code> line commands, the same SAVE and CANCEL, even{" "}
              <strong>split-screen mode</strong> (PF2 opens a second logical screen, PF9 swaps between them). It is a deterministic simulation
              with a virtual catalog - not a mainframe connection, and not an IBM product.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Anatomy of a panel" row="Row 2 of 6">
        <pre className="anatomy" aria-label="Annotated ISPF panel">
          {"  "}
          <span className="w">           ISPF Primary Option Menu</span>
          {"                    "}
          <span className="a">INVALID OPTION</span>
          {"  ◄ short message\n  "}
          <span className="c">Option ===&gt;</span> <span className="g">3.4_______________________________________</span>
          {"      ◄ command / option line\n\n   "}
          <span className="w">0</span>
          {"  "}
          <span className="c">Settings   </span>
          {" Terminal and user parameters                  ◄ protected text\n   "}
          <span className="w">3</span>
          {"  "}
          <span className="c">Utilities  </span>
          {" Perform utility functions                        (you cannot type here)\n   "}
          <span className="w">6</span>
          {"  "}
          <span className="c">Command    </span>
          {" Enter TSO or Workstation commands\n\n  "}
          <span className="c">Dsname Level . . . </span>
          <span className="g">USER01__________</span>
          {"                   ◄ unprotected field\n                                                                       (you type here)\n  "}
          <span className="d">F1=Help  F3=Exit  F7=Up  F8=Down</span>
          {"                             ◄ PF key legend"}
        </pre>
        <div className="keys" aria-label="Keys">
          {KEYS.map(([k, d]) => (
            <span className="key" key={k}>
              <b>{k}</b>
              {d}
            </span>
          ))}
        </div>
        <p>
          Browsers intercept some function keys, so the lab also shows a clickable PF-key strip under the terminal. Clicking a key performs
          exactly the same internal action as the keyboard.
        </p>
      </Section>

      <Section title="What you will learn" row="Row 3 of 6">
        <ul className="modules">
          {MODULES.map((mod) => (
            <li key={mod} className="module">
              <div className="module__name">{mod}</div>
              <ul className="module__lessons">
                {LESSONS.filter((l) => l.module === mod).map((l) => (
                  <li key={l.id}>
                    <b>{String(l.number).padStart(2, "0")}</b>
                    {l.title}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 14 }}>
          Lessons validate <strong>what happened in the simulator</strong> - events like DATASET_SEARCHED or MEMBER_SAVED and the resulting
          catalog - so any legitimate ISPF route is accepted. Typing <code>3</code> then <code>4</code> and typing <code>3.4</code> both count.
        </p>
      </Section>

      <Section title="Glossary" row="Row 4 of 6">
        <ul className="gloss">
          {TEASER.map((term) => {
            const g = GLOSSARY.find((x) => x.term.toLowerCase() === term.toLowerCase());
            return g ? (
              <li key={term}>
                <b>{g.term}</b>
                {g.summary}
              </li>
            ) : null;
          })}
        </ul>
        <p style={{ marginTop: 10 }}>
          Inside the lab, type <code>EXPLAIN PDS</code> (or any term) on a command line, or open the Explain drawer, for the full glossary.
        </p>
      </Section>

      <Section title="Reference guides" row="Row 5 of 6">
        <p>The course follows the order and terminology of these free guides. Read them alongside the lessons.</p>
        <ul className="ref-list">
          {RESOURCES.map((r) => (
            <li key={r.id}>
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                {r.title}
              </a>
              <span>{r.publisher}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Start" row="Row 6 of 6">
        <p>
          Press <code>1</code> on your keyboard, or click the terminal above. Everything - your data sets, your progress - is stored in this
          browser only. There is no account and no server.
        </p>
        <button type="button" className="crt-button crt-button--primary" onClick={() => go("learn")}>
          Open ISPF Lab
        </button>
      </Section>

      <footer className="landing__footer">
        <span>Educational ISPF training simulator. Not affiliated with or endorsed by IBM. z/OS, ISPF and TSO are trademarks of IBM Corporation.</span>
        <Link href="/resources">Resources</Link>
        <span>Option ===&gt; NAMES lists the other names this project almost had.</span>
      </footer>
    </div>
  );
}
