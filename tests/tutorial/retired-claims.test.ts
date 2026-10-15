/**
 * M1b-1/2: statements the lessons and glossary must not teach as fact, because IBM's documentation contradicts them
 * or does not support them (docs/curriculum/m0-acceptance-review.md F-04, F-05, F-09; verified-sources.md; EV-A/B/C).
 * Each entry names the evidence. Add an entry whenever a taught statement is retired.
 */
import { describe, expect, it } from "vitest";
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
