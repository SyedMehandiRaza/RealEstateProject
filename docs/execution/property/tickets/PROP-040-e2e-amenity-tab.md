# PROP-040: E2E: Amenity tab

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-021, PROP-022, PROP-023, PROP-033
- **Cites:** PROP-SPEC-001 §Testing Decisions, PROP-DEC-020
- **Figma:** 13009:8335

## What to build

A Developer filters amenities and adds, edits and deletes one with plans against the real API.

## Acceptance criteria

- [ ] Journey: add with plans and see the success modal, edit status, delete with confirmation
- [ ] Journey: search and filters with 11+ seeded amenities
- [ ] E2E: client and server parity: one invalid submit per form shows the shared constant from the client, and the same message when the client check is bypassed and the server answers
- [ ] E2E: visual screenshots at the frame size (13009:8335) and responsive screenshots at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal page scroll
- [ ] E2E: runs against the e2e server with data seeded through the harness, and leaves no state for other specs (reset per test)

## Out of scope

- New behaviour (only connects and proves what earlier tickets built)

## Verification

_Filled when done._
