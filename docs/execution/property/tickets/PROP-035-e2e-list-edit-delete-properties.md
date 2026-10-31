# PROP-035: E2E: list, edit and delete properties

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-009, PROP-011, PROP-012, PROP-023, PROP-025, PROP-028
- **Cites:** PROP-SPEC-001 §Testing Decisions, PROP-DEC-014, PROP-DEC-015, PROP-DEC-016
- **Figma:** 13009:7145

## What to build

A Developer searches and pages their properties, edits one and deletes another through the confirmation modal, against the real API.

## Acceptance criteria

- [ ] Journey: search filters cards; paging works with 13+ seeded properties; another Developer's properties never show
- [ ] Journey: edit name and status, then see them on the Overview
- [ ] Journey: delete removes the card
- [ ] E2E: client and server parity: one invalid submit per form shows the shared constant from the client, and the same message when the client check is bypassed and the server answers
- [ ] E2E: visual screenshots at the frame size (13009:7145) and responsive screenshots at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal page scroll
- [ ] E2E: runs against the e2e server with data seeded through the harness, and leaves no state for other specs (reset per test)

## Out of scope

- New behaviour (only connects and proves what earlier tickets built)

## Verification

_Filled when done._
