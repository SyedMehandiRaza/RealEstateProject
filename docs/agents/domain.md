# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase. Layout: **single-context** (one glossary for the whole product, even though the code is split into npm workspaces).

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root: domain terms only (Account, Role, Buyer, Developer, Verification document, ...), no implementation detail.
- **`docs/DECISIONS.md`**: this repo's ADRs, one `## DEC-NNN: <title>` section each, with Status and Date. Read the decisions that touch the area you're about to work in. There is no `docs/adr/` folder; record new decisions as the next `DEC-NNN` in this file.
- **`docs/modules/<module>/`**: the module spec (`README.md`), `db.md` (field inventory, schema, personal data and retention) and `figma.md` (frames to build). Read the folder for every module you touch. `docs/modules/README.md` lists the modules, and `_template/` is the starting point for a new one.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

```
/
├── GLOSSARY.md
└── docs/
    ├── DECISIONS.md            ← ADRs (DEC-NNN)
    ├── modules/
    │   ├── README.md
    │   ├── _template/
    │   └── auth/               ← README.md, db.md, figma.md
    └── execution/              ← README.md, <module>/ (board, STATUS, tickets/, questions/, decisions/, specs/); auth: BACKLOG.md, QUESTIONS.md
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing decision in `docs/DECISIONS.md`, surface it explicitly rather than silently overriding:

> _Contradicts DEC-019 (multiple roles per account), but worth reopening because…_
