# Validation Rules (Zod, shared by backend and frontend)

## One source of truth
- All Zod schemas live in `shared/src/schemas/<module>.schema.js`.
- All user-facing validation messages live in `shared/src/messages/<module>.messages.js` (plus `common.messages.js` for generic ones).
- `backend/` and `frontend/` import both from the `shared` workspace package. Never redefine a rule or retype a message string in either app.
- A schema never contains an inline string literal as a message. Every message is a reference to a messages constant.

## Every field is validated explicitly
For each field, decide and encode:
- Type and coercion (for example `z.coerce.number()` for query strings and form inputs that arrive as strings)
- Required vs optional vs nullable, and whether empty string counts as missing
- Trimming and normalization (`.trim()`, `.toLowerCase()` for emails)
- Length bounds (`min`/`max`). `max` must be less than or equal to the DB column length.
- Format (`z.email()`, regex for phone, postcode, slug, and so on), enums via `z.enum([...])` matching the DB ENUM
- Numeric range, integer vs decimal, precision for money/area
- Cross-field rules via `.refine`/`.superRefine` with an explicit `path` so the error lands on the right field
- Unknown keys: request body schemas use `z.strictObject` so unexpected fields are rejected

## Error contract (backend responses)
Validation failures return HTTP 422 with this exact shape:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "<common.messages invalidInput>",
    "fields": { "email": ["<message from shared>"] }
  }
}
```
- `fields` keys are the dotted field paths used in the frontend form, so the form can call `setError(path, ...)` directly.
- Other error codes (`NOT_FOUND`, `CONFLICT`, `UNAUTHORIZED`, `FORBIDDEN`, `INTERNAL_ERROR`) are defined in `shared/src/errors/codes.js` with their messages.
- Unique-constraint failures from MySQL (for example a duplicate email) are mapped to a field error using the shared message, not the raw Sequelize text.

## Frontend usage
- Forms use `react-hook-form` with `zodResolver(<sharedSchema>)`.
- Server `fields` errors are mapped back into the form with `setError`. The UI never rewrites the message.

## Parity checks (required for each schema)
- A Jest test in `shared/` covers valid input, every individual rule failure, and asserts the exact message constant.
- A backend integration test (supertest) posts the same invalid payloads and asserts the same messages in `error.fields`.
- At least one Playwright test per form submits invalid input and asserts the on-screen message equals the shared constant.
