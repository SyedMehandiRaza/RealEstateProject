# STAFF-021: Security review of the staff module and fixes

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-020
- **Cites:** .claude/rules/security.md
- **Figma:** none

## What to build

Run `/security-review` on the staff changes: authorization on every route, row-level ownership, mass assignment, enumeration through 404s, personal data in logs, and the e2e-only routes. Confirmed findings are fixed test-first.

## Acceptance criteria

- [ ] Review run and findings listed in Verification
- [ ] Each confirmed finding has a failing test first, then the fix
- [ ] Tests prove: no staff route answers without an Active developer; no response or log contains another developer's data or staff personal data in logs; e2e seed routes are absent from the regular app
- [ ] `npm run check` passes; `npm run test:e2e` passes

## Out of scope

- Auth module findings (reported, not fixed here)

## Verification

(filled when done)
