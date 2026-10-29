# Review watchlist

Items noted during the auth goal for the final `/code-review`, `/db-design-review auth` and `/security-review`. Dated; each cites the commit or report it came from.

- 2026-10-29 (TASK-028, `7d29721`): POST `/api/auth/me/documents` buffers up to about 30 MB per request in memory (multer memory storage) and has no rate limit. Addressed 2026-10-30 (TASK-053, DEC-040): early Content-Length reject, 10 submissions per hour per Account (assumption), one upload in flight per Account, eligibility checked before parsing. Remaining: a client that aborts frees its slot while its upload may still run (bounded by the hourly limit); both limits are in memory per instance.
- 2026-10-29 (TASK-023, DEC-029): forgot/resend password reveals whether an email is registered (429 inside the cooldown for a known email, 200 always for an unknown one). Spec-accepted; confirm in the security review.
- 2026-10-29 (TASK-022, DEC-028, Q-038): any revoked refresh token presented to `/refresh` revokes all sessions (no rotated/logged-out distinction without a migration). Updated 2026-10-30 (TASK-050, DEC-039): only when revoked 30 s or longer ago; inside 30 s it is a plain 401. Trade-off to confirm in the security review: a stolen token replayed within 30 s of its rotation is refused but does not log the Account out everywhere.
- 2026-10-29 (TASK-024, Q-040): access tokens stay valid up to `JWT_ACCESS_EXPIRES_IN` after a password reset.
- 2026-10-29 (TASK-021, DEC-027): per-account login limiter is in memory (per instance, lost on restart); dummy-hash timing equality not tested end to end. Since TASK-050 (DEC-039) a successful reset clears it, and the per-IP limit is one budget per route group (sign-up/verify, login, password reset), 20 / 15 min each, so one IP can now send up to 60 public auth requests per window.
- 2026-10-29 (TASK-046): if `navigator.locks.request` rejects, the request fails; no fallback.
- 2026-10-29 (TASK-020): `lockUserByEmail` FOR UPDATE serialization has no concurrency test.
- 2026-10-29 (coordinator): agent subagents never ran the migration round trip (`undo:all` blocked); user to run it.
- 2026-10-30 (security review, TASK-053, DEC-040): addressed: `trust proxy` from `TRUST_PROXY` (default off); DB error parameters/SQL never logged; the refresh grace-window 401 keeps the cookie; JWT secrets must differ and tokens carry a checked `typ`; e2e server on 127.0.0.1. Open: refresh tokens without `typ` are accepted until the pre-TASK-053 ones expire (remove the allowance 7 days after deployment); Q-044 (reset-code guessing cap) still open.
