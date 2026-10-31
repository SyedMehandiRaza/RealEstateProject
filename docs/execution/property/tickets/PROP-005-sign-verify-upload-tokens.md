# PROP-005: Sign and verify property upload tokens

- **Status:** done (2026-10-31)
- **Module:** property
- **Blocked by:** None (can start immediately)
- **Cites:** PROP-SPEC-001 §Upload tokens, PROP-DEC-012, DEC-029
- **Figma:** none

## What to build

Wizard uploads are identified by a signed token that only the uploading Developer can use, for one purpose, within 24 hours. This ticket builds the pure signer and verifier with an HMAC key derived from the access secret under a property label.

## Acceptance criteria

- [x] A signed token verifies and returns owner id, purpose, public id, resource type, mime type, size, file name and expiry
- [x] A tampered payload or signature fails verification
- [x] A token past 24 h (test clock) fails; one just inside 24 h passes
- [x] A token used by a different owner or for a different purpose fails
- [x] The derived key never equals `JWT_ACCESS_SECRET` (unit test)

## Out of scope

- The upload endpoint (PROP-007)
- Using tokens on Submit (PROP-008)

## Verification

- `createUploadTokens({ parentSecret, clock })` in the property module: `issue(upload)` and `read(token, { ownerId, purposes })`; TTL 24 h (`UPLOAD_TOKEN_TTL_MS`).
- Difference from the spec's wording ("HMAC-SHA256"): the token is AES-256-GCM ciphertext. GCM's tag is tamper-proof like an HMAC, and the encryption also hides the public id and file details from the client, which keeps the spec's rule that public ids never leave the server. A plain signed token would expose them. The key comes from `JWT_ACCESS_SECRET` via HKDF under the label `real-estate/property-upload-token/v1` (as DEC-029), so it never equals the secret; tokens made with another secret are refused.
- Tests: `backend/src/modules/property/__tests__/uploadToken.test.js`, 9 tests: round trip and 24 h expiry; token length within `LIMITS.property.uploadToken.max`; nothing readable in the token; a tampered iv, ciphertext or tag is refused; the expiry boundary; another owner or purpose is refused; another secret, an access JWT and junk are refused; each token is unique.
- `npm run check`: shared 687, backend unit 473, backend integration 322 passed + 1 skipped, frontend 276; lint, format and build pass.
