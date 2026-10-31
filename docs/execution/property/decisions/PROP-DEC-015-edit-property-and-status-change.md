# PROP-DEC-015: Edit property is one page; a status change keeps progress data

- **Status:** accepted (user, 2026-10-31)
- **Answers:** PROP-Q-023, PROP-Q-024
- **Tickets:** edit-property API and page tickets

## Decision

- **Edit Property** (`/properties/:id/edit`) shows the fields of wizard steps 1 and 2 on one page, prefilled: basic information, location, map pin, details, features (chips) and, for under-construction properties, the possession date. Save sends `PUT /api/properties/:id` with all of them, validated by the same shared schema as create (without configurations, media and documents). Features are replaced as a set. Cancel leaves without saving.
- Configurations, media and documents are changed only in their tabs.
- Status change:
  - to `under_construction`: the progress row is created at 0% if it does not exist; `possessionDate` (optional) is stored on it.
  - to `ready_to_move`: the progress row and the updates are kept; the Update tab, the progress bar and the "Add Update" card button are hidden. Switching back shows them again.
- `possessionDate`: optional, ISO date `YYYY-MM-DD`, a real calendar date, no past/future limit; sent only when the status is `under_construction` (otherwise 422 `possessionDate.notAllowed`).

## Why

No Edit frame exists; reusing the create layout keeps one form and one schema. Keeping data on a status change is reversible.

## Alternatives rejected

- Reopening the 6-step wizard: media and document edits already have their own tabs.
- Deleting progress and updates on a change to ready to move: loses data on a mistaken click.
