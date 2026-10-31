# PROP-038: E2E: Documents tab

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-017, PROP-018, PROP-023, PROP-031
- **Cites:** PROP-SPEC-001 §Testing Decisions, PROP-DEC-019
- **Figma:** 13009:10202

## What to build

A Developer filters documents, uploads one, replaces a file and opens a document through its signed link.

## Acceptance criteria

- [ ] Journey: filters, upload of an addable type, replace, view and download
- [ ] E2E: client and server parity: one invalid submit per form shows the shared constant from the client, and the same message when the client check is bypassed and the server answers
- [ ] E2E: visual screenshots at the frame size (13009:10202) and responsive screenshots at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal page scroll
- [ ] E2E: runs against the e2e server with data seeded through the harness, and leaves no state for other specs (reset per test)

## Out of scope

- New behaviour (only connects and proves what earlier tickets built)

## Verification

_Filled when done._
