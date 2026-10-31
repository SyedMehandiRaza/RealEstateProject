# PROP-036: E2E: Overview and gallery

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-010, PROP-015, PROP-016, PROP-023, PROP-029
- **Cites:** PROP-SPEC-001 §Testing Decisions, PROP-DEC-018, PROP-DEC-022
- **Figma:** 13009:7369

## What to build

A Developer opens a property, browses the gallery viewer, uploads an image, video and 360 tour, and deletes media down to the last image.

## Acceptance criteria

- [ ] Journey: viewer keyboard navigation
- [ ] Journey: upload of each type; the last image cannot be deleted
- [ ] Journey: opening another Developer's property id shows "Property not found"
- [ ] E2E: client and server parity: one invalid submit per form shows the shared constant from the client, and the same message when the client check is bypassed and the server answers
- [ ] E2E: visual screenshots at the frame size (13009:7369) and responsive screenshots at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal page scroll
- [ ] E2E: runs against the e2e server with data seeded through the harness, and leaves no state for other specs (reset per test)

## Out of scope

- New behaviour (only connects and proves what earlier tickets built)

## Verification

_Filled when done._
