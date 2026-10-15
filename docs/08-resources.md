# Resources the course follows

Also rendered at `/resources` from `src/content/resources.ts` (keep both in sync).

| Id | Title | Publisher | Why | Used for |
|---|---|---|---|---|
| `redbook` | [Introduction to the New Mainframe: z/OS Basics (SG24-6366)](https://www.redbooks.ibm.com/redbooks/pdfs/sg246366.pdf) | IBM Redbooks | The canonical free textbook; ch. 4 TSO/E, ISPF and UNIX; ch. 5 data sets | Module order 1–2, glossary |
| `ispf-users-guide` | [z/OS ISPF User's Guide Vol I (SC19-3627)](https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54ug00_v3r2.pdf) | IBM | Navigation, PF keys, split screens, the jump function | Navigation lessons, PF-key legends |
| `ispf-users-guide-2` | [z/OS ISPF User's Guide Vol II (SC19-3628)](https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54u200_v3r2.pdf) | IBM | Option 0 Settings, Browse, utilities 3.1 to 3.4, DSLIST line commands and SORT | Data set and list lessons |
| `ispf-edit` | [z/OS ISPF Edit and Edit Macros (SC19-3621)](https://www.ibm.com/docs/en/SSLTBW_3.2.0/pdf/f54em00_v3r2.pdf) | IBM | Every editor command and message | Module 3, docs/04 |
| `mainframemaster-menu` | [ISPF Primary Option Menu: Options 0–9](https://www.mainframemaster.com/tutorials/tso-ispf/ispf-primary-option-menu) | Mainframe Master | Modern walkthrough of the menu | Lesson 2 |
| `mainframemaster-32` | [ISPF Data Set Utility (3.2)](https://www.mainframemaster.com/tutorials/tso-ispf/ispf-dataset-utility) | Mainframe Master | Allocate panel field by field | Lesson 6 |
| `mainframestechhelp` | [ISPF Tutorial](https://www.mainframestechhelp.com/tutorials/ispf/) | Mainframestechhelp | Topic order Settings → 3.1/3.2/3.3/3.4 → member lists → editor | Modules 2–4 |
| `lspf` | [lspf](https://github.com/daniel64/lspf) | daniel64/lspf on GitHub (GPL) | An independent open-source ISPF-like dialogue manager; interaction ideas only | docs/09-lspf-comparison.md |

## Acknowledgement

[lspf](https://github.com/daniel64/lspf) (daniel64, GPL) — an independent open-source ISPF-like dialogue manager for
Linux — was used as a reference and source of inspiration for interaction ideas. No lspf code is incorporated; see
`docs/09-lspf-comparison.md`. lspf is not affiliated with ISPF Lab or IBM.
