# PROP-DEC-011: Only the owning Active developer uses the property API; update images are JPG/PNG

- **Status:** accepted (user, 2026-10-31)
- **Answers:** PROP-Q-018, PROP-Q-017
- **Tickets:** every property API ticket

## Decision

- Every `/api/properties` route runs `authenticate`, then the auth module's `requireActiveDeveloper` (DEC-035): no token 401; no Developer role 403 `FORBIDDEN`; a Developer who is not Active 403 `DEVELOPER_NOT_ACTIVE`.
- The service loads a property only with `owner_id = req.user.id`. A property of another owner, or one that does not exist, answers **404 NOT_FOUND** (the same answer, so ids cannot be probed). Every child route (configurations, media, documents, updates, amenities) checks the parent property this way first, and the child id must belong to that property, otherwise 404.
- Buyers and Admins have no property route yet (buyer search and the Admin document review are later work).
- Staff access is not built here ([PROP-Q-022](../questions/PROP-Q-022-staff-access-to-properties.md)).
- Update image (PROP-Q-017): `image/jpeg` and `image/png` only, up to 10 MB. The column ENUM stays wider; the API never stores a PDF.

## Why

404 for foreign ids avoids leaking which ids exist. The guard already exists and is tested.

## Alternatives rejected

- 403 for another owner's property: tells the caller the id exists.
- Read access for every Developer: no screen needs it.
