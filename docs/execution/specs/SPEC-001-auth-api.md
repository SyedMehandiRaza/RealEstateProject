# SPEC-001: Auth API for buyers and developers

- Labels: `ready-for-agent`
- Tracker: local (Q-006, DEC-022). Tickets: TASK-017 to TASK-045 in `docs/execution/BACKLOG.md` (replacing TASK-006, 009, 010, 011, 013, 014)
- Sources: GLOSSARY.md; DEC-008, DEC-012 to DEC-022; `docs/modules/auth/` (README, db.md, figma.md); the shared auth schemas
- Written: 2026-10-29

## Problem Statement

People who want to buy property, and developers who own property and want to list it, have no way to create an Account, prove they control their email, sign in, or recover a forgotten password. Developers also cannot send the Verification documents that an Admin needs before letting them list properties, and they cannot see where their Developer verification stands. The Figma "Auth Module" screens describe these journeys, but nothing behind them exists yet.

## Solution

An auth API that drives the Figma journeys exactly as designed, for Buyers and Developers:

- A person signs up as a Buyer or a Developer, receives a 6-digit Verification code by email, and enters it on the Verify screen. A Buyer then picks a country; a Developer continues to Professional info and Upload Document.
- Anyone with a verified Account logs in with email and password. A forgotten password is replaced through Forgot Password → Verify → Reset password, using a Verification code sent by email.
- A Developer sends Professional info and Verification documents (Government ID, Profile Photo, and a Company Registration Certificate when the Type of Developer is Company). They then see their Verification status (Under Review, Active, or Unsuccessful with a reason per document) and resubmit only the rejected documents.
- One Account can hold both roles: a Buyer can become a Developer without a second email or password.

## User Stories

### Sign up

1. As a visitor, I want to sign up as a Buyer with my full name, email, phone number and password, so that I can look for property to buy.
2. As a visitor, I want to sign up as a Developer on the Developers tab with the same form, so that I can start listing my properties.
3. As a visitor, I want my email to be accepted however I capitalise it, so that I am not locked out by a typing difference.
4. As a visitor, I want to type my phone number with spaces or dashes in international format, so that I can enter it the way I usually write it.
5. As a visitor, I want to be told exactly which field is wrong, with the same message the form shows, so that I can fix it quickly.
6. As a visitor, I want a password rule I can see when I break it (at least 8 characters, a letter and a number), so that I can choose an acceptable password.
7. As a visitor, I want to be told when my two passwords do not match, so that I do not lock myself out with a typo.
8. As a visitor who already has an Account, I want sign-up to tell me "This email is already registered. Log in instead", so that I log in rather than create a duplicate.

### Email verification

9. As a new Account holder, I want a 6-digit Verification code emailed to me right after sign-up, so that I can prove the email is mine.
10. As a new Account holder, I want to enter the code on the Verify screen and continue straight into the app, so that I do not have to log in again.
11. As a new Account holder, I want to request a new code with "Resend", so that I can continue if the first email did not arrive.
12. As a new Account holder, I want to be told to wait when I press Resend too quickly, so that I know the request was not ignored.
13. As a new Account holder, I want an old code to stop working once a new one is sent, so that only the latest email matters.
14. As a new Account holder, I want a clear message when my code is wrong or expired, so that I know to check the email or resend.
15. As an Account holder, I want a code to die after 5 wrong tries, so that nobody can guess it.
16. As an Account holder who never verified, I want logging in with my correct password to send me a new code and take me to Verify, so that I can finish where I left off.

### Buyer onboarding

17. As a Buyer, I want to choose my country (United Arab Emirates, Singapore, United States or United Kingdom) after verifying, so that I see properties in my market.
18. As a Buyer, I want to change my country later, so that I can follow a move or a new interest.

### Log in and sessions

