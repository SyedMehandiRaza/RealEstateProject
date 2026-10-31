# PROP-007: Stage wizard uploads and return upload tokens

- **Status:** done (2026-10-31)
- **Module:** property
- **Blocked by:** PROP-002, PROP-004, PROP-005, PROP-006
- **Cites:** PROP-SPEC-001 §Endpoints #1, PROP-SPEC-001 §Upload tokens, PROP-DEC-009, PROP-DEC-012, PROP-Q-019
- **Figma:** none

## What to build

While filling the wizard, a Developer uploads each image, video, 360 tour, floor plan and document as soon as it is chosen, and gets back an upload token that the final Submit sends instead of the file. Files go to the owner's staging folder. Uploads are limited to 200 per hour per account.

## Acceptance criteria

- [x] `POST /api/properties/uploads` with a valid file and purpose returns 201 with `{ upload: { uploadToken, purpose, fileName, mimeType, sizeBytes } }` and the file is in fake storage under the staging folder
- [x] Validation: missing file, empty file, too big (10 MB, 40 MB for video), wrong format for the purpose (magic bytes, not the extension), file name over 255 and unknown purpose each return 422 at `file` / `purpose` with the shared `propertyMessages.file.*` message, and nothing is uploaded
- [x] Errors: an unreadable multipart body returns 400 `BAD_REQUEST`
- [x] Errors: the 201st upload in an hour for one account returns 429 `TOO_MANY_REQUESTS`; another account is not affected
- [x] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`

## Out of scope

- Submit (PROP-008)
- Tab uploads, which post files directly (PROP-014, PROP-015, PROP-017, PROP-020)

## Verification

- `POST /api/properties/uploads`: route → per-account limiter → `propertyUpload` (multipart reader shared by every property file route) → controller → `service.stageUpload`. The file goes to `properties/<owner>/staging` through the injected storage, and the response carries an upload token (PROP-005).
- `propertyUpload`: one `file` part plus text fields checked by a shared schema; the file is checked with the shared `propertyFileSchema` using the type sniffed from its bytes (PDF/PNG/JPEG as in auth, plus MP4). Errors: `file`, the field name, or `_form` (unknown parts), all 422; an unreadable body is 400. A declared body over 40 MB + 64 KiB is refused before it is read.
- `propertyUploadRateLimiter` (200 per hour per account) is added to the shared `middlewares/rateLimiter.js` (additive). Later property file routes reuse it.
- Test helpers: an MP4 signature in `test/documentFiles.js` (additive). PROP-006's probe test now adds its probe routes to the real module router.
- Tests: `backend/src/modules/property/__tests__/stageUpload.int.test.js`, 24 tests: 6 purposes and types staged with a token that reads back; 11 validation cases with the exact shared message and nothing uploaded; a video over 40 MB; a second file part; an unreadable body (400); the 201st upload in an hour (429) while another account is unaffected; 401, 403 and 403 `DEVELOPER_NOT_ACTIVE` with nothing uploaded.
- `npm run check`: shared 687, backend unit 473, backend integration 357 passed + 1 skipped, frontend 276; lint, format and build pass.
