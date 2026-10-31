# PROP-DEC-019: Documents tab: one per type, upload, filters and signed links

- **Status:** accepted (user, 2026-10-31)
- **Answers:** PROP-Q-028
- **Tickets:** documents API and tab tickets

## Decision

- **One document per type**, except `other` (at most **5**). A second one of a type answers 409 CONFLICT (`documents.typeTaken`); a 6th Other answers 409 (`documents.otherMax`). The service checks inside a transaction that locks the property row, so two racing uploads cannot both pass. No DB unique key (Other allows several).
- Submit needs `rera_certificate`, `floor_plan`, `legal_noc` and `ownership_proof` (422 on the missing slot, `documents.required`). `financial_statement` is added only in the tab; `other` is optional.
- Upload Document opens the Replace Document modal design (13009:12013) plus a "Document type" select listing the types that can still be added.
- **No delete**; Replace (PROP-DEC-008) changes a document's file and resets its status to `uploaded`.
- Filters: `status` (uploaded, pending, verified) and `category` (legal, architecture, financial, other; derived from the type, PROP-DEC-008). No pager.
- View and Download: `GET .../documents/:documentId/url?disposition=inline|attachment` returns a signed Cloudinary URL valid **1 hour**.

## Why

The step 5 slots are one per type, and only View, Download and Replace are designed.

## Alternatives rejected

- Several per type with delete: not designed; makes "required" ambiguous.
