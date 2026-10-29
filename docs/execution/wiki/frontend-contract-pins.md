# Frontend contract pins

Frontend pages were built against SPEC-001 with MSW before their backend existed. Where the spec left a shape open, the page picked one. Backend tickets must return exactly these shapes, or say why not and fix the page in the same commit. Each pin cites the commit the frontend assumed it in.

## Already matched by the backend

- 2026-10-29: sign up `201 { email }`; verify-email `200 { accessToken, user }` (frontend `de79b31`, backend `afe2554`).
- 2026-10-29: login 401 `invalidCredentials` in `error.message`; 403 `EMAIL_NOT_VERIFIED` (frontend `a376148`, backend `33f67a1`).
- 2026-10-29: refresh `200 { accessToken, user }` (frontend baseApi, backend `fca1258`).
- 2026-10-29: password forgot/resend `{ sent: true }`, verify `{ resetToken }` (frontend `00a0396`, backend `de84d66`).
- 2026-10-29: `PUT /api/auth/me/country` → `200 { user }`; 403 `FORBIDDEN` for a non-buyer; 422 `fields.countryCode` (frontend `87081ee`, backend TASK-025).

## Waiting for their backend ticket

- 2026-10-29, TASK-024 (frontend `00a0396`): a refused reset token is handled as either 401 or `fields.resetToken`; success lets the page navigate to login with `state: { passwordChanged: true }`.
- 2026-10-29, TASK-027 (frontend `ddd7164`): `PUT /api/auth/me/professional-profile` → `200 { profile }`; an empty Company Name is omitted from the body; 422 field errors keyed by schema field names.
- 2026-10-29, TASK-028 (frontend `fda5a94`): `POST /api/auth/me/documents` multipart. One file part per kind, **named after the kind**: `government_id`, `company_registration_certificate`, `profile_photo`; plus a text field `idDocumentType`. Success `201 { verification }` (same shape as the GET below). Field errors as `fields["documents.<kind>.<field>"]` (Q-036); a kind already pending/approved → 409.
- 2026-10-29, TASK-030 (frontend `fda5a94`): `GET /api/auth/me/verification` returns a `documents` list with one entry per **required** kind (2 for Individual, 3 for Company): `{ documentKind, status: null | 'pending' | 'approved' | 'rejected', rejectionReason, fileName, sizeBytes }` (latest upload of that kind; `fileName`/`sizeBytes` from `original_filename`/`size_bytes`, all null except `documentKind` when nothing was uploaded). Extended 2026-10-29 for the status cards (frontend `d285735`, accepted by the coordinator; db.md lists those columns for these screens). The Upload page derives the developer type from this list.
