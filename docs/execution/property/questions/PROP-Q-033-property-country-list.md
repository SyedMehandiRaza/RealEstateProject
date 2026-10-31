# PROP-Q-033: Which countries can a property be in?

- **Status:** assumed (2026-10-31)
- **Blocks:** nothing (assumption in force, reversible)
- **Asked by:** /to-spec for PROP-SPEC-001, 2026-10-31

## Context

PROP-DEC-004 stores `country_code` as ISO 3166-1 alpha-2 and the Country field of step 1 ([13009:10644](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10644)) is a dropdown. The auth module's `COUNTRY_CODES` has only AE, SG, US and GB (the Select Country page), but the Figma sample property is in India ("Arera Colony, Bhopal").

## Options

1. (assumed) A separate `PROPERTY_COUNTRY_CODES` list in shared: the four auth countries plus India (`IN`), shown with their names in the dropdown. Adding a country later is one line in shared, no migration (the column only checks the format).
2. Every ISO 3166-1 country (about 249), searchable.
3. Reuse `COUNTRY_CODES` (AE, SG, US, GB): the Figma sample could not be entered.

## Answer

Assumed option 1 on 2026-10-31 so the contract can be written; reversible without a migration. To confirm with the user at the Phase 2 stop.