19. As an Account holder, I want to log in with my email and password, so that I can use the app.
20. As an Account holder, I want the same "Invalid email or password" message whatever was wrong, so that nobody can learn which emails have Accounts.
21. As an Account holder, I want my session to stay alive while I use the app, without logging in every 15 minutes, so that the app is convenient.
22. As an Account holder, I want to log out, so that my session ends on this device.
23. As an Account holder, I want a stolen or reused session to be shut down everywhere, so that a leak does not give lasting access.
24. As an Account holder, I want repeated failed logins against my email to be slowed down, so that nobody can guess my password.
25. As a visitor on a shared network, I want limits that do not lock the real owner out of their Account, so that an attacker cannot block me by guessing on purpose.

### Password reset

26. As an Account holder who forgot my password, I want to enter my email on Forgot Password and receive a Verification code, so that I can prove the Account is mine.
27. As an Account holder, I want Forgot Password to answer the same way whether or not my email has an Account, so that it does not reveal who is registered.
28. As an Account holder, I want the accepted code to let me set a new password for 10 minutes, so that I have time to choose one.
29. As an Account holder, I want the new password to follow the same rule as sign-up, so that every password meets the policy.
30. As an Account holder, I want every device to be logged out after a reset, and to land on Log in with "Password changed. Please log in", so that anyone using my old password is kicked out.
31. As an Account holder, I want a reset permission to work only once, so that a leaked one cannot be reused.

### Roles

32. As a Buyer, I want to start Developer onboarding from a "Become a developer" link, so that I can list property with the same Account.
33. As an Account holder with both roles, I want buyer features to keep working while my Developer verification is under review, so that becoming a Developer does not cost me anything.

### Developer verification

34. As a Developer, I want to enter my Professional info (Company Name, Type of Developer, License / Registration Number, Experience Level, Location), so that an Admin can check who I am.
35. As an Individual Developer, I want Company Name to stay optional, so that I am not forced to invent one.
36. As a Company Developer, I want to be told that Company Name is required, so that my profile is complete.
37. As a Developer, I want to upload my Government ID with its type (Driving License, Passport or PAN Card), so that my identity can be checked.
38. As a Developer, I want to upload a Profile Photo as JPG or PNG, so that my profile shows who I am.
39. As a Company Developer, I want to upload my Company Registration Certificate, so that my company can be checked.
40. As an Individual Developer, I want not to be asked for a company certificate, so that I am not blocked by a document I do not have.
41. As a Developer, I want files over 10 MB or of the wrong type rejected with a clear message before anything is stored, so that I can fix the file at once.
42. As a Developer, I want to remove and replace a file on the Upload screen before I press Continue, so that I only send the files I mean to.
43. As a Developer, I want to see "Your Account is Under Review" with each required document marked Pending after I send them, so that I know they arrived.
44. As a Developer, I want to see "Your Account is Active!" with each document Approved once all are approved, so that I know I can start.
45. As a Developer, I want to see "Verification Unsuccessful" with the reason for each rejected document, so that I know what to fix.
46. As a Developer, I want to re-upload only the rejected documents with "Resubmit Documents", so that I do not repeat work that was accepted.
47. As a Developer whose verification is not Active, I want to still be able to log in and see my status, so that I can follow progress.
48. As a Developer whose verification is not Active, I want developer features to stay closed, so that only checked Developers list properties.
49. As a Developer, I want my files to be private, readable only by me and Admins, so that my ID is not exposed.

### Platform

50. As the business, I want files whose upload or save failed to be cleaned up automatically, so that ID documents never linger unowned in Cloudinary.
51. As the business, I want the API to refuse to start on an unsupported MySQL version, so that data rules enforced by the database are never silently skipped.
52. As a frontend developer, I want every validation failure returned with the exact shared message under the form field's name, so that the form shows it without rewriting.

## Implementation Decisions

### Modules

- **Auth service (deep module).** The routes are thin. One auth service owns: sign up, verify email, resend code, log in, refresh, log out, forgot password, verify reset code, reset password, select country, become a developer, save Professional info, submit documents, and read Verification status. Its interface takes already-validated input and returns plain data or throws an application error with a shared code.
- **Verification codes (deep module).** It issues, checks, throttles and expires codes for a purpose (`email_verification`, `password_reset`). Its interface is: issue a code for an Account and purpose (applies the resend rules and returns the code for the mailer); check a code (applies expiry, attempts and newest-only).
  - Codes come from a cryptographic random source, keep leading zeros, and are stored as HMAC-SHA256 with `VERIFICATION_CODE_SECRET` (DEC-015, DEC-021). They are compared in constant time.
  - Only the newest row per Account and purpose can be accepted, so a new code cancels older ones. A wrong guess adds one to `attempts`; at 5 the code is dead.
