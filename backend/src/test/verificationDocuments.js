import models from '../models/index.js';

// Seeds a reviewed (or pending) verification_documents row directly, since there is no admin API yet.
// It satisfies the table's CHECKs: reviewed_at only for approved/rejected, a rejection reason exactly
// when rejected, and an image resource type for the PNG it pretends to be.
// `createdAt` decides which row is the latest of its kind. Pass a time before the test clock's now,
// or a row the API stores afterwards (dated by the test clock) is not the latest.
let seeded = 0;
export async function seedDocument(
  profileId,
  { documentKind, status, rejectionReason = status === 'rejected' ? 'Unreadable scan' : null, createdAt },
) {
  seeded += 1;
  const row = await models.VerificationDocument.create({
    professionalProfileId: profileId,
    documentKind,
    idDocumentType: documentKind === 'government_id' ? 'passport' : null,
    cloudinaryPublicId: `realestate/test/documents/${profileId}/seeded-${seeded}`,
    cloudinaryResourceType: 'image',
    originalFilename: `${documentKind}-old.png`,
    mimeType: 'image/png',
    sizeBytes: 1000,
    status,
    rejectionReason,
    reviewedAt: status === 'pending' ? null : createdAt,
    createdAt,
    updatedAt: createdAt,
  });
  return row.reload(); // as stored (whole seconds, defaults filled in)
}

// Seeds one row per entry of `statuses` ({ kind: status }), all at `createdAt`.
export async function seedDocuments(profileId, statuses, { createdAt }) {
  const rows = [];
  for (const [documentKind, status] of Object.entries(statuses)) {
    rows.push(await seedDocument(profileId, { documentKind, status, createdAt }));
  }
  return rows;
}
