# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files under `docs/execution/` (Q-006, DEC-022). The repo has a GitHub remote, but GitHub Issues are not used for now.

## Conventions

- **Tickets** are rows in `docs/execution/BACKLOG.md`, one row per ticket, with IDs `TASK-NNN` numbered in sequence (never reuse an ID). Columns: ID, Task, Owner, Dependencies, Acceptance criteria, Status, Verification.
- **Specs** are one file each at `docs/execution/specs/SPEC-NNN-<slug>.md`, numbered in sequence. The header lists `Labels:`, `Tracker:` (with the TASK IDs it produced), `Sources:` and `Written:`.
- A ticket created from a spec says so in its Task cell: `(spec: specs/SPEC-NNN-<slug>.md, <triage label>)`.
- **Workflow status** is the BACKLOG `Status` column: Discovery, Ready, In Progress, Review, Done, Blocked (add a short reason or date, for example `Blocked (MySQL not installed)`).
- **Triage state** uses the label strings in `triage-labels.md`: on a spec, in its `Labels:` line; on a ticket, in its Task cell next to the spec link.
- **Comments and history**: on a spec, append to a `## Comments` heading at the bottom of the file (dated). On a ticket, keep the row short: put the result in Verification, and longer notes in `docs/execution/STATUS.md`.
- Open questions go in `docs/execution/QUESTIONS.md` (`Q-NNN`), and decisions in `docs/DECISIONS.md` (`DEC-NNN`). Tickets and specs cite them by ID.

## When a skill says "publish to the issue tracker"

- A spec: create `docs/execution/specs/SPEC-NNN-<slug>.md` with the next free number, and link it from the related BACKLOG rows and the module's `docs/modules/<module>/README.md`.
- Tickets: append rows to `BACKLOG.md` with the next free `TASK-NNN` IDs, and list the dependencies by ID.

## When a skill says "fetch the relevant ticket"

Read the BACKLOG row with that `TASK-NNN` ID, plus the spec it links to. The user will normally give the ID or the spec path.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `docs/execution/wayfinding/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `docs/execution/wayfinding/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan the effort's `issues/` folder for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`. A resolved decision that affects the product also goes in `docs/DECISIONS.md`.
