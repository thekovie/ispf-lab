"use client";
/**
 * Explain drawer: searchable glossary. Opened from the top bar or by typing
 * EXPLAIN <term> on any ISPF command line.
 */
import { useState } from "react";
import { RESOURCES } from "@/content/resources";
import { useTutorial } from "@/state/TutorialProvider";
import { searchGlossary, type GlossaryEntry } from "@/tutorial/explain";

function Entry({ entry }: { entry: GlossaryEntry }) {
  const res = entry.readMore ? RESOURCES.find((r) => r.id === entry.readMore!.resource) : undefined;
  return (
    <article className="explain__entry">
      <h3 className="explain__term">
        {entry.term}
        {entry.aliases.length > 0 && <span className="explain__aliases"> {entry.aliases.slice(0, 3).join(" · ")}</span>}
      </h3>
      <p className="explain__summary">{entry.summary}</p>
      <p className="explain__detail">{entry.detail}</p>
      {entry.analogy && (
        <p className="explain__analogy">
          <span className="explain__tag">analogy</span> {entry.analogy}
        </p>
      )}
      {res && (
        <p className="explain__more">
          Read more:{" "}
          <a href={res.url} target="_blank" rel="noopener noreferrer">
            {res.title}
          </a>{" "}
          — {entry.readMore!.section}
        </p>
      )}
    </article>
  );
}

export function ExplainDrawer() {
  const t = useTutorial();
  const [query, setQuery] = useState("");
  const open = t.explainQuery !== undefined;
  if (!open) return null;
  const q = query || t.explainQuery || "";
  const hits = query ? searchGlossary(query) : t.explain ? [t.explain] : searchGlossary(q);
  return (
    <div className="explain" role="dialog" aria-label="Explain">
      <div className="explain__head">
        <span className="panel-title">EXPLAIN</span>
        <input
          className="crt-select explain__search"
          placeholder="Search a term: 3.4, PDS, PF3, CC…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search glossary"
          autoFocus
        />
        <button type="button" className="crt-button crt-button--ghost" onClick={() => t.setExplainQuery(undefined)}>
          Close
        </button>
      </div>
      <div className="explain__list">
        {hits.length === 0 && <p className="explain__none">No entry for that yet. Try PDS, member, HLQ, 3.4, PF3, line command.</p>}
        {hits.map((h) => (
          <Entry key={h.term} entry={h} />
        ))}
      </div>
      <p className="explain__tip">Tip: type EXPLAIN PDS on any ISPF command line.</p>
    </div>
  );
}
