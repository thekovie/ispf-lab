/**
 * M1b-5: the resource list, docs/08-resources.md and the glossary's "read more" links stay in step, and no link points at
 * an IBM release older than the one the course is checked against (z/OS 3.2; docs/curriculum/verified-sources.md section 5).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RESOURCES } from "@/content/resources";
import { GLOSSARY } from "@/tutorial/explain";

const docs = readFileSync("docs/08-resources.md", "utf8");
const docIds = [...docs.matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map((m) => m[1]);

describe("resources", () => {
  it("ids are unique", () => {
    const ids = RESOURCES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("docs/08-resources.md lists exactly the ids in resources.ts", () => {
    expect([...docIds].sort()).toEqual(RESOURCES.map((r) => r.id).sort());
  });

  it("every URL in resources.ts appears in docs/08", () => {
    for (const r of RESOURCES) expect(docs).toContain(r.url);
  });

  it("every glossary read-more points at an existing resource", () => {
    const known = new Set(RESOURCES.map((r) => r.id));
    const missing = GLOSSARY.filter((g) => g.readMore && !known.has(g.readMore.resource)).map((g) => `${g.term} -> ${g.readMore!.resource}`);
    expect(missing).toEqual([]);
  });

  it("IBM documents are the z/OS 3.2 editions, not 3.1 or a university mirror", () => {
    const ibm = RESOURCES.filter((r) => r.publisher === "IBM");
    expect(ibm.length).toBeGreaterThan(0);
    for (const r of ibm) {
      expect(r.url).toMatch(/^https:\/\/www\.ibm\.com\/docs\/en\/SSLTBW_3\.2\.0\/pdf\/f54[a-z0-9]+_v3r2\.pdf$/);
    }
  });

  it("no link points at a host that did not resolve", () => {
    for (const r of RESOURCES) expect(r.url).not.toContain("share.confex.com");
  });
});
