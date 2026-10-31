# Staff: status

Last updated: 2026-10-31

## Now

- Phase 2 (contract) done, waiting for the user's approval of the endpoints and pages: [STAFF-SPEC-001](specs/STAFF-SPEC-001-staff-management.md) (9 endpoints, 4 routes, states, responsive rule). Shared: `staff.messages.js`, `staff.schema.js` (`staffMemberSchema`, `staffStatusSchema`, `assignPropertySchema`, `staffListQuerySchema`, `staffPropertyParamsSchema`), parity cases `staffValidationCases.js` (`@real-estate/shared/testing`), `LIMITS.staff.listPageSize = 10`; 59 schema tests. No new error code.
- Phase 1 (align) done 2026-10-31: STAFF-Q-001 to STAFF-Q-022 answered, STAFF-Q-014 deferred to the integration owner; decisions STAFF-DEC-001 to STAFF-DEC-018; module spec in [docs/modules/staff/README.md](../../modules/staff/README.md). No table changed.
- Database: `20261030212742-create-staff-tables.cjs` migrated on this folder's `real_estate_staff` and `real_estate_staff_test`; not merged.
- `npm run check` green (2026-10-31): shared 274, backend unit 454, backend integration 307 + 1 skipped, frontend 276; lint, format, build.

## Next actions

- User approves the endpoints and pages; then Phase 3: `/to-tickets` (ticket list shown for approval before the files are written).

## Blockers

- STAFF-Q-023 (open): property cover image URL; the cards show a placeholder until it is answered. Blocks only the cover-image ticket.
- The staff login ticket will stay blocked by STAFF-Q-014 (deferred to the integration owner); the rest is records only (STAFF-DEC-007).
