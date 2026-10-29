// Converts a ZodError into the API's `error.fields` shape: { 'dotted.path': ['message', ...] }.
// Object-level issues (no path) are collected under `_form`.
export function toFieldErrors(zodError) {
  const fields = {};
  for (const issue of zodError.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_form';
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}
