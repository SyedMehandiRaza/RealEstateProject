# PROP-016: Delete gallery media, keeping the last image

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-015
- **Cites:** PROP-SPEC-001 §Endpoints #15, PROP-DEC-018, DEC-018
- **Figma:** none

## What to build

The Developer removes an image, video or tour from the gallery and its file is queued for deletion. The last remaining image cannot be removed.

## Acceptance criteria

- [ ] `DELETE …/media/:mediaId` returns 204 and queues the file with the right resource type
- [ ] Errors: deleting the only image returns 409 with `propertyMessages.api.mediaLastImage`; two racing deletes of the last two images leave one
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- The page (PROP-029)

## Verification

_Filled when done._
