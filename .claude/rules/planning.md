# Planning and Requirements Rules

For new features or substantial changes:

1. Summarize the desired outcome and affected users/workflows.
2. Inspect the current implementation and identify existing reusable code.
3. Identify missing requirements, dependencies, risks, and affected interfaces.
4. Ask focused questions in batches when answers materially affect design or behavior.
5. Record confirmed decisions in `docs/DECISIONS.md` and requirements in the appropriate document.
6. Break the work into small tasks with acceptance criteria and verification steps.
7. Identify which tasks can safely run in parallel and which must be sequential.
8. Do not block on low-impact details if a reversible, clearly documented assumption is safe; do not assume high-impact business, security, financial, or data-retention rules.
9. Keep `docs/execution/STATUS.md` current for multi-step work.
10. When the user asks for implementation immediately, use judgment: do not create unnecessary planning overhead for small, clear tasks.
