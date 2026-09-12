import type { Metadata } from "next";
import Link from "next/link";
import { RESOURCES } from "@/content/resources";
import "@/components/shell/shell.css";

export const metadata: Metadata = {
  title: "ISPF learning resources",
  description:
    "The free guides ISPF Lab is modelled on: the IBM z/OS Basics Redbook, the ISPF User’s Guide, ISPF Edit and Edit Macros, the SHARE editor lab, and community tutorials on option 3.4, 3.2 and the ISPF editor.",
  alternates: { canonical: "/resources" },
  openGraph: { title: "ISPF learning resources", url: "/resources" },
};

export default function ResourcesPage() {
  return (
    <div className="page">
      <h1 className="page__title">RESOURCES</h1>
      <div className="page__rule">{"-".repeat(120)}</div>
      <p>
        ISPF Lab is a simulator, not a reference. These are the guides the course is modelled on; read them alongside the lessons, and
        use them when you move to a real z/OS system.
      </p>
      {RESOURCES.map((r) => (
        <article key={r.id} className="resource">
          <div className="resource__title">
            <a href={r.url} target="_blank" rel="noopener noreferrer">
              {r.title}
            </a>
          </div>
          <div className="resource__pub">{r.publisher}</div>
          <p className="resource__why">{r.why}</p>
          <div className="resource__used">Used for: {r.usedFor}</div>
        </article>
      ))}
      <div className="page__actions">
        <Link href="/" className="crt-button crt-button--ghost">
          Introduction
        </Link>
        <Link href="/lab" className="crt-button crt-button--primary">
          Open the lab
        </Link>
      </div>
      <p className="mono text-xs text-crt-dim">Educational ISPF training simulator. Not affiliated with or endorsed by IBM.</p>
    </div>
  );
}
