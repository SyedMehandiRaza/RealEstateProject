# PROP-041: Code review the property diff against main

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-034, PROP-035, PROP-036, PROP-037, PROP-038, PROP-039, PROP-040
- **Cites:** PROP-SPEC-001
- **Figma:** none

## What to build

Run `/code-review high` on the whole property diff against main and `/db-design-review property` for tables changed since Phase 0. Confirmed findings are fixed test-first; the rest are recorded with a reason.

## Acceptance criteria

- [ ] Every confirmed finding has a failing test first, then a fix; `npm run check` passes
- [ ] Unconfirmed or declined findings are listed in Verification with the reason
- [ ] `npm run test:e2e` passes after the fixes

## Out of scope

- Security review (PROP-042)

## Verification

_Filled when done._
