# PROP-Q-007: Which currency are prices in, and can it differ per property?

- **Status:** open
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Every price shows "$" ([13009:7145](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7145), [13009:9932](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-9932)), but Review & Submit shows "$75,00,000" in Indian digit grouping with an Indian address ([13009:11344](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11344)), while the overview shows a Miami address. Money columns are `DECIMAL(12,2)`.

## Options

1. (recommended) One platform currency for now, no currency column; the display currency is a frontend setting. Adding `currency CHAR(3)` later is additive.
2. A currency per property: `properties.currency CHAR(3)` (ISO 4217), used by configurations, amenity plans and other modules.

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/property/db.md](../../../modules/property/db.md)): option 1 (no currency column).
