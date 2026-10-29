# Frontend contract pins

Frontend pages were built against SPEC-001 with MSW before their backend existed. Where the spec left a shape open, the page picked one. Backend tickets must return exactly these shapes, or say why not and fix the page in the same commit. Each pin cites the commit the frontend assumed it in.

## Already matched by the backend

- 2026-10-29: sign up `201 { email }`; verify-email `200 { accessToken, user }` (frontend `de79b31`, backend `afe2554`).
- 2026-10-29: login 401 `invalidCredentials` in `error.message`; 403 `EMAIL_NOT_VERIFIED` (frontend `a376148`, backend `33f67a1`).
- 2026-10-29: refresh `200 { accessToken, user }` (frontend baseApi, backend `fca1258`).
- 2026-10-29: password forgot/resend `{ sent: true }`, verify `{ resetToken }` (frontend `00a0396`, backend `de84d66`).
- 2026-10-29: `PUT /api/auth/me/country` → `200 { user }`; 403 `FORBIDDEN` for a non-buyer; 422 `fields.countryCode` (frontend `87081ee`, backend TASK-025).
- 2026-10-29: `PUT /api/auth/me/professional-profile` → `200 { profile }` with `{ id, companyName, developerType, licenseNumber, experienceLevel, location }` (`companyName` null when left out); 422 field errors keyed by schema field names (frontend `ddd7164`, backend TASK-027).
- 2026-10-29: `POST /api/auth/me/documents` multipart, one file part per kind named after the kind plus the text field `idDocumentType` → `201 { verification }` = `{ status, documents: [{ documentKind, status, rejectionReason, fileName, sizeBytes }] }` (the TASK-030 GET shape); field errors at `fields["documents.<kind>.<field>"]` (`file`, `idDocumentType`, `fileName`, `mimeType`, `sizeBytes`); a kind already pending/approved → 409 `CONFLICT` with `documentAlreadySubmitted` in `error.message` and no `fields` (frontend `fda5a94`, backend TASK-028). Also possible: `fields.idDocumentType` (type sent without a Government ID) and `fields._form` (unknown part or field); the page shows both as the form-level message.
- 2026-10-29: `GET /api/auth/me/verification` → `200 { status, documents }`, one entry per **required** kind (2 for Individual, 3 for Company) `{ documentKind, status: null | 'pending' | 'approved' | 'rejected', rejectionReason, fileName, sizeBytes }` from the latest upload of that kind, all null except `documentKind` when nothing was uploaded; 403 `FORBIDDEN` for a non-Developer and for a Developer without Professional info (frontend `fda5a94`, `d285735`; backend TASK-030). `user.developerVerificationStatus` is now the headline for Developers (`under_review` / `active` / `unsuccessful`), `null` otherwise. The `getVerification` comment in `frontend/src/modules/auth/api/authApi.js` still says "assumed until TASK-030" (left for a frontend ticket).

## Waiting for their backend ticket

- 2026-10-29, TASK-024 (frontend `00a0396`): a refused reset token is handled as either 401 or `fields.resetToken`; success lets the page navigate to login with `state: { passwordChanged: true }`.
