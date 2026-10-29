# Module Dependency Map

| Module/task              | Depends on                                                       | Provides                                                                                                  | Parallelizable?                                                        | Notes                                                                                    |
| ------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| files (shared)           | models, config/env (Cloudinary), logger                          | `fileUploads.uploadAndSave` / `uploadAllAndSave`, `fileDeletion.enqueue`, deletion worker, orphan cleanup | No: shared foundation                                                  | Every module that stores files uses it and adds its table to the orphan reference lookup |
| auth                     | shared schemas (`/shared-validation`), files, mailer (not built) | users, roles, tokens, verification codes, developer onboarding                                            | Partly: backend and frontend can split once the API contract is agreed | Buyer + developer only (DEC-017)                                                         |
| properties (not started) | auth (developer role), files                                     | listings                                                                                                  | After auth                                                             | Deleting a property queues its images (DEC-018)                                          |

## Shared foundations

- `shared/` (schemas, messages, error codes), migrations, `backend/src/app.js` and routing, `config/env.js`, `modules/files`, `middlewares/authenticate.js`.

## Integration order

1. Foundations: migrations, env config, files module, MySQL version check
2. Auth: shared validation, API, frontend pages
3. Properties and later modules
4. Integration and end-to-end validation

## Third-party packages added

- `cloudinary` (^2.11.0, backend): official SDK for upload, destroy, Admin API listing and URL signing. No existing package covered it.
