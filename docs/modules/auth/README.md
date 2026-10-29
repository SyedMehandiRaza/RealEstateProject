# Auth

Status: **Discovery.** DB draft written (2026-10-28) before the grill; this spec is a stub until `/grill-with-docs` runs.

## Purpose and users

Sign up, verify email, log in, recover a password, and onboard professionals. Users (confirmed 2026-10-29, DEC-017): **buyers** (buy properties) and **developers** (property owners). Agents are in Figma but **deferred**. One account (one email) can be both buyer and developer (DEC-019); admins who review professional documents (ASSUMED, Q-016).

## Scope

### In scope (from Figma, to confirm)

- Sign up per role, email verification by 6-digit code, log in by email + password (phone is a contact field only, DEC-022), forgot/reset password by emailed code
- Buyer: choose a country after verification
- Developer: professional information, document upload, review status (pending, approved, rejected with reason), resubmission

### Out of scope (until decided)

- Agent role and its screens (DEC-017), Google/Apple sign-in (shown in Figma, Q-012), phone OTP, admin review UI, "View plan" (subscriptions)

## User workflows

1. Buyer: Sign Up → Verify → Select a Country
2. Developer: Sign Up → Verify → Professional info → Upload documents (Government ID, Company Registration Certificate, Profile Photo) → Pending → Approved / Reject → Resubmit
3. (Deferred) Agent: same as developer without the company certificate
4. Log in → Forgot Password → Verify → Reset password

## Business rules

- Confirmed: uploaded documents are stored in Cloudinary as authenticated (non-public) assets (DEC-016).
- Confirmed: a new user must verify their email address; the backend sends codes over SMTP (Gmail) with settings from env vars only; the same flow serves password reset.
- Everything else: see `db.md` (ASSUMED items) and `docs/execution/QUESTIONS.md` Q-007 to Q-029.

## Data

- Tables: `users`, `refresh_tokens`, `verification_codes`, `professional_profiles`, `verification_documents`. Details: `db.md`.
- Sensitive data: government ID files and photos, contact details, credentials. Retention: `db.md`.

## Interfaces

