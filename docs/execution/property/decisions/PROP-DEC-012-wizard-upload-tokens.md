# PROP-DEC-012: The wizard uploads files first and submits signed upload tokens

- **Status:** accepted (user, 2026-10-31)
- **Answers:** PROP-Q-019
- **Tickets:** upload-staging and create-property tickets

## Decision

- `POST /api/properties/uploads` (multipart: one file plus `purpose`, one of `image`, `video`, `tour_360`, `floor_plan`, `document`) checks size and format (magic bytes) for that purpose, uploads the file to Cloudinary as an authenticated asset under the `realestate/<env>/` prefix, and answers 201 `{ uploadToken, fileName, mimeType, sizeBytes, purpose }`.
- The token is signed (HMAC, key derived from the server secret like DEC-029's reset tokens) and holds owner id, purpose, public id, resource type, mime type, size and original file name; it expires after **24 hours**. The client never sends a raw public id.
- `POST /api/properties` (JSON) takes the form data plus tokens in place of files. The service verifies each token (signature, expiry, same owner, purpose fits the slot, each token at most once in the request), then creates the property and every child row in **one transaction**. A token whose file is already referenced by a row is refused (unique public id → 409).
- Files uploaded but never submitted are referenced by no row, so the daily orphan job (DEC-018) deletes them after 24 hours. No staging table.
- Tabs that add one file to an existing property (gallery, floor plan, replace document, update image) use direct single-file multipart routes, not tokens.

## Why

Per-file progress and errors, small requests, one transaction on Submit, and no new table.

## Alternatives rejected

- One multipart Submit: hundreds of MB in memory, no progress, one bad file fails everything.
- Create, then upload: a half-made property when uploads fail; required documents cannot be enforced.
- A staging table: more schema for what a signed token already proves.
