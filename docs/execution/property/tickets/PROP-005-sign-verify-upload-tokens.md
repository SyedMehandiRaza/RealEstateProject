# PROP-005: Sign and verify property upload tokens

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** None (can start immediately)
- **Cites:** PROP-SPEC-001 §Upload tokens, PROP-DEC-012, DEC-029
- **Figma:** none

## What to build

Wizard uploads are identified by a signed token that only the uploading Developer can use, for one purpose, within 24 hours. This ticket builds the pure signer and verifier with an HMAC key derived from the access secret under a property label.

## Acceptance criteria

- [ ] A signed token verifies and returns owner id, purpose, public id, resource type, mime type, size, file name and expiry
- [ ] A tampered payload or signature fails verification
- [ ] A token past 24 h (test clock) fails; one just inside 24 h passes
- [ ] A token used by a different owner or for a different purpose fails
- [ ] The derived key never equals `JWT_ACCESS_SECRET` (unit test)

## Out of scope

- The upload endpoint (PROP-007)
- Using tokens on Submit (PROP-008)

## Verification

_Filled when done._
