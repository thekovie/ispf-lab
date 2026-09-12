/**
 * Module 5 - Capstone. Lesson 14: no guidance, validated purely on the catalog.
 */
import { memberSatisfies } from "../validators";
import type { Lesson } from "../types";

const REQUIRED = /^\/\/STEP2\s+EXEC\s+PGM=IEFBR14/i;

const finalCheck = memberSatisfies("{HLQ}.JCL", "COPYJOB", (records) => records.some((r) => REQUIRED.test(r)));

export const lesson14: Lesson = {
  id: "l14-final-challenge",
  number: 14,
  module: "Capstone",
  title: "Final navigation challenge",
  description: "Everything you learned, with no hand-holding.",
  objective: "Locate {HLQ}.JCL(COPYJOB), add the statement //STEP2   EXEC PGM=IEFBR14 as a new record after the //COPY step (anywhere in the member is accepted), and save the member.",
  teaches: ["Independent navigation", "Editing and saving without prompts"],
  startingState: { screen: { id: "PRIMARY_OPTION_MENU" }, resetMembers: [{ dsn: "{HLQ}.JCL", member: "COPYJOB" }] },
  steps: [
    {
      id: "do-it",
      instruction: "Locate {HLQ}.JCL(COPYJOB), add the JCL statement //STEP2   EXEC PGM=IEFBR14 as a new record, and save the member. No further instructions.",
      hint: "You will need 3.4 (or option 2), the I line command, overtyping, and SAVE or PF3.",
      validator: finalCheck,
    },
  ],
  challenge: {
    task: "Locate {HLQ}.JCL(COPYJOB), add the requested JCL statement (//STEP2   EXEC PGM=IEFBR14), and save the member.",
    validator: finalCheck,
  },
};
