// In-memory stand-ins for Cloudinary and the pending_file_deletions table, for unit tests.

// uniqueIds: every newPublicId is different (needed when one request stores several files, since
// verification_documents.cloudinary_public_id is unique); off by default for the fixed-id unit tests.
export function createFakeStorage({ prefix = 'realestate/test/', uniqueIds = false } = {}) {
  const calls = [];
  let issued = 0;
  let destroyFailures = 0;
  return {
    prefix,
    calls,
    assets: [],
    failNextDestroys(count) {
      destroyFailures = count;
    },
    newPublicId(folder) {
      issued += 1;
      return `${prefix}${folder}/generated-id${uniqueIds ? `-${issued}` : ''}`;
    },
    async upload(_buffer, { publicId, resourceType }) {
      calls.push(['upload', publicId]);
      return { publicId, resourceType, deliveryType: 'authenticated' };
    },
    async destroy(file) {
      calls.push(['destroy', file.publicId]);
      if (destroyFailures > 0) {
        destroyFailures -= 1;
        throw new Error('Cloudinary unavailable');
      }
    },
    // Predictable stand-in for the signed URL: the public id, the expiry (epoch seconds) and the disposition.
    deliveryUrl({ publicId, resourceType, expiresAt, attachment = false }) {
      const expires = Math.floor(expiresAt.getTime() / 1000);
      return `https://files.test/${resourceType}/${publicId}?expires=${expires}&disposition=${attachment ? 'attachment' : 'inline'}`;
    },
    async *list({ resourceType, deliveryType }) {
      for (const asset of this.assets) {
        if (asset.resourceType === resourceType && asset.deliveryType === deliveryType) yield asset;
      }
    },
  };
}

export function createFakeQueueRepository() {
  let nextId = 1;
  const rows = [];
  return {
    rows,
    async insertMany(entries, { transaction } = {}) {
      for (const entry of entries) {
        const exists = rows.some(
          (row) =>
            row.publicId === entry.publicId &&
            row.resourceType === entry.resourceType &&
            row.deliveryType === entry.deliveryType,
        );
        if (exists) continue;
        rows.push({
          id: nextId++,
          status: 'pending',
          attempts: 0,
          lastError: null,
          nextAttemptAt: new Date(0),
          ...entry,
          transaction,
        });
      }
    },
    async findDue(now, limit) {
      // Oldest due first, like the real repository's ORDER BY next_attempt_at (stable sort keeps insert order).
      return rows
        .filter((row) => row.status === 'pending' && row.nextAttemptAt <= now)
        .sort((a, b) => a.nextAttemptAt - b.nextAttemptAt)
        .slice(0, limit);
    },
    async remove(id) {
      rows.splice(
        rows.findIndex((row) => row.id === id),
        1,
      );
    },
    async scheduleRetry(id, changes) {
      Object.assign(
        rows.find((row) => row.id === id),
        changes,
      );
    },
    async markFailed(id, changes) {
      Object.assign(
        rows.find((row) => row.id === id),
        { ...changes, status: 'failed' },
      );
    },
  };
}

export const silentLogger = () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() });
