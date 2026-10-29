---
name: db-design-review
description: Review a proposed or existing MySQL/Sequelize schema (docs, migrations, models) for correctness, integrity, performance, security and consistency with the shared Zod validation. Use after /db-design, before merging any migration, or when the user asks to "review the DB", "check the schema", or "review migrations".
argument-hint: "[module-name | path | 'diff']"
---

# DB design review

Scope: the module's `docs/modules/<module>/db.md`, `docs/database/SCHEMA.md`, and the related files under `backend/src/migrations/` and `backend/src/models/`. With `diff`, review only migrations/models changed since `main` (`git diff main...HEAD`).

Review against `.claude/rules/database.md`. Read everything first, then report. Do not edit unless the user asks.

## Checklist
**Modeling**
- Entities match the spec and glossary terms; no missing join table for many-to-many relationships
- Normalized (3NF), or the denormalization is justified in DECISIONS.md
- Cardinality and optionality match the business rules; nothing has been invented

**Integrity**
- PK on every table; FKs with matching type/unsigned-ness; explicit ON DELETE/ON UPDATE that matches the deletion rules
- NOT NULL where required; UNIQUE where the business says unique (including composite uniques); CHECK where useful
- ENUM values identical to the Zod enum in `shared/`

**Types**
- DECIMAL for money and area; no FLOAT for exact values
- VARCHAR lengths deliberate and equal to Zod `max`; TEXT only for long text
- Timestamps in UTC; utf8mb4 charset

**Performance**
- An index on every FK; indexes for the documented filters/sorts (property search: city, price range, type, status, created_at)
- No redundant indexes (a prefix of a composite index); composite column order matches the queries
- Pagination queries can use an index; potential N+1 patterns in the planned associations are flagged

**Migrations**
- Each migration is reversible (`down` truly undoes `up`), FK dependency order is correct, no data loss without a data-migration step
- No edit of an already-applied migration; no `sync({ force|alter })`
- Model definitions match migrations exactly (types, allowNull, defaults, underscored, tableName, aliases)

**Security and privacy**
- Personal data columns are identified, with a retention note; no plaintext passwords or tokens (store hashes only)
- Columns used for authorization (owner_id, agency_id) exist where row-level access is needed

## Report format
Group findings by severity: **Blocker** (data loss, integrity, or security), **Should fix**, **Consider**. For each finding give: location (`file:line` or table.column), problem, concrete fix. End with a parity table: field | DB type/length | Zod rule | match? (yes or no).
