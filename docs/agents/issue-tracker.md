# Issue tracker: Local Markdown

Tickets, questions, decisions and specs live as markdown files under `docs/execution/` (Q-006, DEC-022; per-module layout chosen by the user on 2026-10-30). The repo has a GitHub remote, but GitHub Issues are not used for now. The folder map is in [docs/execution/README.md](../execution/README.md).

## One folder per module, one file per item

```
docs/execution/<module>/
  README.md                     the module board: one line per ticket, open questions, decisions
  STATUS.md                     current state, next actions, blockers (short; history goes in the tickets)
  tickets/<PREFIX>-NNN-<slug>.md
  questions/<PREFIX>-Q-NNN-<slug>.md
  decisions/<PREFIX>-DEC-NNN-<slug>.md
  specs/<PREFIX>-SPEC-NNN-<slug>.md
```

- **Prefixes** (one per module, so parallel branches never pick the same ID): `PROP` property, `FAC` facility, `STAFF` staff. A new module picks a short upper-case prefix and adds it to the table in `docs/execution/README.md`. IDs are numbered in sequence inside the module and never reused.
- **Slug**: lower-case words joined by `-`, at most 5 words, saying what the item is about (`PROP-004-list-properties-with-filters.md`).
- Templates: `docs/execution/_templates/` (ticket, question, decision, module README). Copy the template; keep its headings.
- Module-wide decisions go in the module's `decisions/`. Only decisions that change more than one module (shared schemas, error codes, auth, app bootstrap) go in `docs/DECISIONS.md` as `DEC-NNN`, made by the integration owner.
- Auth (written before this layout) keeps its old files: `docs/execution/BACKLOG.md` (`TASK-NNN`), `QUESTIONS.md` (`Q-NNN`), `STATUS.md` and `specs/SPEC-001-auth-api.md`. Do not add new modules' items to them.

## Ticket rules

- One vertical slice per ticket (schema, API, UI and tests for one behaviour), small enough for one fresh session. Prefactoring and the module's migration are their own tickets, first.
- Title: at most 70 characters, starting with a verb ("List properties with filters").
- "What to build" describes behaviour from the user's side in 2 to 5 sentences. No file paths or code.
- Every acceptance criterion is one checkbox that a test or a screenshot can prove. Validation, permissions (who may, who may not) and error cases are criteria too.
- "Blocked by" lists ticket IDs only. "Cites" lists the questions, decisions and spec sections it depends on.
- A ticket with an open question it cannot work around is `blocked`, and its file names the question.
- When done: tick the criteria, fill "Verification" (test files and counts, screenshots), set Status to `done (YYYY-MM-DD)`, and update the line in the module README board.

## Status values

`ready-for-agent`, `ready-for-human`, `in-progress`, `review`, `blocked`, `done (YYYY-MM-DD)`, `wontfix`. Triage labels are in `triage-labels.md`. The same value goes in the ticket file and on its line in the module board.

## When a skill says "publish to the issue tracker"

- A spec: create `docs/execution/<module>/specs/<PREFIX>-SPEC-NNN-<slug>.md` with the next free number, and link it from the module board and `docs/modules/<module>/README.md`.
- Tickets (`/to-tickets`): create one file per ticket in `docs/execution/<module>/tickets/` from the ticket template, numbered in dependency order (blockers first), and add one line per ticket to the board in the module README. Never put tickets in one combined file.
- A question: one file in `questions/` from the question template, plus a line in the board's "Open questions".

## When a skill says "fetch the relevant ticket"

Read the ticket file with that ID (`docs/execution/<module>/tickets/<ID>-*.md`), the spec, questions and decisions it cites, and the module board. The user normally gives the ID.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `docs/execution/wayfinding/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `docs/execution/wayfinding/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan the effort's `issues/` folder for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`. A resolved decision that affects the product also goes in `docs/DECISIONS.md`.
