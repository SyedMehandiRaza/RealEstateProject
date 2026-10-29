# Ticket procedure (for implementing agents)

Written 2026-10-29 for the auth goal. Every implementing agent follows this for exactly one BACKLOG ticket.

## Before coding

1. Read `CLAUDE.md`, the `.claude/rules/*` files relevant to the ticket, `docs/agents/*`, your ticket's row in `docs/execution/BACKLOG.md`, the spec it links (`docs/execution/specs/SPEC-001-auth-api.md`), `docs/modules/auth/` and the DEC/Q entries it cites. Read [gotchas.md](gotchas.md) and [environment.md](environment.md).
2. Follow `.claude/skills/implement/SKILL.md` and `.claude/skills/tdd/SKILL.md` (red, green, refactor, one vertical slice at a time). Backend: also `.claude/skills/express-module/SKILL.md` and `.claude/skills/jest-testing/SKILL.md`. Frontend: `.claude/skills/figma-to-module/SKILL.md`. E2E: `.claude/skills/playwright-e2e/SKILL.md`.

## Hard rules

- Work on branch `feature/auth` only. Never push. Never read `backend/.env`.
- Backend tests go through the SPEC-001 seam: supertest against `createApp({ mailer, storage, clock })` with fakes, on `real_estate_test`. Never send real email, never call real Cloudinary.
- Every endpoint: `validate()` with the shared schemas, the error contract in `.claude/rules/validation.md`, and parity tests asserting the exact shared message constants in `error.fields` (import the constants, never retype strings).
- No Zod schema or user-facing message inside `backend/` or `frontend/`. Add missing ones to `shared/` with tests.
- Do not change an existing table (both migrations already ran on `real_estate`). Do not add dependencies other than `nodemailer` and `multer`. Do not run destructive DB commands on `real_estate`. If the ticket needs any of these, or a business rule is missing, or two docs conflict: stop, add a `Q-NNN` row to `docs/execution/QUESTIONS.md`, and report back without committing.
- If a test still fails after 3 serious attempts, use `.claude/skills/diagnosing-bugs/SKILL.md`; if still failing, stop and report.

## Finish

1. `npm run check` from the repo root (tests, lint, prettier check, build) must pass. Fix formatting with `npx prettier --write <files you changed>`.
2. Set the ticket's Status to `Done (YYYY-MM-DD)` in `BACKLOG.md` and fill Verification with the test files and counts. Update `docs/execution/STATUS.md` "Next actions" (done / next / blockers) and any docs the change touches (ARCHITECTURE env names, module README, DECISIONS for new decisions).
3. Add durable lessons (a new trap, an environment fact) as dated lines in the relevant wiki page.
4. One commit: `git add` only files you changed, message `feat(auth): <summary> (TASK-0NN)` (or `test`/`docs`/`chore`), body ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
5. Report back in under 25 lines: commit hash, files changed (short), test counts, assumptions made, anything unverified, follow-ups.
