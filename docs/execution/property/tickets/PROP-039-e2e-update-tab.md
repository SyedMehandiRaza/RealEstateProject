# PROP-039: E2E: Update tab

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-019, PROP-020, PROP-023, PROP-032
- **Cites:** PROP-SPEC-001 §Testing Decisions, PROP-DEC-021
- **Figma:** 13009:7876

## What to build

A Developer sets construction progress, posts updates with and without image, loads more and deletes one.

## Acceptance criteria

- [ ] Journey: progress save shows new badges; post, Show more with 11+ seeded updates, delete
- [ ] Journey: a ready-to-move property has no Update tab and its URL redirects to Overview
- [ ] E2E: client and server parity: one invalid submit per form shows the shared constant from the client, and the same message when the client check is bypassed and the server answers
- [ ] E2E: visual screenshots at the frame size (13009:7876) and responsive screenshots at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal page scroll
- [ ] E2E: runs against the e2e server with data seeded through the harness, and leaves no state for other specs (reset per test)

## Out of scope

- New behaviour (only connects and proves what earlier tickets built)

## Verification

_Filled when done._
