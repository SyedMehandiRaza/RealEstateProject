// Avatar initials (STAFF-DEC-018): first letters of the first and last words of a full name, upper case;
// one letter for a one-word name; empty for a missing name.
export function initials(fullName) {
  const words = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}