- API contract: `docs/execution/specs/SPEC-001-auth-api.md` (ready-for-agent). Validation: shared auth schemas (see `db.md`). `POST /api/auth/refresh` returns `{ data: { accessToken, user } }`, the contract `baseApi` already uses (built in TASK-022).
- Built (TASK-019 to TASK-023, 2026-10-29), every public route behind its group's per-IP limiter (20 per 15 min each, TASK-050, DEC-039: sign-up/verify-email/resend, login, password forgot/resend/verify/reset):
  - POST `/api/auth/sign-up` (`signUpSchema`): 201 `{ email }` (lowercase). Account, first role and first `email_verification` code in one transaction; the code is mailed after commit. Taken email → 409 `CONFLICT` with `fields.email = [emailTaken]`. A failed send still answers 201 and logs only the Account id and purpose (Q-037).
  - POST `/api/auth/verify-email` (`verifyCodeSchema`): 200 `{ accessToken, user }` plus the `refresh_token` cookie. Wrong, expired, used, older or unknown-email code → 422 `fields.code = [codeInvalid]`; from the 5th wrong guess → `[codeTooManyAttempts]`.
  - POST `/api/auth/verify-email/resend` (`resendCodeSchema`, TASK-020, DEC-026): 200 `{ sent: true }`, a new `email_verification` code mailed and older codes cancelled. One code per 60 s and 5 per hour per purpose (the sign-up code counts): 429 `TOO_MANY_REQUESTS` with `resendTooSoon(n)` or `resendLimit`. Unknown or already-verified email → the same 200 body, no email.
  - POST `/api/auth/login` (`loginSchema`, TASK-021, DEC-027): 200 `{ accessToken, user }` plus the `refresh_token` cookie. Wrong password, unknown email (compared with a dummy hash) or a hit per-account limit (10 failed logins per email per rolling 15 min, in memory, reset on success or a password reset) → 401 `UNAUTHORIZED` with `invalidCredentials`. Right password, unverified email → 403 `EMAIL_NOT_VERIFIED` (`emailNotVerified`) and a new code within the resend rules (none inside the cooldown or past the hourly cap).
  - POST `/api/auth/refresh` (refresh cookie, TASK-022, DEC-028; no per-IP limiter): 200 `{ accessToken, user }` with the Account's current roles and a rotated `refresh_token` cookie; the old token is revoked. Missing, unknown, expired or revoked cookie → 401 `UNAUTHORIZED` and the cookie cleared. A token revoked 30 s or longer ago (rotated, logged out or reset, Q-038) is a reuse: every session of the Account is revoked; one revoked less than 30 s ago only gets the 401 (DEC-039, TASK-050).
  - POST `/api/auth/logout` (refresh cookie, TASK-022; no per-IP limiter): 204, cookie cleared, the presented token revoked if active; also 204 without a cookie. Never triggers reuse detection.
  - POST `/api/auth/password/forgot` (`forgotPasswordSchema`) and POST `/api/auth/password/resend` (`resendCodeSchema`) (TASK-023, DEC-029): 200 `{ sent: true }`, a `password_reset` code mailed within the resend rules (429 `resendTooSoon(n)` / `resendLimit`, counted per purpose). After 3 dead `password_reset` codes created within 24 h, 429 `resetCodesPaused` until 24 h after the newest of them (TASK-054, DEC-041). Unknown email → the same 200 body, no email. Unverified Accounts get a code too (Q-039).
  - POST `/api/auth/password/verify` (`verifyCodeSchema`, TASK-023, DEC-029): 200 `{ resetToken }`, a JWT valid 10 min (purpose `password_reset`, subject the Account, HMAC fingerprint of the current password hash; keys derived from `JWT_ACCESS_SECRET` by HKDF, `resetToken.js`). Code errors as for verify-email. No session, email not marked verified.
  - POST `/api/auth/password/reset` (`resetPasswordSchema`, TASK-024, DEC-030): 200 `{ message: passwordChanged }`, the new bcrypt hash stored and every refresh token of the Account revoked (row locked while the token is checked). No session. Invalid, expired, used (the password changed since it was issued) or unknown-Account token → 401 `UNAUTHORIZED` with `resetToken.required` as `error.message`; a missing token → 422 `fields.resetToken`. Issued access tokens live until they expire (Q-040).
  - GET `/api/auth/me` (access token, TASK-021): 200 `{ user }`; 401 without a valid token or for a deleted Account.
  - PUT `/api/auth/me/country` (access token, Buyer role, `selectCountrySchema`, TASK-025, DEC-031): 200 `{ user }` with `preferredCountryCode`; can be called again to change it. Non-Buyer token → 403 `FORBIDDEN` (checked before validation); outside AE/SG/US/GB → 422 `fields.countryCode = [countryCode.invalid]`; 401 without a valid token or for a deleted Account.
  - POST `/api/auth/me/roles/developer` (access token, no body, TASK-026, DEC-032): 201 `{ user }` with `roles` including `developer`; no new token, the client refreshes (POST `/refresh` returns an access token with both roles). Already a Developer → 409 `CONFLICT`; unverified email → 403 `FORBIDDEN`; 401 without a valid token or for a deleted Account.
  - PUT `/api/auth/me/professional-profile` (access token, Developer role, `professionalInfoSchema`, TASK-027, DEC-033): 200 `{ profile }` = `{ id, companyName, developerType, licenseNumber, experienceLevel, location }` (request field names; `companyName` null when not given). Creates the one profile of the Account or replaces it (Account row locked, so concurrent PUTs keep one profile). Company without Company Name → 422 `fields.companyName = [companyName.required]`; non-Developer token → 403 `FORBIDDEN` (before validation); an Active Developer → 409 `CONFLICT` (Q-033 assumed); deleted Account → 401.
  - POST `/api/auth/me/documents` (access token, Developer role, multipart, TASK-028, DEC-034): one file part per kind named after the kind (`government_id`, `company_registration_certificate`, `profile_photo`) plus the text field `idDocumentType`. Each file is checked with `documentUploadSchema` (part name, file name, reported type, size; multer memory storage, `LIMITS.auth.maxFileBytes` per file) and its first bytes sniffed (PDF/JPEG/PNG; mismatch → `mimeType.invalid`). Every required kind with no document yet must be present (2 for an Individual, 3 for a Company, DEC-022): missing → 422 `fields["documents.<kind>.file"] = [documents.required[kind]]`; a kind not required → `[unknownField]` there. A kind already pending or approved → 409 `CONFLICT` with `documentAlreadySubmitted`, nothing uploaded. No Professional info → 403. Files are uploaded in parallel through `uploadAllAndSave` (DEC-038) under `realestate/<env>/documents/<profile id>/` as authenticated assets (PDF `raw`, images `image`); rows are written in one transaction after the uploads (profile row locked, rules checked again), and a failed save or upload deletes or queues every file that was uploaded. 201 `{ verification }` = `{ status, documents }` from `verificationStatus.js`.
  - GET `/api/auth/me/verification` (access token, Developer role, TASK-030, DEC-035): 200 `{ status, documents }` (`verificationStatus()`: one entry per required kind from its latest row, the same body as the POST `verification`). Buyer-only or no Professional info → 403 `FORBIDDEN`; 401 without a valid token or for a deleted Account.
  - `requireActiveDeveloper` (exported by `modules/auth/index.js`, TASK-030): use after `authenticate` on later Developer routes; 403 `FORBIDDEN` without the Developer role, 403 `DEVELOPER_NOT_ACTIVE` (`documentsUnderReview`) unless the Verification status is Active. Not mounted on any route yet.
  - `user` shape (`auth.presenter.js`): `{ id, fullName, email, phone, roles, emailVerified, preferredCountryCode, developerVerificationStatus }`; `developerVerificationStatus` is `null` without the Developer role, otherwise the Verification status headline (`under_review` before Professional info; TASK-030, DEC-035).
