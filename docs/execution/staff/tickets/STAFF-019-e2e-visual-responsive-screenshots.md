# STAFF-019: E2E visual and responsive screenshots of every staff page

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-016, STAFF-017, STAFF-018
- **Cites:** STAFF-SPEC-001 §Responsive rule; figma.md
- **Figma:** Staff Management list 13009:17816 (1440x832); Add Staff 13009:18190 (546x710); success 13009:18180 (332x261); Staff Detail 13009:18226 (833x593)

## What to build

Playwright takes screenshots of the list, Add, Edit, Detail, success, Remove confirmation and Assign picker at their Figma frame sizes and compares them to Figma; and at 1366x768, 1280x720, 768x1024 and 375x812 it checks for no horizontal scroll and no overlapping elements.

## Acceptance criteria

- [ ] Baseline screenshots at the frame sizes are compared with the Figma screenshots and differences are fixed or listed in `figma.md` with a reason
- [ ] At each responsive size: `document.documentElement.scrollWidth <= innerWidth`, the menu button appears below 1024 px, the table becomes cards below 768 px, modals scroll inside
- [ ] Screenshot files are listed in the ticket's Verification; `figma.md` statuses become `matches-figma`
- [ ] `npm run check` passes; `npm run test:e2e` passes

## Out of scope

- Visual changes to Figma itself

## Verification

(filled when done)
