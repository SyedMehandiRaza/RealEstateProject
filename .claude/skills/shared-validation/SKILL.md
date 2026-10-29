---
name: shared-validation
description: Create or update Zod schemas and their error messages in the shared package so backend and frontend validate every field identically with identical messages. Use whenever a form, request body, query or params shape is added or changed, or when the user mentions validation, Zod, or error messages.
argument-hint: "<module-name> [schema name]"
---

# Shared validation (Zod)

Rules: `.claude/rules/validation.md`. Check current Zod syntax with context7 if unsure (the project targets Zod v4).

## Steps
1. **Collect fields** from the module spec, `db.md` (types, lengths, enums, nullability) and the Figma pages (labels, placeholders, required markers, helper text). Build a table: field | type | required | min/max | format | enum | cross-field rule | message keys. Ask the user about any rule that is not stated (for example password policy or phone format). Do not invent business rules.
2. **Messages first**: add constants to `shared/src/messages/<module>.messages.js`. Reuse `common.messages.js` for generic text. Use stable keys and human wording, for example:
   ```js
   export const propertyMessages = {
     title: {
       required: 'Title is required',
       max: 'Title must be at most 150 characters',
     },
     price: {
       required: 'Price is required',
       positive: 'Price must be greater than 0',
     },
   };
   ```
3. **Schema**: `shared/src/schemas/<module>.schema.js`. Every rule passes a message constant, never a literal string:
   ```js
   import { z } from 'zod';
   import { propertyMessages as m } from '../messages/property.messages.js';
   import { LIMITS } from '../limits.js';

   export const createPropertySchema = z.strictObject({
     title: z.string({ error: m.title.required }).trim()
       .min(1, m.title.required)
       .max(LIMITS.property.title, m.title.max),
     price: z.coerce.number({ error: m.price.required }).positive(m.price.positive),
   });
   export const updatePropertySchema = createPropertySchema.partial();
   ```
   - Keep numeric limits in `shared/src/limits.js`, so migrations can import the same numbers for VARCHAR lengths.
   - Export separate schemas for create, update, list query (`page`, `pageSize`, filters, sort allow-list) and `:id` params.
   - Export inferred types or JSDoc typedefs if the project uses them.
4. **Tests** in `shared/src/schemas/__tests__/<module>.schema.test.js`: one valid fixture; then, per field and per rule, a failing case asserting `z.flattenError(result.error).fieldErrors[field]` contains the exact message constant. Include boundary values (max, max+1, empty, whitespace-only).
5. **Wire up** (only if the apps exist): backend route `validate({ body: createPropertySchema })`; frontend `useForm({ resolver: zodResolver(createPropertySchema) })`; add a supertest case and a Playwright case asserting the same message (see the rules file).
6. If a column length or enum changed, flag that a migration is needed and that `/db-design-review` should be run.

## Done when
- [ ] No literal message strings in schemas, backend or frontend
- [ ] Every field has explicit type, required-ness, bounds and format
- [ ] Schema tests pass and cover every message
- [ ] Limits and enums match the DB
