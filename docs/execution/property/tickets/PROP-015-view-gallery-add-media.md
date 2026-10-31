# PROP-015: View the gallery and add images, videos and tours

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-002, PROP-004, PROP-006
- **Cites:** PROP-SPEC-001 §Endpoints #13–14, PROP-DEC-009, PROP-DEC-018
- **Figma:** none

## What to build

The Overview gallery lists images, videos and 360 tours in upload order. From the upload modal the Developer picks a type and adds a file, up to 30 images, 5 videos and 5 tours.

## Acceptance criteria

- [ ] `GET …/media` returns `{ images, videos, tours }` each in sort order, files with signed URLs
- [ ] `POST …/media` with file and `mediaType` returns 201 and appends at the end of that type
- [ ] Validation: wrong `mediaType` and file rules per type (image JPG/PNG up to 10 MB; video and 360 tour MP4 up to 40 MB) return 422 with the shared message; nothing is uploaded
- [ ] Errors: over the max for the type returns 409 with `propertyMessages.api.mediaMax.<type>`
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- Reordering (out of scope)
- Delete (PROP-016)

## Verification

_Filled when done._
