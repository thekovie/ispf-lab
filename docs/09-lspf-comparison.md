# lspf comparative feature audit

[lspf](https://github.com/daniel64/lspf) is an independent, GPL-licensed, open-source ISPF-like dialogue manager
for Linux by daniel64. It served ISPF Lab as a **reference and source of inspiration only**. No lspf code, panel
definitions, help text or algorithms are incorporated; every ISPF Lab feature is a clean-room implementation checked
against IBM z/OS documentation. lspf is not affiliated with ISPF Lab or IBM, and lspf intentionally differs from IBM
ISPF in places — it is never treated as the authority on ISPF behaviour.

Reference priority: 1. official IBM z/OS documentation → 2. behaviour verified against genuine ISPF concepts →
3. lspf as secondary implementation/UX inspiration → 4. educational simplification for ISPF Lab.

| Concept | ISPF Lab | lspf | IBM ISPF | Recommendation |
|---|---|---|---|---|
| Split screen / SWAP / SWAPBAR | 8 logical screens, SWAP n/PREV/LIST (list as a message), SWAPBAR row | yes | yes (User's Guide "Split-screen mode") | keep; a SWAP LIST panel later |
| Jump function `=x.y` | yes (Phase 12) | yes | yes | done |
| RETURN | yes (Phase 12) | yes | yes | done |
| Keylists | fixed per panel, IBM defaults | editable keylists | KEYLIST utility | later: read-only keylist viewer |
| Referral lists (REFLIST) | no | yes | yes | later; good lesson candidate |
| Command retrieval | Priority 2 | yes | yes (RETRIEVE, F12) | implement |
| Field history | no | yes | yes | later |
| Cursor-sensitive help | no | yes | yes | later, high educational value |
| Edit profiles | Priority 2 | yes | yes | implement |
| Edit recovery / SETUNDO | Priority 2 (flag semantics) | yes | yes | implement educationally |
| Editor macros | no | REXX | REXX / CLIST | future advanced track; sandboxed only |
| Command tables | no | yes | yes | future advanced track |
| Compare (SuperC) | no | yes | 3.12 / 3.13 | future lesson candidate |
| Panel / dialog development | no | full (`)ATTR`, `)BODY`, tables, file tailoring, ISPEXEC) | full | separate ADVANCED / developer track (see below) |
| Linux filesystem semantics | none — z/OS data sets, HLQs, JES | yes (Linux) | n/a | never adopt |

## Future ISPF application-development track (not scheduled)

lspf demonstrates that ISPF is a dialogue framework, not only an editor. A later ISPF Lab curriculum could teach
simplified panels (`)ATTR )BODY )INIT )PROC`), dialogue variables and pools, tables, action bars, messages, file
tailoring and REXX/ISPEXEC — as a separate advanced track. The current objective stays: navigate ISPF → work with
data sets → edit members → submit JCL → inspect jobs through SDSF.
