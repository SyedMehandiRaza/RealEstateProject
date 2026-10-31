# PROP-020: List, post and delete construction updates

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-004, PROP-019
- **Cites:** PROP-SPEC-001 §Endpoints #22–24, PROP-DEC-011, PROP-DEC-021
- **Figma:** none

## What to build

The Developer posts construction updates with a title, description and optional JPG/PNG image, sees them newest first 10 at a time with Show more, and deletes one (its image is queued).

## Acceptance criteria

- [ ] `GET …/updates` returns newest first, 10 per page with meta
- [ ] `POST …/updates` (multipart) returns 201 with the update and its image URL; without image `image` is `null`
- [ ] `DELETE …/updates/:updateId` returns 204 and queues the image when there is one
- [ ] Validation parity: every invalid case of `createUpdateCases` from `@real-estate/shared/testing` posted to the API returns 422 `VALIDATION_ERROR` with the same message at the same dotted path; an image that is not JPG/PNG returns 422 at `image`
- [ ] Errors: list and post on a ready-to-move property return 409 with `propertyMessages.api.notUnderConstruction`
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- Editing updates (out of scope)
- The tab (PROP-032)

## Verification

_Filled when done._
