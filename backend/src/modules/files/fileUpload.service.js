// Upload files, then save the DB rows that reference them. If the save (or another upload of the same
// request) fails, the uploads are undone, so a failed request never leaves a file behind (DEC-018).
// Cloudinary is never called inside the save's transaction: save runs only after every upload settled.
export function createFileUploadService({ storage, fileDeletion, logger }) {
  const upload = ({ buffer, folder, resourceType }) =>
    storage.upload(buffer, { publicId: storage.newPublicId(folder, resourceType), resourceType });

  // Deletes the file now, or queues it as save_failed. If neither works (often the DB is down), the
  // daily orphan cleanup will find the file, so this logs it and never throws: the caller reports the
  // original error.
  async function undo(uploaded) {
    try {
      await fileDeletion.deleteNowOrEnqueue(uploaded, { reason: 'save_failed' });
    } catch (compensationError) {
      logger.error(
        { err: compensationError, publicId: uploaded.publicId },
        'Could not delete or queue an orphaned upload; orphan cleanup will remove it',
      );
    }
  }

  return {
    // file: { buffer, folder, resourceType }. save(uploaded) writes the DB row and returns its result.
    async uploadAndSave(file, save) {
      const uploaded = await upload(file);
      try {
        return await save(uploaded);
      } catch (saveError) {
        await undo(uploaded);
        throw saveError;
      }
    },

    // files: [{ buffer, folder, resourceType }]. Starts every upload at once and waits for all of them.
    // If any upload fails, the ones that succeeded are undone, save is not called, and the first failure
    // in file order is thrown. Otherwise save(uploaded) gets the uploaded files in the order of `files`;
    // if it fails, every file is undone and its error is thrown.
    async uploadAllAndSave(files, save) {
      const results = await Promise.allSettled(files.map(upload));
      const uploaded = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
      const failure = results.find((r) => r.status === 'rejected');
      if (failure) {
        await Promise.all(uploaded.map(undo));
        throw failure.reason;
      }

      try {
        return await save(uploaded);
      } catch (saveError) {
        await Promise.all(uploaded.map(undo));
        throw saveError;
      }
    },
  };
}
