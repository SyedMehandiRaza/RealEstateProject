# PROP-042: Security review the property diff

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-041
- **Cites:** PROP-SPEC-001, PROP-DEC-011, PROP-DEC-012
- **Figma:** none

## What to build

Run `/security-review` on the property diff: access and ownership on every route, upload validation and tokens, signed URLs, search escaping, rate limits. Confirmed findings are fixed test-first.

## Acceptance criteria

- [ ] Every confirmed finding has a failing test first, then a fix; `npm run check` and `npm run test:e2e` pass
- [ ] Findings and their outcome are listed in Verification

## Out of scope

- Merging (the user says when)

## Verification

_Filled when done._
