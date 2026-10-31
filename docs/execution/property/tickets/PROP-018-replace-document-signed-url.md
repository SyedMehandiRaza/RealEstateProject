# PROP-018: Replace a document file and open its signed URL

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-017
- **Cites:** PROP-SPEC-001 §Endpoints #18–19, PROP-DEC-008, PROP-DEC-019
- **Figma:** none

## What to build

The Developer replaces a document's file (status goes back to uploaded, the old file is queued) and opens or downloads a document through a signed link valid for 1 hour.

## Acceptance criteria

- [ ] `PUT …/documents/:documentId/file` returns 200 with status `uploaded`; the old file is queued with reason `replaced`
- [ ] `GET …/documents/:documentId/url` returns `{ url, expiresAt }` 1 hour ahead; `disposition=attachment` gives a download URL with the file name
- [ ] Validation: file rules and a bad `disposition` return 422 with the shared message
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- The tab (PROP-031)

## Verification

_Filled when done._
