# STAFF-020: Code review of the staff diff and fixes

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-001, STAFF-002, STAFF-003, STAFF-004, STAFF-005, STAFF-006, STAFF-007, STAFF-008, STAFF-009, STAFF-010, STAFF-011, STAFF-012, STAFF-013, STAFF-014, STAFF-015, STAFF-016, STAFF-017, STAFF-018, STAFF-019
- **Cites:** CLAUDE.md §Module workflow 8
- **Figma:** none

## What to build

Run `/code-review high` on the whole staff diff against main. Every confirmed finding is fixed test-first, then the suite and e2e are green again.

## Acceptance criteria

- [ ] Review run and its findings listed in Verification (confirmed / rejected with reason)
- [ ] Each confirmed finding has a failing test first, then the fix
- [ ] `/db-design-review staff` run if any table changed since Phase 0 (or noted that none did)
- [ ] `npm run check` passes; `npm run test:e2e` passes

## Out of scope

- Security review (STAFF-021)

## Verification

(filled when done)
