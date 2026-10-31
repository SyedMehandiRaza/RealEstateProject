# PROP-007: Stage wizard uploads and return upload tokens

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-002, PROP-004, PROP-005, PROP-006
- **Cites:** PROP-SPEC-001 §Endpoints #1, PROP-SPEC-001 §Upload tokens, PROP-DEC-009, PROP-DEC-012, PROP-Q-019
- **Figma:** none

## What to build

While filling the wizard, a Developer uploads each image, video, 360 tour, floor plan and document as soon as it is chosen, and gets back an upload token that the final Submit sends instead of the file. Files go to the owner's staging folder. Uploads are limited to 200 per hour per account.

## Acceptance criteria

- [ ] `POST /api/properties/uploads` with a valid file and purpose returns 201 with `{ upload: { uploadToken, purpose, fileName, mimeType, sizeBytes } }` and the file is in fake storage under the staging folder
- [ ] Validation: missing file, empty file, too big (10 MB, 40 MB for video), wrong format for the purpose (magic bytes, not the extension), file name over 255 and unknown purpose each return 422 at `file` / `purpose` with the shared `propertyMessages.file.*` message, and nothing is uploaded
- [ ] Errors: an unreadable multipart body returns 400 `BAD_REQUEST`
- [ ] Errors: the 201st upload in an hour for one account returns 429 `TOO_MANY_REQUESTS`; another account is not affected
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`

## Out of scope

- Submit (PROP-008)
- Tab uploads, which post files directly (PROP-014, PROP-015, PROP-017, PROP-020)

## Verification

_Filled when done._
