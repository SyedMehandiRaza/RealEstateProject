# Security and Data Safety Rules

- Treat credentials, tokens, private keys, production data, and personal data as sensitive.
- Never print secrets into chat, logs, tests, documentation, or commits.
- Use environment variables or the project's approved secret-management approach.
- Apply least privilege to application credentials and database accounts.
- Validate input, enforce authorization server-side, and use safe database/query APIs.
- Do not rely on frontend-only checks for access control.
- Do not use real customer data in development when synthetic data will suffice.
- Never point an agent or test suite at production by default.
- Do not run destructive database commands, migrations, bulk updates, or data cleanup without an approved plan and suitable backup/rollback strategy.
- Flag security-sensitive uncertainty and ask before weakening controls.
