/**
 * Reference guides the course is modelled on. Shown on /resources and linked from the glossary.
 * Keep in sync with docs/08-resources.md.
 */
export interface Resource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  why: string;
  usedFor: string;
}

export const RESOURCES: Resource[] = [
  {
    id: "redbook",
    title: "Introduction to the New Mainframe: z/OS Basics (SG24-6366)",
    publisher: "IBM Redbooks",
    url: "https://www.redbooks.ibm.com/redbooks/pdfs/sg246366.pdf",
    why: "The canonical free textbook. Chapter 4 walks a beginner from TSO logon through the ISPF Primary Option Menu, PF keys and the editor; chapter 5 explains data sets.",
    usedFor: "Course order of modules 1-2; glossary definitions.",
  },
  {
    id: "ispf-users-guide",
    title: "z/OS ISPF User's Guide Volume I (SC19-3627)",
    publisher: "IBM",
    url: "https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54ug00_v3r2.pdf",
    why: "Navigation, PF keys, split screens, the jump function and the command line.",
    usedFor: "Navigation lessons (modules 1 and 6-7), PF-key legends.",
  },
  {
    id: "ispf-users-guide-2",
    title: "z/OS ISPF User's Guide Volume II (SC19-3628)",
    publisher: "IBM",
    url: "https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54u200_v3r2.pdf",
    why: "Option 0 Settings, Browse and the data set utilities 3.1 to 3.4, including DSLIST line commands and SORT.",
    usedFor: "Data set and list lessons (modules 2 and 9), the Settings panel.",
  },
  {
    id: "ispf-edit",
    title: "z/OS ISPF Edit and Edit Macros",
    publisher: "IBM",
    url: "https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54em00_v3r2.pdf",
    why: "Every editor line command and primary command, with its exact messages.",
    usedFor: "Editor semantics in module 3 and docs/04-editor-commands.md.",
  },
  {
    id: "mainframemaster-menu",
    title: "ISPF Primary Option Menu: Options 0-9 Explained",
    publisher: "Mainframe Master",
    url: "https://www.mainframemaster.com/tutorials/tso-ispf/ispf-primary-option-menu",
    why: "A short, modern walkthrough of what each option does.",
    usedFor: "Lesson 2 and the option descriptions.",
  },
  {
    id: "mainframemaster-32",
    title: "ISPF Data Set Utility (3.2): Allocate, Delete, Rename",
    publisher: "Mainframe Master",
    url: "https://www.mainframemaster.com/tutorials/tso-ispf/ispf-dataset-utility",
    why: "Field-by-field explanation of the Allocate New Data Set panel.",
    usedFor: "Lesson 6 and the allocation panel.",
  },
  {
    id: "mainframestechhelp",
    title: "ISPF Tutorial",
    publisher: "Mainframestechhelp",
    url: "https://www.mainframestechhelp.com/tutorials/ispf/",
    why: "Topic sequence Settings → Utilities 3.1/3.2/3.3/3.4 → member lists → editor commands, which this course mirrors.",
    usedFor: "Module order for modules 2-4.",
  },
  {
    id: "lspf",
    title: "lspf — an ISPF-like dialogue manager for Linux (open source)",
    publisher: "daniel64/lspf on GitHub (GPL)",
    url: "https://github.com/daniel64/lspf",
    why: "An independent open-source project that re-creates ISPF concepts (panels, editor, split screens, keylists, command retrieval) on Linux. ISPF Lab used it only as a reference and source of inspiration for interaction ideas; no lspf code is incorporated, and lspf is not affiliated with ISPF Lab or IBM.",
    usedFor: "Comparative feature audit (docs/09-lspf-comparison.md).",
  },
];
