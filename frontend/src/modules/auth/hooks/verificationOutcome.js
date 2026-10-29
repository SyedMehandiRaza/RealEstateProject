// Headline of the developer status screens (DEC-014, DEC-022), from GET /auth/me/verification
// `documents` (one entry per required kind, holding the latest upload's status):
// any rejected -> 'unsuccessful', every one approved -> 'active', otherwise 'under_review'.
export function verificationOutcome(documents = []) {
  if (documents.some((document) => document.status === 'rejected')) return 'unsuccessful';
  if (documents.length > 0 && documents.every((document) => document.status === 'approved')) {
    return 'active';
  }
  return 'under_review';
}