- Code layout (DEC-025): `backend/src/modules/auth/` has `auth.routes.js`, `auth.controller.js`, `auth.service.js`, `auth.repository.js`, `auth.presenter.js`, `session.service.js`, `verificationCode.service.js` (Verification codes: `issue`, `check`), `resetToken.js` (reset permission), `verificationStatus.js` (pure Verification status: required kinds, latest row per kind, headline; TASK-027), `onboarding.service.js` / `onboarding.repository.js` (Developer onboarding, DEC-033), `activeDeveloper.js` (the Active developer guard, DEC-035), `documentUpload.js` (multipart parsing and per-file checks, DEC-034) and `loginAttemptLimiter.js`, wired in `index.js`.
- Env vars (names only, validated in `backend/src/config/env.js`): `SMTP_SERVICE_HOST`, `SMTP_SERVICE_PORT`, `SMTP_USER_NAME`, `SMTP_USER_PASSWORD`, `MAIL_FROM`, `VERIFICATION_CODE_SECRET` (Q-009, DEC-021); Cloudinary `CERTIFICATE_STORAGE`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Q-030).

## UI/design references

`figma.md`.

## Dependencies

- Mailer `backend/src/modules/mail/smtp.mailer.js`: `sendVerificationCode({ to, code, purpose })`, nodemailer over SMTP port 465, secure (DEC-024). Built 2026-10-29 (TASK-018).
- `multer` (multipart parsing, memory storage) for POST `/me/documents` (DEC-034).
- Cloudinary file services in `backend/src/modules/files/` (upload with compensation, deletion outbox and worker, daily orphan cleanup, DEC-018). Built 2026-10-29; signed delivery URLs are not built yet.

## Acceptance criteria

- [ ] To be written after the grill.

## Tests and verification

- [ ] To be written after the grill.

## Open questions and assumptions

- See `docs/execution/QUESTIONS.md` (Q-007 to Q-032) and `db.md`.
