# Database Rules (MySQL + Sequelize)

## Change process
- Every schema change is a new `sequelize-cli` migration with a working `down`. Never edit a migration that has been run on a shared environment; add a new one.
- Models and migrations must agree (types, lengths, nullability, defaults, indexes). The model is not the source of truth for the DB; the migrations are.
- Never use `sequelize.sync({ force: true })` or `{ alter: true }` against any persistent database.
- Do not run `db:migrate:undo:all`, `db:drop`, `DROP`, `TRUNCATE`, or bulk `DELETE`/`UPDATE` without explicit approval and a backup/rollback plan.
- Update `docs/database/SCHEMA.md` (and the module's `db.md`) in the same change.

## Naming
- Tables: `snake_case`, plural (`properties`, `property_images`). Columns: `snake_case`. Models: PascalCase singular, with `underscored: true`.
- Primary key `id`: `INT UNSIGNED AUTO_INCREMENT` by default, or `BIGINT UNSIGNED` for high-volume tables. If a public, non-guessable ID is needed, add a `uuid` column (`CHAR(36)` or `BINARY(16)`) with a unique index.
- Foreign keys: `<singular>_id`, same type as the referenced PK, with an explicit constraint and explicit `ON DELETE`/`ON UPDATE` behavior.
- Indexes: `idx_<table>_<cols>`; unique: `uq_<table>_<cols>`; FKs: `fk_<table>_<ref>`.

## Types
- Money: `DECIMAL(12,2)` (never FLOAT/DOUBLE). Area/measurements: `DECIMAL` with explicit precision.
- Strings: `VARCHAR(n)` with a deliberate `n` that matches the Zod `max`; `TEXT` only for long free text.
- Status/type fields: `ENUM` (matching the Zod enum) or a lookup table when values change at runtime.
- Timestamps: `created_at`, `updated_at` (`DATETIME`, UTC). Use `paranoid: true` (`deleted_at`) only when soft delete is a confirmed requirement.
- Charset/collation: `utf8mb4` / `utf8mb4_unicode_ci` (or `utf8mb4_0900_ai_ci` on MySQL 8).
- Engine: InnoDB.

## Design quality
- Normalize to 3NF by default; denormalize only with a documented reason (DECISIONS.md).
- Index every FK and every column used in frequent `WHERE`/`ORDER BY`/`JOIN`; use composite indexes in query-selectivity order.
- Enforce integrity in the DB (NOT NULL, UNIQUE, FK, CHECK on MySQL 8.0.16+), not only in application code.
- Personal data columns are listed in the module's `db.md` with a retention note.
