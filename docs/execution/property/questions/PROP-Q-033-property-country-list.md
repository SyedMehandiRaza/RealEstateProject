# PROP-Q-033: Which countries can a property be in?

- **Status:** answered (2026-10-31)
- **Blocks:** nothing
- **Asked by:** /to-spec for PROP-SPEC-001, 2026-10-31

## Context

PROP-DEC-004 stores `country_code` as ISO 3166-1 alpha-2 and the Country field of step 1 ([13009:10644](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10644)) is a dropdown. The auth module's `COUNTRY_CODES` has only AE, SG, US and GB (the Select Country page), but the Figma sample property is in India ("Arera Colony, Bhopal").

## Options

1. (assumed) A separate `PROPERTY_COUNTRY_CODES` list in shared: the four auth countries plus India (`IN`), shown with their names in the dropdown. Adding a country later is one line in shared, no migration (the column only checks the format).
2. Every ISO 3166-1 country (about 249), searchable.
3. Reuse `COUNTRY_CODES` (AE, SG, US, GB): the Figma sample could not be entered.

## Answer

User, 2026-10-31: "ok keep as you want for now. For all of my project I will be needing country, city and all in tables." Option 1 stays for now (AE, GB, IN, SG, US; state and city free text).

Later, for the whole project (not only property): countries, states and cities become lookup tables. That is a cross-module change (auth's `users.preferred_country_code`, `properties.country_code` / `state` / `city`, and any later module), so it belongs to the integration owner as a project decision in `docs/DECISIONS.md` with its own migration and data backfill; it is not built in PROP-SPEC-001. Until then, property keeps the ISO code and the text columns so the move is a plain data migration (match the text to the new rows, then add the FK).
