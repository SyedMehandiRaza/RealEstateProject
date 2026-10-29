// Upload a file, then save the DB row that references it. If the save fails the upload is undone, so a
// failed request never leaves a file behind (DEC-018).
export function createFileUploadService({ storage, fileDeletion, logger }) {
  return {
    // file: { buffer, folder, resourceType }. save(uploaded) writes the DB row and returns its result.
    async uploadAndSave({ buffer, folder, resourceType }, save) {
      const uploaded = await storage.upload(buffer, {
        publicId: storage.newPublicId(folder, resourceType),
        resourceType,
      });

      try {
        return await save(uploaded);
      } catch (saveError) {
        try {
          await fileDeletion.deleteNowOrEnqueue(uploaded, { reason: 'save_failed' });
        } catch (compensationError) {
          // Neither the delete nor the queue worked (often the DB is down). The daily orphan cleanup
          // will find the file, so log it and report the original error to the caller.
          logger.error(
            { err: compensationError, publicId: uploaded.publicId },
            'Could not delete or queue an orphaned upload; orphan cleanup will remove it',
          );
        }
        throw saveError;
      }
    },
  };
}
