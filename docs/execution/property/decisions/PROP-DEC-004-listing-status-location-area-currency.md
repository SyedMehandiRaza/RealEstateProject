# PROP-DEC-004: Property status, location, total area unit and currency

- **Status:** accepted (user, 2026-10-31, recommended options, provisional: user will review)
- **Answers:** PROP-Q-004, PROP-Q-005, PROP-Q-006, PROP-Q-007
- **Tickets:** none yet

## Decision

- **Status** (PROP-Q-004): `properties.property_status ENUM('ready_to_move', 'under_construction')`, `PROPERTY_STATUSES` in `shared/src/enums/property.enums.js`. `under_construction` unlocks construction progress and updates.
- **Location** (PROP-Q-005): `country_code CHAR(2)`, ISO 3166-1 alpha-2 in upper case (DEC-012, CHECK `^[A-Z]{2}$`); `state` and `city` are text (`VARCHAR(100)`, `LIMITS.property.state` / `city`), picked from a static list kept in `shared/` or typed when the list has no entry. No lookup tables.
- **Total area** (PROP-Q-006): `total_area DECIMAL(12,2)` (> 0) plus `total_area_unit ENUM('sq_ft', 'acre')` (`AREA_UNITS`). Add Property step 2 gets a unit dropdown (design change). Configuration areas stay in square feet (`area_sqft`).
- **Currency** (PROP-Q-007): one platform currency, no currency column. Money columns are `DECIMAL(12,2)`. The display currency is a frontend setting.

## Why

These are the values visible in Figma. Each is cheap to extend later: a new ENUM value or a new `currency CHAR(3)` column is an additive migration plus the shared enum.

## Alternatives rejected

- More status values or area units: none is designed; the user can list them.
- Country/state/city lookup tables, or reverse geocoding from the pin: more data to maintain, not needed yet.
- A currency per property: no frame shows a currency choice.
