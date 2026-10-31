# STAFF-001: Add staff test fixtures and factories

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** None (can start immediately)
- **Cites:** STAFF-SPEC-001 §Testing Decisions; db.md
- **Figma:** none

## What to build

Tests need ready-made data: an Active developer (and a Developer under review and a Buyer), staff members with permissions, and properties owned by a given developer with an optional image. This ticket adds small factories for the backend integration tests over the existing staff and property models, and checks that the staff models, their associations and the migrated tables agree.

## Acceptance criteria

- [x] A factory creates an Active developer (verified email, Professional info, every required document approved) and returns the account and a signed access token; variants give a Developer under review and a Buyer
- [x] A factory creates a staff member for an employer with given fields, status and permission areas, and another links properties to it
- [x] A factory creates a minimal valid property owned by a given developer (every NOT NULL column and CHECK satisfied), optionally with an image row
- [x] An integration test proves the associations: a staff member loads its permissions and assigned properties; deleting it removes its permission and assignment rows (CASCADE); deleting a property removes its assignments
- [x] An integration test proves the DB rules: duplicate (employer, email) is refused by `uq_staff_members_employer_id_email`; uppercase email and a non-E.164 phone are refused by the CHECKs
- [x] The factories refuse to run against a database whose name does not end in `_test` (they use the existing test DB guard)
- [x] `npm run check` passes

## Out of scope

- Any endpoint (STAFF-002 onwards)
- E2E seeds (STAFF-016)

## Verification

- Test-first: `staffFactories.int.test.js` was red (module missing), then green.
- `backend/src/modules/staff/__tests__/staffFactories.int.test.js`: 10 tests (factories; CASCADE from staff member and from property; unique email per employer; the three CHECKs; RESTRICT on the employer). Factories: `backend/src/test/staffFactories.js` (`activeDeveloper`, `developerUnderReview`, `buyerAccount`, `createStaffMember`, `createProperty`, `assignProperties`), built on `seedAccount`; the `_test` guard is the existing integration setup.
- `npm run check`: shared 274, backend unit 454, backend integration 317 + 1 skipped, frontend 276; lint, format, build green.
