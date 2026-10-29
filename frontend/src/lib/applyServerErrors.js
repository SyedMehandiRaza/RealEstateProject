// Maps an API error ({ error: { code, message, fields } }) from RTK Query onto a react-hook-form form.
// Field messages come from @real-estate/shared on the server and are shown unchanged.
// Returns the form-level message to display (or null when every error was attached to a field).
export function applyServerErrors(rtkError, setError) {
  const apiError = rtkError?.data?.error;
  if (!apiError) return 'Something went wrong, please try again';

  const fieldEntries = Object.entries(apiError.fields ?? {}).filter(([field]) => field !== '_form');
  fieldEntries.forEach(([field, messages], index) => {
    setError(field, { type: 'server', message: messages[0] }, { shouldFocus: index === 0 });
  });

  const formMessage = apiError.fields?._form?.[0];
  if (formMessage) return formMessage;
  return fieldEntries.length ? null : apiError.message;
}
