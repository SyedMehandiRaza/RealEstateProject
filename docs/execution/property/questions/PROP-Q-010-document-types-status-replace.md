# PROP-Q-010: Which property document types and statuses exist, who verifies them, and what does Replace keep?

- **Status:** open
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Add Property step 5 has slots RERA Certificate, Floor Plan, Legal NOC, Ownership Proof and Other (optional) ([13009:11196](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11196)). The Documents tab shows categories Legal, Financial, Architecture and statuses Verified, Pending, Uploaded, with View / Download / Replace ([13009:10202](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10202), [13009:12013](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-12013)). No frame shows who verifies, or whether a replaced file is kept.

## Options

1. (recommended) `document_type` = the five slots plus `financial_statement`; category is derived (RERA, Legal NOC, Ownership Proof -> Legal; Floor Plan -> Architecture; Financial statement -> Financial; Other -> Other). Status `uploaded` -> `pending` -> `verified` is set by an Admin review (reviewer columns added with that ticket). Replace overwrites the file on the same row, queues the old file for deletion and resets the status to `uploaded`. Required: every slot except Other.
2. A free `category` column chosen by the developer, independent of the slot.
3. Replace keeps earlier files (history rows, like auth Resubmission).

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/property/db.md](../../../modules/property/db.md)): option 1 (no reviewer columns yet).
