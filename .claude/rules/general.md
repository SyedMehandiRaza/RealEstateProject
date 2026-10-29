# General Engineering Rules

- Inspect before changing: read the relevant code, tests, and documentation first.
- Preserve established naming, formatting, layering, and error-handling conventions.
- Make the smallest coherent change that solves the task.
- Avoid unrelated refactors and drive-by formatting changes.
- Prefer clear, explicit code over clever or unnecessarily abstract code.
- Validate external input at the appropriate boundary.
- Handle failures explicitly; do not silently swallow errors.
- Do not add dependencies without explaining why they are needed and checking existing alternatives.
- Do not duplicate business logic across modules when a stable shared abstraction is appropriate.
- Keep module boundaries clear; avoid circular dependencies.
- Never hardcode credentials, tokens, private keys, or environment-specific secrets.
- Do not weaken security controls or remove tests merely to make checks pass.
- If requirements conflict, stop and explain the conflict instead of guessing.
