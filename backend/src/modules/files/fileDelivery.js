// Files in API responses (PROP-004, PROP-SPEC-001): a stored file becomes { id, fileName, mimeType, sizeBytes,
// url, urlExpiresAt } with a signed URL valid for 1 hour (PROP-DEC-022). Public ids stay on the server.

export const FILE_URL_TTL_MS = 60 * 60_000;

// row: a model row (or plain object) with the file columns: id, cloudinaryPublicId, cloudinaryResourceType,
// originalFilename, mimeType, sizeBytes.
export function presentFile(row, { storage, now, attachment = false }) {
  const expiresAt = new Date(now.getTime() + FILE_URL_TTL_MS);
  return {
    id: row.id,
    fileName: row.originalFilename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    url: storage.deliveryUrl({
      publicId: row.cloudinaryPublicId,
      resourceType: row.cloudinaryResourceType,
      deliveryType: 'authenticated',
      mimeType: row.mimeType,
      expiresAt,
      attachment,
    }),
    urlExpiresAt: expiresAt.toISOString(),
  };
}
