# PROP-DEC-008: Property document types, review status and Replace

- **Status:** accepted (user, 2026-10-31, recommended option, provisional: user will review)
- **Answers:** PROP-Q-010
- **Tickets:** none yet

## Decision

- `document_type ENUM('rera_certificate', 'floor_plan', 'legal_noc', 'ownership_proof', 'financial_statement', 'other')` (`PROPERTY_DOCUMENT_TYPES`). The category shown in the Documents tab is derived: RERA, Legal NOC, Ownership Proof -> Legal; Floor Plan -> Architecture; Financial statement -> Financial; Other -> Other.
- `status ENUM('uploaded', 'pending', 'verified')`, default `uploaded` (`PROPERTY_DOCUMENT_STATUSES`). It moves `uploaded` -> `pending` -> `verified` through an Admin review; the reviewer columns are added with that ticket (new migration). The developer never sets the status.
- Replace overwrites the file columns on the same row, queues the old file in `pending_file_deletions` in the same transaction (DEC-018) and resets the status to `uploaded`. No history rows.
- Every slot except Other is required when the property is submitted (service rule).
- Files: PDF/JPG/PNG up to 10 MB, `PROPERTY_FILE_MIME_TYPES` and `LIMITS.property.maxFileBytes`.

## Why

It matches the upload slots of step 5 and the badges of the Documents tab, and keeps one row per document.

## Alternatives rejected

- A free category column chosen by the developer: the category follows from the slot.
- Keeping replaced files as history rows (like auth Resubmission): not designed for properties.
