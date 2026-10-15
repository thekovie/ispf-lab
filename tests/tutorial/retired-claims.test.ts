/**
 * M1b-1/2: statements the lessons and glossary must not teach as fact, because IBM's documentation contradicts them
 * or does not support them (docs/curriculum/m0-acceptance-review.md F-04, F-05, F-09; verified-sources.md; EV-A/B/C).
 * Each entry names the evidence. Add an entry whenever a taught statement is retired.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSeed } from "@/catalog/seed";
import { GLOSSARY } from "@/tutorial/explain";
import { LESSONS } from "@/tutorial/lessons";

interface Retired {
  claim: RegExp;
  why: string;
}

const RETIRED: Retired[] = [
  { claim: /submits the data set on disk/i, why: "IBM: Edit SUBMIT 'submits the member or data set you are editing'; unsaved edits are not addressed (ADR 0015)" },
  { claim: /real ISPF submits the (data set|member|copy) (on disk|saved)/i, why: "same; the 'disk copy' wording belongs to Browse SUBMIT" },
  { claim: /SJ opens the submitted JCL/i, why: "IBM: SJ edits the JCL held for the job; changes are not saved (EV-C c3/c4, ADR 0015)" },
  { claim: /IEF212I names the data set/i, why: "IBM: IEF212I names the job, step and DD (EV-B 2.2)" },
  { claim: /IEF212I[^.]*which data set\?/i, why: "the DD statement names the data set, not the message" },
  { claim: /without the space figures|omits the space/i, why: "IBM: S omits the directory blocks and member count of a PDS, not the space figures (UG2 option 3.4 S)" },
  { claim: /audit trail operators/i, why: "IBM: 'These numbers can be useful in controlling library members'; 'audit trail' is only used for RECOVERY (EV-A 6)" },
  { claim: /every save[^.]*bumps the modification level/i, why: "IBM: the level rises on the first change of a session (EM, Statistics for PDS members)" },
  { claim: /STATS OFF[^.]*stops the editor updating/i, why: "IBM: with STATS OFF, previous statistics are lost on save (EM, STATS)" },
  { claim: /never pops up|never pop up/i, why: "IBM: the long message shows in a pop-up window by default (UG1 Getting help; UG2 Settings 'Long message in pop-up')" },
  { claim: /so it takes two PF3s/i, why: "IBM: typing 3.4 bypasses the second menu (UG1); the PF3 count depends on the route" },
  { claim: /there is no undo in classic/i, why: "IBM: Edit has UNDO (EM, UNDO) with SETUNDO or RECOVERY on" },
  { claim: /never more than eight|up to 8 (logical )?screens/i, why: "IBM: the default is 8 and up to 32 may be allowed (UG1 split screen)" },
  { claim: /journals your (keystrokes|changes)|keeps UNDO available|ISPF ships RECOVERY OFF/i, why: "IBM: RECOVERY writes a recovery data set; defaults come from the site's configuration (EM, RECOVERY/SETUNDO)" },
  { claim: /CAPS OFF to restore the default/i, why: "IBM: CAPS is set from the data when a member opens; it has no fixed default (EM, CAPS)" },
  { claim: /AUTOSAVE ON \(the default/i, why: "IBM states no universal default (EM, AUTOSAVE)" },
  { claim: /option letter varies by site - S, SD or M\.5|S, SD or M\.5/i, why: "SDSF is option S on the standard menu or what the site configures; SD and M.5 are not IBM-documented (EV-C a1)" },
  { claim: /=option is RETURN followed by the option|is RETURN followed by the option/i, why: "IBM: the jump ends panels with repeated END to a primary option menu, then selects the option (UG1 jump function)" },
];

/** Every string a lesson shows the learner. */
function lessonTexts(): { where: string; text: string }[] {
  return LESSONS.flatMap((l) => [
    { where: `${l.id} objective`, text: l.objective },
    { where: `${l.id} description`, text: l.description },
    ...l.teaches.map((t, i) => ({ where: `${l.id} teaches[${i}]`, text: t })),
    ...l.steps.flatMap((s) => [
      { where: `${l.id}/${s.id} instruction`, text: s.instruction },
      { where: `${l.id}/${s.id} hint`, text: s.hint },
      { where: `${l.id}/${s.id} explanation`, text: s.explanation ?? "" },
    ]),
    { where: `${l.id} challenge`, text: l.challenge?.task ?? "" },
  ]);
}

