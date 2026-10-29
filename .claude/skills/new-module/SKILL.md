---
name: new-module
description: Orchestrate building a complete feature module end to end (spec, DB design, shared validation, tickets, Express API, Figma-exact React pages, Jest and Playwright tests, review), stopping for approval between stages. Use when the user starts a new module, such as "start the properties module" or "build auth".
argument-hint: "<module-name>"
disable-model-invocation: true
---

# New module workflow

Module folder: `docs/modules/<module>/`. If it does not exist, copy `docs/modules/_template/` to it (README.md, figma.md, db.md). Record progress in `docs/execution/STATUS.md` after each stage. Stop after each stage, summarize, and wait for the user's go-ahead.

| # | Stage | How | Output |
|---|-------|-----|--------|
| 1 | Align | `/grill-with-docs` on the module idea, then fill the module README (scope, workflows, business rules, roles, acceptance criteria) | Approved spec, glossary terms, decisions |
| 2 | Pages | Ask the user to paste the Figma page URLs into `figma.md` (one row per page/frame) | Page registry |
| 3 | Database | `/db-design <module>`, then `/db-design-review <module>` | Approved ERD + `db.md` (+ migrations/models if the backend exists) |
| 4 | Contract | `/shared-validation <module>`, then write the API contract in the README Interfaces section | Schemas, messages, schema tests; endpoint table |
| 5 | Tickets | `/to-tickets` from the spec (vertical slices: DB, API, UI, e2e per slice), with blocking edges | Ticket list |
| 6 | Backend | `/express-module` per ticket, driven by `/tdd` and `/jest-testing` | Endpoints + passing tests |
| 7 | Frontend | `/figma-to-module <module> <page>` per page | Pages matching Figma + RTL tests |
| 8 | E2E | `/playwright-e2e <module>` | Journey, parity and visual tests passing |
| 9 | Review | `/code-review`, `/db-design-review diff` if migrations changed, `/security-review` | Findings fixed or reported |

## Parallelism
After stage 4 the contract is fixed. Backend tickets and frontend pages can then run in parallel (agents `developer` and `ui-implementer`, separate worktrees) because both depend only on `shared/` and the API contract. `shared/`, migrations and the route index stay with `integration-owner`. Do not parallelize stages 1 to 4.

## Rules
- Never skip stage 1 or 3 for a module that stores data.
- Do not invent business rules; open questions go to `docs/execution/QUESTIONS.md`.
- The module is done only when the Definition of Done in `CLAUDE.md` is met.
