# Git Workflow Rules

- Check `git status`, current branch, and recent history before editing.
- Do not overwrite, discard, reset, or clean up user changes unless explicitly authorized.
- Use descriptive feature branches and focused commits.
- Never commit secrets, credentials, local environment files, generated artifacts, or personal data.
- Do not amend or rewrite shared/published history unless explicitly requested.
- Review the diff before committing; keep commits scoped to the task.
- Merge only after review and required checks pass.
- If a conflict appears, inspect both sides and preserve intended behavior.
- Do not push, open pull requests, merge, release, or deploy unless the task/request and permissions authorize it.

## Branch flow (DEC-037)

`feature/<module>` → `testing` → `main`

- Claude commits and pushes only to the feature branch (`git push -u origin feature/<module>`), after `npm run check` passes.
- Merge a feature branch into `testing` only when the user asks: `git merge --no-ff feature/<module>`, run `npm run check` on `testing`, then push `testing`. The user then tests manually on `testing`.
- Merge `testing` into `main` only when the user asks, after their manual testing: `git merge --no-ff testing`, then push `main`.
- Never force-push `testing` or `main`. Fix bugs on the feature branch and merge again.
