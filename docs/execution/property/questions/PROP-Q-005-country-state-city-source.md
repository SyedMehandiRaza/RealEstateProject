# PROP-Q-005: Where do the Country, State and City lists come from?

- **Status:** answered (2026-10-31, recommended option, confirmed final by the user in the grill, 2026-10-31)
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Country, State and City are "Select" dropdowns in Add Property step 1 ([13009:10644](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10644)); the detail page shows "State/county". The lists themselves are not designed. Auth stores a country as an ISO 3166-1 alpha-2 code (DEC-012).

## Options

1. (recommended) `country_code CHAR(2)` (ISO, same as DEC-012); `state` and `city` as text (max 100) picked from a static list kept in `shared/` (or typed when the list has no entry). No lookup tables.
2. Lookup tables `countries`, `states`, `cities` seeded from a dataset, with FKs from properties. More rows to maintain, but strict values.
3. Fill state and city from the map pin (reverse geocoding), read-only.

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1. `country_code CHAR(2)` (ISO 3166-1 alpha-2, DEC-012); `state` and `city` as text (max 100), picked from a static list in `shared/` or typed. No lookup tables.

Decision: [PROP-DEC-004](../decisions/PROP-DEC-004-listing-status-location-area-currency.md).
