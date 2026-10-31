# PROP-034: E2E: add a property through the wizard

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-008, PROP-023, PROP-027
- **Cites:** PROP-SPEC-001 §Testing Decisions, PROP-DEC-023
- **Figma:** 13009:10644 to 13009:11599

## What to build

A Developer adds a property end to end through the six steps with real uploads to the e2e server and lands on the new property from the success modal.

## Acceptance criteria

- [ ] Journey: steps 1–6 with configurations, floor plans, images, documents; Submit; success modal; the new property shows on My Properties
- [ ] Journey: leaving mid-wizard asks for confirmation
- [ ] Journey: an under-construction property shows the Update tab with 0%
- [ ] E2E: client and server parity: one invalid submit per form shows the shared constant from the client, and the same message when the client check is bypassed and the server answers
- [ ] E2E: visual screenshots at the frame size (13009:10644 to 13009:11599) and responsive screenshots at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal page scroll
- [ ] E2E: runs against the e2e server with data seeded through the harness, and leaves no state for other specs (reset per test)

## Out of scope

- New behaviour (only connects and proves what earlier tickets built)

## Verification

_Filled when done._
