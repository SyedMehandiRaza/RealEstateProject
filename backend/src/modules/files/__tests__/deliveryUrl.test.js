import { env } from '../../../config/env.js';
import { createFakeStorage } from '../../../test/fileFakes.js';
import { cloudinaryStorage } from '../cloudinary.storage.js';
import { FILE_URL_TTL_MS, presentFile } from '../fileDelivery.js';

// Signed, expiring delivery URLs for 'authenticated' Cloudinary files (PROP-004, PROP-DEC-019, -022).
// Computed locally from the API secret: no call to Cloudinary.

const expiresAt = new Date('2026-10-31T11:00:00Z');
const EXPIRES_AT_SECONDS = '1793444400'; // 2026-10-31T11:00:00Z
const id = (name) => `${env.cloudinaryPrefix}properties/1/${name}`;

const paramsOf = (url) => Object.fromEntries(new URL(url).searchParams);

describe('cloudinaryStorage.deliveryUrl', () => {
  it('signs an inline URL for an image that expires at the given time', () => {
    const url = cloudinaryStorage.deliveryUrl({
      publicId: id('front'),
      resourceType: 'image',
      deliveryType: 'authenticated',
      mimeType: 'image/jpeg',
      expiresAt,
    });

    const { origin, pathname } = new URL(url);
    expect(`${origin}${pathname}`).toBe(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/download`,
    );
    const params = paramsOf(url);
    expect(params).toMatchObject({
      public_id: id('front'),
      format: 'jpg',
      type: 'authenticated',
      expires_at: EXPIRES_AT_SECONDS,
      api_key: env.CLOUDINARY_API_KEY,
    });
    expect(params.signature).toMatch(/^[0-9a-f]{40,64}$/);
    expect(params).not.toHaveProperty('attachment');
    expect(url).not.toContain(env.CLOUDINARY_API_SECRET);
  });

  it('asks for a download when attachment is set', () => {
    const url = cloudinaryStorage.deliveryUrl({
      publicId: id('walkthrough'),
      resourceType: 'video',
      deliveryType: 'authenticated',
      mimeType: 'video/mp4',
      expiresAt,
      attachment: true,
    });
    expect(new URL(url).pathname).toMatch(/\/video\/download$/);
    expect(paramsOf(url)).toMatchObject({ format: 'mp4', attachment: 'true' });
  });

  it('keeps the extension of a raw file in its public id and sends no format', () => {
    const url = cloudinaryStorage.deliveryUrl({
      publicId: id('rera.pdf'),
      resourceType: 'raw',
      deliveryType: 'authenticated',
      mimeType: 'application/pdf',
      expiresAt,
    });
    expect(new URL(url).pathname).toMatch(/\/raw\/download$/);
    expect(paramsOf(url)).toMatchObject({ public_id: id('rera.pdf') });
    expect(paramsOf(url)).not.toHaveProperty('format');
  });

  it('signs the expiry: another expiry gives another signature', () => {
    const file = {
      publicId: id('front'),
      resourceType: 'image',
      deliveryType: 'authenticated',
      mimeType: 'image/png',
    };
    const a = paramsOf(cloudinaryStorage.deliveryUrl({ ...file, expiresAt }));
    const b = paramsOf(
      cloudinaryStorage.deliveryUrl({ ...file, expiresAt: new Date(expiresAt.getTime() + 1000) }),
    );
    expect(a.signature).not.toBe(b.signature);
  });

  it('refuses a file outside the app prefix', () => {
    expect(() =>
      cloudinaryStorage.deliveryUrl({
        publicId: 'someone-else/file',
        resourceType: 'image',
        deliveryType: 'authenticated',
        mimeType: 'image/png',
        expiresAt,
      }),
    ).toThrow(/outside/);
  });
});

describe('fake storage deliveryUrl', () => {
  it('returns a predictable URL with the public id, the expiry and the disposition', () => {
    const storage = createFakeStorage();
    const file = {
      publicId: 'realestate/test/p/1',
      resourceType: 'image',
      deliveryType: 'authenticated',
      mimeType: 'image/png',
    };
    expect(storage.deliveryUrl({ ...file, expiresAt })).toBe(
      'https://files.test/image/realestate/test/p/1?expires=1793444400&disposition=inline',
    );
    expect(storage.deliveryUrl({ ...file, expiresAt, attachment: true })).toBe(
      'https://files.test/image/realestate/test/p/1?expires=1793444400&disposition=attachment',
    );
  });
});

describe('presentFile', () => {
  const row = {
    id: 7,
    cloudinaryPublicId: 'realestate/test/p/7',
    cloudinaryResourceType: 'image',
    originalFilename: 'front.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 2048,
  };

  it('gives the response shape with a URL valid for 1 hour, and no public id', () => {
    const now = new Date('2026-10-31T10:00:00Z');
    const file = presentFile(row, { storage: createFakeStorage(), now });

    expect(FILE_URL_TTL_MS).toBe(60 * 60_000);
    expect(file).toEqual({
      id: 7,
      fileName: 'front.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2048,
      url: 'https://files.test/image/realestate/test/p/7?expires=1793444400&disposition=inline',
      urlExpiresAt: '2026-10-31T11:00:00.000Z',
    });
    expect(Object.keys(file).some((key) => /public|cloudinary/i.test(key))).toBe(false);
  });
});
