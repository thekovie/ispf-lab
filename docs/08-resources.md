# Resources the course follows

Also rendered at `/resources` from `src/content/resources.ts` (keep both in sync).

| Id | Title | Publisher | Why | Used for |
|---|---|---|---|---|
| `redbook` | [Introduction to the New Mainframe: z/OS Basics (SG24-6366)](https://www.redbooks.ibm.com/redbooks/pdfs/sg246366.pdf) | IBM Redbooks | The canonical free textbook; ch. 4 TSO/E, ISPF and UNIX; ch. 5 data sets | Module order 1–2, glossary |
| `ispf-users-guide` | [z/OS ISPF User's Guide Vol I (SC19-3627)](https://www.ibm.com/docs/en/SSLTBW_3.1.0/pdf/f54ug00_v3r1.pdf) | IBM | Authoritative panels, PF keys, settings | Panel layouts and legends |
| `ispf-edit` | [z/OS ISPF Edit and Edit Macros](https://www.informatik.uni-leipzig.de/cs/Literature/Textbooks/ISPFedit.pdf) | IBM | Every editor command and message | Module 3, docs/04 |
| `share-lab` | [ISPF Editor – Beyond the Basics, Hands-On Lab](https://share.confex.com/share/117/webprogram/Handout/Session9692/ISPF%20Editor%20LAB.pdf) | SHARE (L. Doherty) | Exercise-style drills | Lessons 9–11 |
| `mainframemaster-menu` | [ISPF Primary Option Menu: Options 0–9](https://www.mainframemaster.com/tutorials/tso-ispf/ispf-primary-option-menu) | Mainframe Master | Modern walkthrough of the menu | Lesson 2 |
| `mainframemaster-32` | [ISPF Data Set Utility (3.2)](https://www.mainframemaster.com/tutorials/tso-ispf/ispf-dataset-utility) | Mainframe Master | Allocate panel field by field | Lesson 6 |
| `mainframestechhelp` | [ISPF Tutorial](https://www.mainframestechhelp.com/tutorials/ispf/) | Mainframestechhelp | Topic order Settings → 3.1/3.2/3.3/3.4 → member lists → editor | Modules 2–4 |

Also consulted during planning: [Mainframe Master – Allocating data sets](https://www.mainframemaster.com/tutorials/tso-ispf/ispf-allocate-datasets).

## Acknowledgement

[lspf](https://github.com/daniel64/lspf) (daniel64, GPL) — an independent open-source ISPF-like dialogue manager for
Linux — was used as a reference and source of inspiration for interaction ideas. No lspf code is incorporated; see
`docs/09-lspf-comparison.md`. lspf is not affiliated with ISPF Lab or IBM.
