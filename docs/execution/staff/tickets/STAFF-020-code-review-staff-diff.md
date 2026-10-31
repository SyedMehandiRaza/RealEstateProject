# STAFF-020: Code review of the staff diff and fixes

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-001, STAFF-002, STAFF-003, STAFF-004, STAFF-005, STAFF-006, STAFF-007, STAFF-008, STAFF-009, STAFF-010, STAFF-011, STAFF-012, STAFF-013, STAFF-014, STAFF-015, STAFF-016, STAFF-017, STAFF-018, STAFF-019
- **Cites:** CLAUDE.md §Module workflow 8
- **Figma:** none

## What to build

Run `/code-review high` on the whole staff diff against main. Every confirmed finding is fixed test-first, then the suite and e2e are green again.

## Acceptance criteria

- [x] Review run and its findings listed in Verification (confirmed / rejected with reason)
- [x] Each confirmed finding has a failing test first, then the fix
- [x] `/db-design-review staff` run if any table changed since Phase 0 (or noted that none did)
- [x] `npm run check` passes; `npm run test:e2e` passes

## Out of scope

- Security review (STAFF-021)

## Verification

- `/code-review high` on `feature/staff` against `main` (2026-10-31): 10 findings.
- Confirmed and fixed test-first (red, then green):
  1. List page not brought back after a removal empties it → the page goes back to the last page (`StaffListPage.test.jsx` "goes back to the last page…").
  2. Unassign double click sent two DELETEs → button disabled while in flight (`AssignProperty.test.jsx` "disables Unassign…").
  3. `removeStaff` left the member's Detail in the cache → also invalidates `{ Staff, id }` (`StaffDetailModal.test.jsx` "does not show a removed member from the cache").
  4. A failed page change showed the previous page's rows → the list renders `currentData` (`StaffListPage.test.jsx` "shows no rows from the previous page…").
  5. A property deleted between the ownership check and the insert gave 500 → `ForeignKeyConstraintError` maps to 404 `propertyNotFound` (new unit test `backend/src/modules/staff/__tests__/staff.service.test.js`).
- Confirmed and refactored (covered by the existing tests): 8. picker and card share `PropertySummary` / `PropertyStatusBadge` (the picker now wraps text and moves the badge below on phones; its 5 baselines regenerated after viewing them); 9. one `mappingConstraintErrors` helper and one permission insert; 10. assignable properties in one LEFT JOIN … IS NULL query (parameterized, no string SQL).
- Not changed: 2. the `PUBLIC_AUTH_PATHS` removal in `baseApi.js` is an auth change (TASK-049, DEC-028) carried by this branch, not staff code; reported to the user. 6. Staff routes check the Developer role only: by design (STAFF-SPEC-001 §Pages: a non-Active developer gets the API's 403 in the error state).
- `/db-design-review`: not needed, no migration or model changed since Phase 0 (`git diff 3d2ac31 HEAD -- backend/src/migrations backend/src/models` is empty).
- `npm run check`: shared 274, backend unit 456, backend integration 462 + 1 skipped, frontend 341; lint, format, build green. Staff e2e 34 / 34.
