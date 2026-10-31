# PROP-001: Add property test factories and fixtures

- **Status:** done (2026-10-31)
- **Module:** property
- **Blocked by:** None (can start immediately)
- **Cites:** PROP-SPEC-001 §Testing Decisions, PROP-DEC-002, PROP-DEC-004
- **Figma:** none

## What to build

Tests can create a complete property for a Developer in one call: the property row with features, configurations with floor plans, media, documents, construction progress, updates and amenities with plans, each overridable. The factories write through the existing models, so they also prove the models and their associations match the migrated tables. Nothing user-facing changes.

## Acceptance criteria

- [x] A factory creates a ready-to-move property with its required children (1 configuration, 1 image, the 4 required documents) for a given owner, and every row is readable back through the models
- [x] A factory option creates an under-construction property with its progress row (0%) and a possession date
- [x] Each child factory (configuration, floor plan, media, document, update, amenity with plans) accepts overrides and defaults to valid values that pass the shared schemas
- [x] Deleting a property through the model cascades to every child table (PROP-DEC-002), proved by counting rows
- [x] Factories create a Developer account in each state needed later: Active, not Active, and a Buyer

## Out of scope

- API routes (PROP-006 onwards)
- E2E seeding (PROP-023)

## Verification

- Factories: `backend/src/test/propertyFactories.js` (`seedDeveloper`, `createProperty` and one factory per child table). Defaults are the `valid` inputs of the shared parity cases.
- Tests: `backend/src/test/__tests__/propertyFactories.int.test.js`, 8 tests. Each case is proved through the models against `real_estate_property_test`: the required children, progress for under construction, counts with unique names and public ids, child overrides and defaults that the shared schemas accept, the cascade on delete, and the three account states, checked by logging in and reading the verification status.
- `npm run check`: shared 687, backend unit 454, backend integration 315 passed + 1 skipped, frontend 276; lint, format and build pass (only the existing Vite chunk-size warning).
