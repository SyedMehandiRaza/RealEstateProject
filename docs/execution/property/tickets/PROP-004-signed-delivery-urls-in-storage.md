# PROP-004: Add signed, expiring delivery URLs to storage

- **Status:** done (2026-10-31)
- **Module:** property
- **Blocked by:** None (can start immediately)
- **Cites:** PROP-SPEC-001 §Shared foundations touched, PROP-SPEC-001 §Response and error shapes, PROP-DEC-019, PROP-DEC-022
- **Figma:** none

## What to build

The server can hand out a signed Cloudinary URL for a stored file that expires after 1 hour, inline or as a download with the original file name, without an API call. `createApp` requires the new storage method and the fake storage returns a predictable URL, so every later endpoint can return files as `{ id, fileName, mimeType, sizeBytes, url, urlExpiresAt }`.

## Acceptance criteria

- [x] `deliveryUrl` returns a signed URL for image, video and raw files with the expiry passed in (from the test clock in tests)
- [x] `attachment: true` produces a download URL; the default is inline (see Verification about the file name)
- [x] `createApp` refuses to start when the storage object lacks `deliveryUrl` (dependency check)
- [x] The fake storage returns a URL that contains the public id and expiry, so tests can assert it
- [x] Public ids never appear in a response shape built by the shared file presenter (unit test)

## Out of scope

- Endpoints that use it (PROP-009 onwards)

## Verification

- `cloudinaryStorage.deliveryUrl({ publicId, resourceType, deliveryType, mimeType, expiresAt, attachment })` uses Cloudinary's `private_download_url`, signed with the API secret and computed locally. It works for `authenticated` files, `expires_at` comes from the caller (the test clock in tests), the format comes from the MIME type, and raw files keep their extension in the public id. It refuses public ids outside the app prefix.
- Difference from the spec: the spec's `fileName` parameter was dropped. Cloudinary's private download URL cannot set a download file name, so a downloaded file is named after its public id. The API still returns `fileName` so the UI can show it.
- `presentFile(row, { storage, now, attachment })` in the files module returns `{ id, fileName, mimeType, sizeBytes, url, urlExpiresAt }` with a 1 hour URL (`FILE_URL_TTL_MS`) and no public id field.
- `createApp` storage dependencies now include `deliveryUrl`; the fake storage returns `https://files.test/<type>/<publicId>?expires=<epoch>&disposition=inline|attachment`.
- Tests: `backend/src/modules/files/__tests__/deliveryUrl.test.js`, 7 tests (real adapter: host, path and params, attachment, raw, a signature that depends on the expiry, prefix guard; fake; presenter); `app.test.js` +1 (storage without `deliveryUrl` is refused).
- `npm run check`: shared 687, backend unit 464, backend integration 322 passed + 1 skipped, frontend 276; lint, format and build pass.
