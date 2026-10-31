# PROP-004: Add signed, expiring delivery URLs to storage

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** None (can start immediately)
- **Cites:** PROP-SPEC-001 §Shared foundations touched, PROP-SPEC-001 §Response and error shapes, PROP-DEC-019, PROP-DEC-022
- **Figma:** none

## What to build

The server can hand out a signed Cloudinary URL for a stored file that expires after 1 hour, inline or as a download with the original file name, without an API call. `createApp` requires the new storage method and the fake storage returns a predictable URL, so every later endpoint can return files as `{ id, fileName, mimeType, sizeBytes, url, urlExpiresAt }`.

## Acceptance criteria

- [ ] `deliveryUrl` returns a signed URL for image, video and raw files with the expiry passed in (from the test clock in tests)
- [ ] `attachment: true` with a file name produces a download URL; the default is inline
- [ ] `createApp` refuses to start when the storage object lacks `deliveryUrl` (dependency check)
- [ ] The fake storage returns a URL that contains the public id and expiry, so tests can assert it
- [ ] Public ids never appear in a response shape built by the shared file presenter (unit test)

## Out of scope

- Endpoints that use it (PROP-009 onwards)

## Verification

_Filled when done._