- **Mailer (new).** One method: send a Verification code to an address for a purpose. It is nodemailer over SMTP, port 465, `secure: true`, configured from `SMTP_SERVICE_HOST`, `SMTP_SERVICE_PORT`, `SMTP_USER_NAME`, `SMTP_USER_PASSWORD` and `MAIL_FROM`. These are validated at startup like the other env vars. Mail content and credentials are never logged or stored.
- **Login attempt limiter (new, in memory).** Up to 10 failed logins per email per 15 minutes (DEC-022). It counts failures for unknown emails too, so it never reveals which Accounts exist, and a successful login resets the count. It lives in process memory: per API instance, reset on restart, no schema change.
- **Verification status (pure function).** Input: the Developer's Type of Developer and their document rows. Output: the required kinds, the latest row per kind, and the headline.
  - Required kinds: Government ID and Profile Photo, plus the Company Registration Certificate for Company.
  - Headline: any latest required document rejected → Unsuccessful; all approved → Active; otherwise Under Review (DEC-014, DEC-022).
- **Access guard (new middleware).** "Active developer required", for later modules such as properties. A Developer who is not Active gets `DEVELOPER_NOT_ACTIVE`.
- **App factory seam.** `createApp` accepts its external dependencies (mailer, file storage, clock), with production defaults. Tests pass fakes. This is the only new seam.
- **Existing building blocks reused:**
  - shared schemas (`signUpSchema`, `verifyCodeSchema`, `resendCodeSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `selectCountrySchema`, `professionalInfoSchema`, `documentUploadSchema`) with the `validate` middleware;
  - `authenticate` / `authorize` with a roles list (DEC-019);
  - the per-IP `authRateLimiter` (20 requests per 15 minutes on every auth route);
  - the refresh cookie helpers;
  - the files module (`uploadAndSave`, deletion outbox, DEC-018);
  - the user models, including `User.scope('withPassword')` for login and reset only.

### API contract

All routes are under `/api/auth`. Success bodies are `{ success: true, data }`; failures use the shared error contract, with validation failures as 422 `VALIDATION_ERROR` and `fields` keyed by the request field names. Every public route below uses the per-IP limiter.

| Method and path                | Auth                                        | Body (shared schema)                                                                                 | Success                                                                                 | Notable failures                                                                                                                                                                                              |
| ------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST `/sign-up`                | public                                      | `signUpSchema`                                                                                       | 201 `{ email }`; sends an `email_verification` code                                     | 409 `CONFLICT` with `fields.email = [emailTaken]`                                                                                                                                                             |
| POST `/verify-email`           | public                                      | `verifyCodeSchema`                                                                                   | 200 `{ accessToken, user }` + refresh cookie                                            | 422 with `fields.code = [codeInvalid]` or `[codeTooManyAttempts]`                                                                                                                                             |
| POST `/verify-email/resend`    | public                                      | `resendCodeSchema`                                                                                   | 200 `{ sent: true }`, also for unknown or already-verified emails (no-op)               | 429 `TOO_MANY_REQUESTS` with `resendTooSoon(n)` or `resendLimit`                                                                                                                                              |
| POST `/login`                  | public                                      | `loginSchema`                                                                                        | 200 `{ accessToken, user }` + refresh cookie                                            | 401 `UNAUTHORIZED` with `invalidCredentials` (wrong password, unknown email, or per-account limit hit); 403 `EMAIL_NOT_VERIFIED` (correct password, unverified; a new code is sent if the resend rules allow) |
| POST `/refresh`                | refresh cookie                              | –                                                                                                    | 200 `{ accessToken, user }`, rotated cookie                                             | 401 `UNAUTHORIZED`; a reused token revokes all of the Account's sessions                                                                                                                                      |
| POST `/logout`                 | refresh cookie                              | –                                                                                                    | 204, cookie cleared, token revoked                                                      | always succeeds                                                                                                                                                                                               |
| POST `/password/forgot`        | public                                      | `forgotPasswordSchema`                                                                               | 200 `{ sent: true }` whether or not the Account exists                                  | 429 as for resend                                                                                                                                                                                             |
| POST `/password/verify`        | public                                      | `verifyCodeSchema`                                                                                   | 200 `{ resetToken }`, valid 10 min                                                      | 422 as for verify-email                                                                                                                                                                                       |
| POST `/password/resend`        | public                                      | `resendCodeSchema`                                                                                   | 200 `{ sent: true }`                                                                    | 429 as for resend                                                                                                                                                                                             |
| POST `/password/reset`         | public                                      | `resetPasswordSchema`                                                                                | 200 `{ message: passwordChanged }`; every refresh token revoked                         | 401 `UNAUTHORIZED` with `resetToken.required` when the token is invalid, expired or used                                                                                                                      |
| GET `/me`                      | access token                                | –                                                                                                    | 200 `{ user }`                                                                          | 401                                                                                                                                                                                                           |
| PUT `/me/country`              | Buyer                                       | `selectCountrySchema`                                                                                | 200 `{ user }`                                                                          | 403 `FORBIDDEN`                                                                                                                                                                                               |
| POST `/me/roles/developer`     | verified Account without the Developer role | –                                                                                                    | 201 `{ user }` (roles now include developer); the client then uses a fresh access token | 409 `CONFLICT` if already a Developer                                                                                                                                                                         |
| PUT `/me/professional-profile` | Developer                                   | `professionalInfoSchema`                                                                             | 200 `{ profile }` (create or replace)                                                   | 403                                                                                                                                                                                                           |
| POST `/me/documents`           | Developer with Professional info            | multipart: one file per kind plus `idDocumentType`; each file is checked with `documentUploadSchema` | 201 `{ verification }`                                                                  | 422 per file under `fields["documents.<kind>.<field>"]`; 409 `CONFLICT` for a kind whose latest document is pending or approved                                                                               |
| GET `/me/verification`         | Developer                                   | –                                                                                                    | 200 `{ status, documents }`                                                             | 403                                                                                                                                                                                                           |

- **`user` shape:** `{ id, fullName, email, phone, roles, emailVerified, preferredCountryCode, developerVerificationStatus }`. The last field is `null` without the Developer role. The access token carries `sub` and `roles`; the refresh endpoint keeps the existing frontend contract `{ accessToken, user }`.
- **New shared error codes:** `EMAIL_NOT_VERIFIED` (403, message `emailNotVerified`) and `DEVELOPER_NOT_ACTIVE` (403, message `documentsUnderReview`).
- **Documents in one request.** Upload Document sends every file at Continue in one multipart request. The remove (x) before Continue happens only in the browser, so no half-sent set ever reaches review.
  - First submission: every required kind must be present.
  - Resubmission: only kinds whose latest document is rejected are accepted.
  - Each file is checked against `documentUploadSchema` (built from the part's name, reported type and size). Then its first bytes are sniffed for PDF, JPEG or PNG; a mismatch is a 422 with `mimeType.invalid`.
  - Each file goes through `uploadAndSave` under `realestate/<env>/documents/<profile id>/` as an authenticated asset. All rows are saved in one transaction, and any uploads already made are compensated if a later file fails.
  - Multipart parsing needs a new dependency, `multer`, with memory storage limited to 10 MB per file and 3 files.
- **Reset permission:** a signed token (purpose `password_reset`, subject the Account, 10 minutes). It carries a fingerprint of the Account's current password hash, so it stops working the moment the password changes. That makes it single-use with no schema change.
- **Sign-up and roles:** sign-up creates the Account, its first role and the first code in one transaction. The code is mailed after commit. "Become a developer" adds a `user_roles` row. Roles are read at login and refresh in the same query as the Account (no N+1).
- **Login flow order:**
  1. Check the per-account limit.
  2. Load the Account with its password hash.
  3. Compare with bcrypt, also against a dummy hash for unknown emails, so timing does not reveal Accounts.
  4. Record a failure or reset the count.
  5. If the password is right but the email is unverified, send a code within the resend rules and answer `EMAIL_NOT_VERIFIED`.
  6. Otherwise issue the access token and refresh cookie.
- **No schema changes** beyond the draft migrations already written.

## Testing Decisions

- **What makes a good test:** it drives the API over HTTP, the way the frontend does, and checks status codes, bodies, cookies, sent emails (through the fake mailer), stored rows and queued file deletions. It never asserts on internal calls or private helpers, so the services can be refactored freely.
- **Main seam:** supertest against `createApp` with a fake mailer (records messages, so tests read the code from the "email"), a fake file storage (the in-memory fake already used by the files module tests) and a controllable clock. It runs against the dedicated MySQL `real_estate_test` database, migrated before the run and cleaned per test. Setup refuses any database name that does not end in `_test`. Blocked until MySQL 8.4 is installed (TASK-006).
- **Validation parity:** for each schema, at least one supertest case posts the invalid payloads from the shared schema tests and asserts the same message constants in `error.fields`. A Playwright case per form follows in TASK-014.
- **Unit tests only where a pure rule hides behind the HTTP seam and is cheaper to test directly:** the Verification status function, the login attempt limiter (window, reset on success, unknown emails), and code generation (6 digits with leading zeros).
- **Scenarios that must be covered:**
  - every row of the API table, including each failure;
  - resend at 59 and 60 seconds, the 6th code in an hour;
  - a code at 9:59 and 10:00 minutes, the 5th and 6th wrong guess, an old code after a resend;
  - the per-account limit at attempts 10 and 11, and its reset after a success;
  - refresh token reuse;
  - a reset token used twice, and one presented after its password changed;
  - an Individual vs a Company document set, resubmitting an approved kind;
  - a PNG declared as PDF;
  - a failed DB save leaving no file behind;
  - a Buyer calling a Developer route.
- **Prior art:**
  - `backend/src/__tests__/app.test.js` and `middlewares/__tests__/authenticate.test.js` for supertest against the app and the error contract;
  - `modules/files/__tests__` for fakes and clock control;
  - `modules/auth/__tests__/userDeletion.service.test.js` for transaction ordering;
  - `shared/src/schemas/__tests__/auth.schema.test.js` for the exact messages to reuse in parity tests.

## Out of Scope

- The Agent role and its screens (DEC-017).
- Google and Apple sign-in; their buttons stay hidden (DEC-021).
- SMS, phone verification, and login or reset by phone (DEC-022).
- The admin module: reviewing documents, listing `failed` file deletions, deleting Accounts (the deletion service exists, but no endpoint here), and creating admins beyond a seed.
- Plans and subscriptions; "View plan" opens a placeholder (DEC-022).
- Changing email or password from inside the app, and self-service Account deletion.
- The retention cleanup job (TASK-016) and signed links for viewing stored files.
- The frontend pages (TASK-013, through `/figma-to-module`) and Playwright e2e (TASK-014).
- Which home screen opens first for an Account with both roles (dashboards module).

## Further Notes

- **Figma copy fixes to raise with design:**
  - Log in label "Email/ Phone number" → "Email".
  - Forgot Password text → "email address".
  - Profile Photo formats → "JPG, PNG".
  - Pending and Approved should list every required document (2 for Individual, 3 for Company).
- **Assumption, not yet confirmed:** Professional info can be edited until the Developer is Active. Editing after Active needs a re-review rule, which is not decided.
- **New dependencies to justify when implemented:** `nodemailer` (the mailer) and `multer` (multipart parsing). No existing package covers either.
- **New env var:** `VERIFICATION_CODE_SECRET` (32+ random characters). `MAIL_FROM` is still missing from `backend/.env`.
- **Correction recorded on 2026-10-29:** the per-IP limiter allows 20 requests per 15 minutes per IP, not 10 as said during the grill. The repository does have a GitHub remote, so the tracker choice (Q-006) can be revisited.
