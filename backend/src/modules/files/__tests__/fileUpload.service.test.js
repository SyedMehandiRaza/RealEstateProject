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

describe('uploadAllAndSave (several uploads in parallel, then one DB save)', () => {
  const files = ['a', 'b', 'c'].map((name) => ({
    buffer: Buffer.from(name),
    folder: 'documents/7',
    resourceType: 'image',
  }));

  function setupUnique() {
    const storage = createFakeStorage({ uniqueIds: true });
    const repository = createFakeQueueRepository();
    const logger = silentLogger();
    const fileDeletion = createFileDeletionService({ repository, storage, logger });
    const uploads = createFileUploadService({ storage, fileDeletion, logger });
    return { storage, repository, logger, uploads };
  }

  // Holds every upload until release() so a test can see which uploads started together.
  function holdUploads(storage, { failing = [] } = {}) {
    const upload = storage.upload.bind(storage);
    const started = [];
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    storage.upload = async (buffer, options) => {
      const index = started.push(options.publicId) - 1;
      await gate;
      if (failing.includes(index)) throw new Error(`upload ${index} rejected`);
      return upload(buffer, options);
    };
    return { started, release };
  }

  const ids = [1, 2, 3].map((n) => `realestate/test/documents/7/generated-id-${n}`);

  it('starts every upload before any finishes, then saves the files in the given order', async () => {
    const { storage, uploads } = setupUnique();
    const { started, release } = holdUploads(storage);
    const save = jest.fn(async (uploaded) => uploaded.map((file) => file.publicId));

    const result = uploads.uploadAllAndSave(files, save);
    await new Promise(setImmediate);
    expect(started).toEqual(ids);
    expect(save).not.toHaveBeenCalled();
    release();

    expect(await result).toEqual(ids);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0]).toEqual(
      ids.map((publicId) => ({ publicId, resourceType: 'image', deliveryType: 'authenticated' })),
    );
    expect(storage.calls.filter(([call]) => call === 'destroy')).toEqual([]);
  });

  it('deletes every upload that succeeded when one fails, rethrows that error and saves nothing', async () => {
    const { storage, uploads } = setupUnique();
    const { release } = holdUploads(storage, { failing: [0] });
    const save = jest.fn();

    const result = uploads.uploadAllAndSave(files, save);
    release();

    await expect(result).rejects.toThrow('upload 0 rejected');
    expect(save).not.toHaveBeenCalled();
    expect(
      storage.calls
        .filter(([call]) => call === 'destroy')
        .map(([, id]) => id)
        .sort(),
    ).toEqual([ids[1], ids[2]]);
  });

  it('rethrows the first failed upload in file order when several fail', async () => {
    const { storage, uploads } = setupUnique();
    const { release } = holdUploads(storage, { failing: [1, 2] });

    const result = uploads.uploadAllAndSave(files, jest.fn());
    release();

    await expect(result).rejects.toThrow('upload 1 rejected');
    expect(storage.calls.filter(([call]) => call === 'destroy')).toEqual([['destroy', ids[0]]]);
  });

  it('deletes every uploaded file when the save fails after all uploads, and rethrows the save error', async () => {
    const { storage, repository, uploads } = setupUnique();
    const saveError = new Error('DB down');

    await expect(
      uploads.uploadAllAndSave(files, async () => {
        throw saveError;
      }),
    ).rejects.toBe(saveError);

    expect(
      storage.calls
        .filter(([call]) => call === 'destroy')
        .map(([, id]) => id)
        .sort(),
    ).toEqual(ids);
    expect(repository.rows).toEqual([]);
  });

  it('queues the files whose immediate delete fails, with reason save_failed', async () => {
    const { storage, repository, uploads } = setupUnique();
    storage.failNextDestroys(2);

    await expect(
      uploads.uploadAllAndSave(files, async () => {
        throw new Error('DB down');
      }),
    ).rejects.toThrow('DB down');

    expect(repository.rows).toHaveLength(2);
    expect(repository.rows.every((row) => row.reason === 'save_failed' && row.status === 'pending')).toBe(
      true,
    );
  });

  it('still rethrows the original error and logs each file it could neither delete nor queue', async () => {
    const { storage, repository, logger, uploads } = setupUnique();
    storage.failNextDestroys(3);
    repository.insertMany = async () => {
      throw new Error('db down');
    };
    const saveError = new Error('save failed');

    await expect(
      uploads.uploadAllAndSave(files, async () => {
        throw saveError;
      }),
    ).rejects.toBe(saveError);

    expect(logger.error).toHaveBeenCalledTimes(3);
    for (const publicId of ids) {
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ publicId }),
        expect.stringContaining('orphan cleanup'),
      );
    }
  });

  it('saves an empty list without uploading anything', async () => {
    const { storage, uploads } = setupUnique();
    const save = jest.fn(async () => 'saved');

    expect(await uploads.uploadAllAndSave([], save)).toBe('saved');
    expect(save).toHaveBeenCalledWith([]);
    expect(storage.calls).toEqual([]);
  });
});
