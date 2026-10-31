# PROP-023: Seed properties through the e2e harness

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-001
- **Cites:** PROP-SPEC-001 §Shared foundations touched, DEC-036
- **Figma:** none

## What to build

Playwright specs can create complete properties for a seeded account in one call to a test-only harness route, so each journey starts from known data.

## Acceptance criteria

- [ ] `POST /api/__e2e/seed/properties` creates the requested properties (status, counts of configurations, media, documents, updates, amenities) for an account and returns their ids
- [ ] The route exists only in e2e mode; in the normal app it returns 404
- [ ] The harness reset removes seeded properties

## Out of scope

- The specs themselves (PROP-034 onwards)

## Verification

_Filled when done._
