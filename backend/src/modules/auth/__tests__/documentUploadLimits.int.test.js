import request from 'supertest';
import { authMessages, ERROR_CODES } from '@real-estate/shared';
import { professionalInfoCases } from '@real-estate/shared/testing';
import { DOCUMENT_UPLOAD_RATE_LIMIT } from '../../../middlewares/rateLimiter.js';
import { createTestApp } from '../../../test/testApp.js';
import { documentSet } from '../../../test/documentFiles.js';
import {
  DOCUMENTS,
  saveProfessionalProfile,
  signUpAndVerify,
  submitDocuments,
} from '../../../test/authFlows.js';
import { signAccessToken } from '../../../utils/jwt.js';
import { MAX_DOCUMENTS_BODY_BYTES } from '../documentUpload.js';

// TASK-053: POST /me/documents buffers up to 3 x 10 MB, so the cheap refusals run before multer reads
// the body, and each Account gets a submission budget and one upload at a time.

const errorBody = (code, message = ERROR_CODES[code].message) => ({
  success: false,
  error: { code, message },
});
const individual = { ...professionalInfoCases.valid, developerType: 'individual', companyName: undefined };

// A body multer cannot read: declared multipart, but no boundary in it.
const unreadableBody = (accessToken) =>
  request(app)
    .post(DOCUMENTS)
    .set('Authorization', `Bearer ${accessToken}`)
    .set('Content-Type', 'multipart/form-data; boundary=never-sent')
    .send('not multipart at all');

let app;
let mailer;
let storage;

beforeEach(() => {
  ({ app, mailer, storage } = createTestApp());
});

async function developer(email) {
  const verified = await signUpAndVerify(app, mailer, { role: 'developer', ...(email && { email }) });
  return verified.body.data.accessToken;
}

async function developerWithProfile() {
  const accessToken = await developer();
  expect((await saveProfessionalProfile(app, accessToken, individual)).status).toBe(200);
  return accessToken;
}

describe('POST /api/auth/me/documents limits (TASK-053)', () => {
  describe('eligibility, checked before the body is parsed', () => {
    it('answers 403 to a Developer without Professional info, whatever the body', async () => {
      const res = await unreadableBody(await developer());

      expect(res.status).toBe(403);
      expect(res.body).toEqual(errorBody('FORBIDDEN'));
      expect(storage.calls).toEqual([]);
    });

    it('answers 409 when every required document is already under review, whatever the body', async () => {
      const accessToken = await developerWithProfile();
      expect((await submitDocuments(app, accessToken, documentSet('individual'))).status).toBe(201);
      const uploads = storage.calls.length;

      const res = await unreadableBody(accessToken);

      expect(res.status).toBe(409);
      expect(res.body).toEqual(errorBody('CONFLICT', authMessages.api.documentAlreadySubmitted));
      expect(storage.calls).toHaveLength(uploads);
    });

    it('answers 401 when the Account no longer exists', async () => {
      const res = await unreadableBody(signAccessToken({ userId: 999999, roles: ['developer'] }));
      expect(res.status).toBe(401);
      expect(res.body).toEqual(errorBody('UNAUTHORIZED'));
    });

    it('still parses the body of an eligible Developer', async () => {
      const res = await unreadableBody(await developerWithProfile());
      expect(res.status).toBe(400);
      expect(res.body).toEqual(errorBody('BAD_REQUEST'));
    });
  });

  it('refuses a declared Content-Length above the total limit before anything else, and closes', async () => {
    // No Account behind this token: the size check answers before the eligibility query.
    const accessToken = signAccessToken({ userId: 999999, roles: ['developer'] });

    const res = await request(app)
      .post(DOCUMENTS)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Content-Type', 'multipart/form-data; boundary=x')
      .set('Content-Length', String(MAX_DOCUMENTS_BODY_BYTES + 1))
      .send('--x--');

    expect(res.status).toBe(400);
    expect(res.body).toEqual(errorBody('BAD_REQUEST'));
    expect(res.headers.connection).toBe('close');
  });

  it(`answers 429 to the ${DOCUMENT_UPLOAD_RATE_LIMIT + 1}th submission of an Account within the hour`, async () => {
    const accessToken = await developer();
    for (let i = 0; i < DOCUMENT_UPLOAD_RATE_LIMIT; i += 1) {
      expect((await unreadableBody(accessToken)).status).toBe(403);
    }

    const res = await unreadableBody(accessToken);

    expect(res.status).toBe(429);
    expect(res.body).toEqual(errorBody('TOO_MANY_REQUESTS'));
    // Another Account keeps its own budget.
    expect((await unreadableBody(await developer('other.developer@example.com'))).status).toBe(403);
  });

  it('answers 429 to a second upload of the same Account while the first is in flight', async () => {
    const accessToken = await developerWithProfile();
    // Hold the first submission's uploads until the second request has been answered.
    const upload = storage.upload.bind(storage);
    let started;
    const uploadStarted = new Promise((resolve) => (started = resolve));
    let release;
    const released = new Promise((resolve) => (release = resolve));
    storage.upload = async (...args) => {
      started();
      await released;
      return upload(...args);
    };

    const first = submitDocuments(app, accessToken, documentSet('individual')).then();
    await uploadStarted;
    const second = await submitDocuments(app, accessToken, documentSet('individual'));
    release();

    expect(second.status).toBe(429);
    expect(second.body).toEqual(errorBody('TOO_MANY_REQUESTS'));
    expect((await first).status).toBe(201);
  });
});
