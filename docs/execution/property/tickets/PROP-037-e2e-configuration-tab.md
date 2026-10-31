# PROP-037: E2E: Configuration tab

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-013, PROP-014, PROP-023, PROP-030
- **Cites:** PROP-SPEC-001 §Testing Decisions, PROP-DEC-017
- **Figma:** 13009:9932

## What to build

A Developer adds, edits and deletes configurations and their floor plans against the real API.

## Acceptance criteria

- [ ] Journey: add, edit with status, add and remove a floor plan, delete (not the last)
- [ ] Journey: a duplicate name shows the server message on the name field
- [ ] E2E: client and server parity: one invalid submit per form shows the shared constant from the client, and the same message when the client check is bypassed and the server answers
- [ ] E2E: visual screenshots at the frame size (13009:9932) and responsive screenshots at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal page scroll
- [ ] E2E: runs against the e2e server with data seeded through the harness, and leaves no state for other specs (reset per test)

## Out of scope

- New behaviour (only connects and proves what earlier tickets built)

## Verification

_Filled when done._
