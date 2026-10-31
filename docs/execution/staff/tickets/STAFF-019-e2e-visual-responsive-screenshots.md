# STAFF-019: E2E visual and responsive screenshots of every staff page

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-016, STAFF-017, STAFF-018
- **Cites:** STAFF-SPEC-001 §Responsive rule; figma.md
- **Figma:** Staff Management list 13009:17816 (1440x832); Add Staff 13009:18190 (546x710); success 13009:18180 (332x261); Staff Detail 13009:18226 (833x593)

## What to build

Playwright takes screenshots of the list, Add, Edit, Detail, success, Remove confirmation and Assign picker at their Figma frame sizes and compares them to Figma; and at 1366x768, 1280x720, 768x1024 and 375x812 it checks for no horizontal scroll and no overlapping elements.

## Acceptance criteria

- [x] Baseline screenshots at the frame sizes are compared with the Figma screenshots and differences are fixed or listed in `figma.md` with a reason
- [x] At each responsive size: `document.documentElement.scrollWidth <= innerWidth`, the menu button appears below 1024 px, the table becomes cards below 768 px, modals scroll inside
- [x] Screenshot files are listed in the ticket's Verification; `figma.md` statuses become `matches-figma`
- [x] `npm run check` passes; `npm run test:e2e` passes

## Out of scope

- Visual changes to Figma itself

## Verification

- `e2e/tests/staff/staff-visual.spec.js`: 8 tests and 32 baselines in `staff-visual.spec.js-snapshots/` (list, Add, Add with errors, Successfully Added, Edit, Detail, Remove confirmation, Assign picker) at 1440x832 (Figma frame), 1366x768, 1280x720, 768x1024 and 375x812. Each size also asserts no horizontal scroll and every open dialog inside the viewport; a separate test checks the menu button below 1024 px and the table → cards switch.
- Baselines created with `--update-snapshots` after the pages were checked by hand against the Figma frames in STAFF-011 to STAFF-015 (positions in `docs/modules/staff/figma.md`, "Verification notes"); two baselines viewed again before committing (list, Remove). Then the whole staff suite ran without updating: 34 / 34 passed (2.1 min).
- No production code changed. Lint and format green.
