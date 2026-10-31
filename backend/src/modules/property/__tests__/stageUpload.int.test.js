import request from 'supertest';
import { commonMessages, LIMITS, propertyMessages as m } from '@real-estate/shared';
import { env } from '../../../config/env.js';
import { PROPERTY_UPLOAD_RATE_LIMIT } from '../../../middlewares/rateLimiter.js';
import { fileBytes } from '../../../test/documentFiles.js';
import { developerSession } from '../../../test/propertyFactories.js';
import { createTestApp } from '../../../test/testApp.js';
import { createUploadTokens } from '../uploadToken.js';

// POST /api/properties/uploads (PROP-007, PROP-DEC-012): the wizard stages each file and gets a token.

jest.setTimeout(120_000); // sessions hash passwords; one test sends 200 requests

const UPLOADS = '/api/properties/uploads';

function post(app, token, { purpose, file, fileName = 'file.bin', fields = {} } = {}) {
  const req = request(app).post(UPLOADS).set('Authorization', `Bearer ${token}`);
  if (purpose !== undefined) req.field('purpose', purpose);
  for (const [name, value] of Object.entries(fields)) req.field(name, value);
  if (file) req.attach('file', file, fileName);
  return req;
}

describe('POST /api/properties/uploads', () => {
  let app;
  let storage;
  let clock;
  let session;
  beforeEach(async () => {
    ({ app, storage, clock } = createTestApp());
    session = await developerSession(app);
  });

  const uploads = () => storage.calls.filter(([call]) => call === 'upload');

  it.each([
    ['image', 'image/jpeg', 'front.jpg', 'image'],
    ['image', 'image/png', 'plan.png', 'image'],
    ['video', 'video/mp4', 'walkthrough.mp4', 'video'],
    ['tour_360', 'video/mp4', 'tour.mp4', 'video'],
    ['floor_plan', 'application/pdf', 'fp.pdf', 'raw'],
    ['document', 'image/png', 'noc.png', 'image'],
  ])('stages a %s (%s) and returns a token for it', async (purpose, mimeType, fileName, resourceType) => {
    const res = await post(app, session.token, { purpose, file: fileBytes(mimeType, 4096), fileName });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      data: {
        upload: { uploadToken: expect.any(String), purpose, fileName, mimeType, sizeBytes: 4096 },
      },
    });
    const [[, publicId]] = uploads();
    expect(publicId.startsWith(`${storage.prefix}properties/${session.account.id}/staging/`)).toBe(true);

    const tokens = createUploadTokens({ parentSecret: env.JWT_ACCESS_SECRET, clock });
    const read = tokens.read(res.body.data.upload.uploadToken, {
      ownerId: session.account.id,
      purposes: [purpose],
    });
    expect(read).toMatchObject({ publicId, resourceType, mimeType, sizeBytes: 4096, fileName });
  });

  it.each([
    ['no file', { purpose: 'image' }, 'file', m.file.required],
    [
      'an empty file',
      { purpose: 'image', file: Buffer.alloc(0), fileName: 'empty.jpg' },
      'file',
      m.file.sizeBytes.empty,
    ],
    [
      'an image over 10 MB',
      {
        purpose: 'image',
        file: fileBytes('image/jpeg', LIMITS.property.maxFileBytes + 1),
        fileName: 'big.jpg',
      },
      'file',
      m.file.sizeBytes.max,
    ],
    [
      'a PDF named .jpg for an image (type from the bytes)',
      { purpose: 'image', file: fileBytes('application/pdf'), fileName: 'fake.jpg' },
      'file',
      m.file.mimeType.image,
    ],
    [
      'a PNG for a video',
      { purpose: 'video', file: fileBytes('image/png'), fileName: 'v.mp4' },
      'file',
      m.file.mimeType.video,
    ],
    [
      'a GIF for a document',
      { purpose: 'document', file: fileBytes('image/gif'), fileName: 'd.gif' },
      'file',
      m.file.mimeType.document,
    ],
    [
      'a file name over 255 characters',
      {
        purpose: 'image',
        file: fileBytes('image/jpeg'),
        fileName: `${'a'.repeat(LIMITS.property.fileName.max)}.jpg`,
      },
      'file',
      m.file.fileName.max,
    ],
    ['no purpose', { file: fileBytes('image/jpeg'), fileName: 'a.jpg' }, 'purpose', m.file.purpose.invalid],
    [
      'an unknown purpose',
      { purpose: 'avatar', file: fileBytes('image/jpeg'), fileName: 'a.jpg' },
      'purpose',
      m.file.purpose.invalid,
    ],
    [
      'an update image purpose (not a wizard upload)',
      { purpose: 'update_image', file: fileBytes('image/jpeg'), fileName: 'a.jpg' },
      'purpose',
      m.file.purpose.invalid,
    ],
    [
      'an extra field',
      { purpose: 'image', file: fileBytes('image/jpeg'), fileName: 'a.jpg', fields: { title: 'x' } },
      '_form',
      commonMessages.unknownField,
    ],
  ])('refuses %s with 422 and uploads nothing', async (_name, input, field, message) => {
    const res = await post(app, session.token, input);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields[field]).toEqual([message]);
    expect(uploads()).toEqual([]);
  });

  it('refuses a video over 40 MB with 422 and uploads nothing', async () => {
    const res = await post(app, session.token, {
      purpose: 'video',
      file: fileBytes('video/mp4', LIMITS.property.maxVideoBytes + 1),
      fileName: 'long.mp4',
    });
    expect(res.status).toBe(422);
    expect(res.body.error.fields.file).toEqual([m.file.sizeBytes.maxVideo]);
    expect(uploads()).toEqual([]);
  });

  it('refuses a second file part with 422 on _form', async () => {
    const res = await request(app)
      .post(UPLOADS)
      .set('Authorization', `Bearer ${session.token}`)
      .field('purpose', 'image')
      .attach('file', fileBytes('image/jpeg'), 'a.jpg')
      .attach('file', fileBytes('image/jpeg'), 'b.jpg');
    expect(res.status).toBe(422);
    expect(res.body.error.fields._form).toEqual([commonMessages.unknownField]);
    expect(uploads()).toEqual([]);
  });

  it('answers an unreadable multipart body with 400 BAD_REQUEST', async () => {
    const res = await request(app)
      .post(UPLOADS)
      .set('Authorization', `Bearer ${session.token}`)
      .set('Content-Type', 'multipart/form-data; boundary=xyz')
      .send('--xyz\r\nContent-Disposition: form-data; name="purpose"\r\n\r\nimage\r\n--xyz\r\nbroken');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('allows 200 uploads per hour per account, then answers 429', async () => {
    expect(PROPERTY_UPLOAD_RATE_LIMIT).toBe(200);
    for (let i = 0; i < PROPERTY_UPLOAD_RATE_LIMIT; i += 1) {
      expect((await post(app, session.token, { purpose: 'image' })).status).toBe(422);
    }
    const image = { purpose: 'image', file: fileBytes('image/jpeg'), fileName: 'a.jpg' };
    const blocked = await post(app, session.token, image);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');

    const other = await developerSession(app);
    expect((await post(app, other.token, image)).status).toBe(201);
  });

  it.each([
    ['without a token', null, 401, 'UNAUTHORIZED'],
    ['as a Buyer', 'buyer', 403, 'FORBIDDEN'],
    ['as a Developer who is not Active', 'notActive', 403, 'DEVELOPER_NOT_ACTIVE'],
  ])('refuses a request %s and uploads nothing', async (_name, state, status, code) => {
    let req = request(app).post(UPLOADS);
    if (state) req = req.set('Authorization', `Bearer ${(await developerSession(app, state)).token}`);
    const res = await req.field('purpose', 'image').attach('file', fileBytes('image/jpeg'), 'a.jpg');
    expect({ status: res.status, code: res.body.error.code }).toEqual({ status, code });
    expect(uploads()).toEqual([]);
  });
});
