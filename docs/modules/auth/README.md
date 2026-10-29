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

- API contract: `docs/execution/specs/SPEC-001-auth-api.md` (ready-for-agent). Validation: shared auth schemas (see `db.md`). Assumed so far: `POST /api/auth/refresh` returns `{ data: { accessToken, user } }` (ARCHITECTURE.md).
- Env vars (new, names only): `SMTP_SERVICE_HOST`, `SMTP_SERVICE_PORT`, `SMTP_USER_NAME`, `SMTP_USER_PASSWORD`, `MAIL_FROM`; Cloudinary credentials (proposed `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, Q-030); plus a code-hashing secret (name TBD, Q-009).

## UI/design references

`figma.md`.

## Dependencies

- A mailer service (nodemailer, port 465, secure). Not built yet.
- Cloudinary file services in `backend/src/modules/files/` (upload with compensation, deletion outbox and worker, daily orphan cleanup, DEC-018). Built 2026-10-29; signed delivery URLs are not built yet.

## Acceptance criteria

- [ ] To be written after the grill.

## Tests and verification

- [ ] To be written after the grill.

## Open questions and assumptions

- See `docs/execution/QUESTIONS.md` (Q-007 to Q-032) and `db.md`.
