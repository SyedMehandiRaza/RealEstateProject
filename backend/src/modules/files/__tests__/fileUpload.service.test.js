import { createFileDeletionService } from '../fileDeletion.service.js';
import { createFileUploadService } from '../fileUpload.service.js';
import { createFakeQueueRepository, createFakeStorage, silentLogger } from '../../../test/fileFakes.js';

function setup() {
  const storage = createFakeStorage();
  const repository = createFakeQueueRepository();
  const logger = silentLogger();
  const fileDeletion = createFileDeletionService({ repository, storage, logger });
  const uploads = createFileUploadService({ storage, fileDeletion, logger });
  return { storage, repository, logger, uploads };
}

const file = { buffer: Buffer.from('pdf'), folder: 'documents/7', resourceType: 'raw' };

describe('uploadAndSave (upload, then DB save)', () => {
  it('returns the save result and deletes nothing when the save succeeds', async () => {
    const { storage, uploads } = setup();

    const result = await uploads.uploadAndSave(file, async (uploaded) => ({ id: 1, ...uploaded }));

    expect(result).toEqual({
      id: 1,
      publicId: 'realestate/test/documents/7/generated-id',
      resourceType: 'raw',
      deliveryType: 'authenticated',
    });
    expect(storage.calls).toEqual([['upload', 'realestate/test/documents/7/generated-id']]);
  });

  it('deletes the uploaded file immediately and rethrows when the save fails', async () => {
    const { storage, repository, uploads } = setup();
    const saveError = new Error('duplicate key');

    await expect(
      uploads.uploadAndSave(file, async () => {
        throw saveError;
      }),
    ).rejects.toBe(saveError);

    expect(storage.calls).toEqual([
      ['upload', 'realestate/test/documents/7/generated-id'],
      ['destroy', 'realestate/test/documents/7/generated-id'],
    ]);
    expect(repository.rows).toHaveLength(0);
  });

  it('enqueues the file when the immediate delete also fails', async () => {
    const { storage, repository, uploads } = setup();
    storage.failNextDestroys(1);

    await expect(
      uploads.uploadAndSave(file, async () => {
        throw new Error('db down');
      }),
    ).rejects.toThrow('db down');

    expect(repository.rows).toEqual([
      expect.objectContaining({
        publicId: 'realestate/test/documents/7/generated-id',
        resourceType: 'raw',
        deliveryType: 'authenticated',
        reason: 'save_failed',
        status: 'pending',
        lastError: 'Cloudinary unavailable',
      }),
    ]);
  });

  it('still rethrows the original save error when enqueueing fails too, and logs the file', async () => {
    const { storage, repository, logger, uploads } = setup();
    storage.failNextDestroys(1);
    repository.insertMany = async () => {
      throw new Error('db down');
    };
    const saveError = new Error('save failed');

    await expect(
      uploads.uploadAndSave(file, async () => {
        throw saveError;
      }),
    ).rejects.toBe(saveError);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ publicId: 'realestate/test/documents/7/generated-id' }),
      expect.stringContaining('orphan cleanup'),
    );
  });

  it('does not try to delete anything when the upload itself fails', async () => {
    const { storage, uploads } = setup();
    storage.upload = async () => {
      throw new Error('upload rejected');
    };
    const save = jest.fn();

    await expect(uploads.uploadAndSave(file, save)).rejects.toThrow('upload rejected');

    expect(save).not.toHaveBeenCalled();
    expect(storage.calls).toEqual([]);
  });
});