const glossaryTexts = () =>
  GLOSSARY.flatMap((g) => [
    { where: `glossary ${g.term} summary`, text: g.summary },
    { where: `glossary ${g.term} detail`, text: g.detail ?? "" },
  ]);

describe("retired claims are not taught", () => {
  const texts = [...lessonTexts(), ...glossaryTexts()];
  it.each(RETIRED)("$claim ($why)", ({ claim }) => {
    const hits = texts.filter((t) => claim.test(t.text)).map((t) => t.where);
    expect(hits).toEqual([]);
  });
});

describe("reference docs do not repeat retired claims", () => {
  const docs = ["docs/03-ispf-behaviour-reference.md", "docs/04-editor-commands.md", "docs/10-jes-sdsf.md", "docs/05-course-design.md"];
  it.each(docs)("%s", (file) => {
    const text = readFileSync(file, "utf8");
    const hits = RETIRED.filter((r) => r.claim.test(text)).map((r) => String(r.claim));
    expect(hits).toEqual([]);
    expect(text).not.toMatch(/deviation: ISPF submits the saved data set/i);
  });
});

describe("the glossary has no shadowed entries", () => {
  it("every term and alias is unique", () => {
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const g of GLOSSARY) {
      for (const key of [g.term, ...(g.aliases ?? [])].map((k) => k.toLowerCase())) {
        const prev = seen.get(key);
        if (prev && prev !== g.term) dup.push(`${key}: ${prev} / ${g.term}`);
        seen.set(key, g.term);
      }
    }
    expect(dup).toEqual([]);
  });
  it("there is a single JCL entry", () => {
    expect(GLOSSARY.filter((g) => g.term === "JCL")).toHaveLength(1);
  });
});

describe("the SUBMIT and SJ disclosures are present", () => {
  const glossary = (term: string) => GLOSSARY.find((g) => g.term === term)!;
  it("the SUBMIT entry says IBM is silent on unsaved edits", () => {
    expect(glossary("SUBMIT").detail).toMatch(/does not say whether changes you have not saved/i);
  });
  it("lesson 27 says real SDSF does not save SJ changes", () => {
    const l = LESSONS.find((x) => x.id === "l27-jcl-error")!;
    const sj = l.steps.find((s) => s.id === "sj")!;
    expect(sj.instruction).toMatch(/does not save/i);
  });
});

describe("the Day-One data set is described as nonexistent, not uncataloged", () => {
  // The simulator has no uncataloged state (GAP-10): USER01.PAYROLL.DATA simply does not exist.
  const premise = /(uncatalog|not catalog)[^\n]{0,80}PAYROLL|PAYROLL[^\n]{0,80}(uncatalog|not catalog)|uncataloged (data set|SYSUT1)/i;
  const loose = /uncatalog|not cataloged/i; // the seed member says nothing else about the catalog state

  it("lesson and glossary text", () => {
    const hits = [...lessonTexts(), ...glossaryTexts()].filter((t) => premise.test(t.text)).map((t) => t.where);
    expect(hits).toEqual([]);
  });

  it("the PAYRPT member in the seed catalog", () => {
    const payrpt = buildSeed("USER01").datasets["USER01.JCL"].members!.PAYRPT.records.join("\n");
    expect(loose.test(payrpt)).toBe(false);
    expect(payrpt).not.toMatch(/FIX THE JCL/); // creating the data set is a valid repair too
  });

  it.each(["docs/03-ispf-behaviour-reference.md", "docs/10-jes-sdsf.md"])("%s", (file) => {
    expect(premise.test(readFileSync(file, "utf8"))).toBe(false);
  });
});
