# PROP-DEC-021: Construction updates and progress rules

- **Status:** accepted (user, 2026-10-31)
- **Answers:** PROP-Q-030
- **Tickets:** updates and progress tickets

## Decision

- Updates and progress exist only for `under_construction` properties: their routes answer 409 CONFLICT (`updates.notUnderConstruction`) for a ready-to-move property (reading included; the tab is hidden).
- `GET .../updates?page=&pageSize=`: newest first, `pageSize` default 10 (max 50); the UI shows 10 and a "Show more" button.
- Add Update: title, description, optional JPG/PNG image up to 10 MB (multipart). Updates can be **deleted** (confirm modal; the image is queued for deletion); there is **no edit**.
- The card's "Add Update" button shows only on under-construction properties.
- `PUT .../progress` replaces all five percentages (integers 0..100, 1% steps; overall independent of the phases, PROP-DEC-010). The possession date is edited on Edit Property (PROP-DEC-015), not here.

## Why

Only add and list are designed; delete is the minimum to fix a mistake.

## Alternatives rejected

- Editable updates: no frame. Overall computed: the design has its own slider.
