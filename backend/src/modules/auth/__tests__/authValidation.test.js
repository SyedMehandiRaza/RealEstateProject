import request from 'supertest';
import { commonMessages, DOCUMENT_KINDS } from '@real-estate/shared';
import {
  documentUploadCases,
  forgotPasswordCases,
  loginCases,
  professionalInfoCases,
  resendCodeCases,
  resetPasswordCases,
  selectCountryCases,
  signUpCases,
  verifyCodeCases,
} from '@real-estate/shared/testing';
import { createTestApp } from '../../../test/testApp.js';
import { fileBytes } from '../../../test/documentFiles.js';
import { submitDocuments } from '../../../test/authFlows.js';
import { signAccessToken } from '../../../utils/jwt.js';

// Validation parity: every invalid payload of the shared schema tests, posted to the API, comes back as
// 422 with the same shared message under the same field. Validation runs before any query, so these
// need no database. Each case is its own test, so the per-IP limiter (reset before each test) never trips.

const ROUTES = [
  ['POST /api/auth/sign-up', '/api/auth/sign-up', signUpCases],
  ['POST /api/auth/verify-email', '/api/auth/verify-email', verifyCodeCases],
  ['POST /api/auth/verify-email/resend', '/api/auth/verify-email/resend', resendCodeCases],
  ['POST /api/auth/login', '/api/auth/login', loginCases],
  ['POST /api/auth/password/forgot', '/api/auth/password/forgot', forgotPasswordCases],
  ['POST /api/auth/password/resend', '/api/auth/password/resend', resendCodeCases],
  ['POST /api/auth/password/verify', '/api/auth/password/verify', verifyCodeCases],
  ['POST /api/auth/password/reset', '/api/auth/password/reset', resetPasswordCases],
];

describe.each(ROUTES)('%s rejects invalid input with the shared messages', (_name, path, cases) => {
  const { app, mailer } = createTestApp();

  it.each(cases.invalid)('$name', async ({ input, field, message }) => {
    const res = await request(app)
      .post(path)
      .send({ ...cases.valid, ...input });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe(commonMessages.invalidInput);
    expect(res.body.error.fields[field]).toContain(message);
    expect(mailer.messages).toEqual([]);
  });
});

// Signed-in routes validate after authenticate and authorize, so these send a Buyer access token. The
// Account in the token need not exist: validation answers before any query.
describe('PUT /api/auth/me/country rejects invalid input with the shared messages', () => {
  const { app } = createTestApp();
  const token = signAccessToken({ userId: 1, roles: ['buyer'] });

  it.each(selectCountryCases.invalid)('$name', async ({ input, field, message }) => {
    const res = await request(app)
      .put('/api/auth/me/country')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...selectCountryCases.valid, ...input });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe(commonMessages.invalidInput);
    expect(res.body.error.fields[field]).toEqual([message]);
  });
});

describe('PUT /api/auth/me/professional-profile rejects invalid input with the shared messages', () => {
  const { app } = createTestApp();
  const token = signAccessToken({ userId: 1, roles: ['developer'] });

  it.each(professionalInfoCases.invalid)('$name', async ({ input, field, message }) => {
    const res = await request(app)
      .put('/api/auth/me/professional-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...professionalInfoCases.valid, ...input });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe(commonMessages.invalidInput);
    expect(res.body.error.fields[field]).toEqual([message]);
  });
});

// POST /me/documents builds documentUploadSchema's input from each multipart file part (its name is the
// kind, then its file name, type and size) plus the idDocumentType text field, and reports a file's
// errors under "documents.<kind>.<field>". Each shared case that a real file part can express is sent
// as one; the others (a kind that is not a part name, no file name, a size that is not a byte count,
// no type) cannot occur over multipart. "idDocumentType on a certificate" is answered at
// fields.idDocumentType instead (covered in submitDocuments.int.test.js).
const SCHEMA_FIELDS = ['documentKind', 'idDocumentType', 'fileName', 'mimeType', 'sizeBytes'];
const multipartCase = ({ input, field, message, name }) => {
  const document = { ...documentUploadCases.valid, ...input };
  const sendable =
    DOCUMENT_KINDS.includes(document.documentKind) &&
    typeof document.fileName === 'string' &&
    document.fileName.trim() !== '' &&
    typeof document.mimeType === 'string' &&
    Number.isInteger(document.sizeBytes) &&
    name !== 'idDocumentType on a certificate';
  if (!sendable) return null;
  const extra = Object.fromEntries(Object.entries(input).filter(([key]) => !SCHEMA_FIELDS.includes(key)));
  return {
    name,
    payload: {
      files: {
        [document.documentKind]: {
          buffer: fileBytes(document.mimeType, document.sizeBytes),
          fileName: document.fileName,
          mimeType: document.mimeType,
        },
      },
      idDocumentType: document.idDocumentType,
      fields: extra,
    },
    key: field === '_form' ? '_form' : `documents.${document.documentKind}.${field}`,
    message,
  };
};
const multipartCases = documentUploadCases.invalid.map(multipartCase).filter(Boolean);

describe('POST /api/auth/me/documents rejects invalid files with the shared messages', () => {
  const { app, storage } = createTestApp();
  const token = signAccessToken({ userId: 1, roles: ['developer'] });

  // 9 of the 18 shared cases; a new shared case must be sorted into one group or the other here.
  it('sends every case a file part can express', () => {
    expect(multipartCases).toHaveLength(9);
  });

  it.each(multipartCases)('$name', async ({ payload, key, message }) => {
    const res = await submitDocuments(app, token, payload);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe(commonMessages.invalidInput);
    expect(res.body.error.fields[key]).toEqual([message]);
    expect(storage.calls).toEqual([]);
  });
});

describe('per-IP auth limiter', () => {
  it('applies one shared count to sign-up, verify-email, its resend, login and the password reset routes', async () => {
    const { app } = createTestApp();
    const invalid = { ...signUpCases.valid, role: 'admin' };
    for (let i = 0; i < 20; i += 1) {
      expect((await request(app).post('/api/auth/sign-up').send(invalid)).status).toBe(422);
    }

    const signUp = await request(app).post('/api/auth/sign-up').send(invalid);
    const verify = await request(app).post('/api/auth/verify-email').send(verifyCodeCases.valid);
    const resend = await request(app).post('/api/auth/verify-email/resend').send(resendCodeCases.valid);
    const login = await request(app).post('/api/auth/login').send(loginCases.valid);
    const passwordRoutes = [
      ['/api/auth/password/forgot', forgotPasswordCases.valid],
      ['/api/auth/password/resend', resendCodeCases.valid],
      ['/api/auth/password/verify', verifyCodeCases.valid],
      ['/api/auth/password/reset', resetPasswordCases.valid],
    ];
    const passwordAnswers = [];
    for (const [path, body] of passwordRoutes) passwordAnswers.push(await request(app).post(path).send(body));

    expect(signUp.status).toBe(429);
    expect(signUp.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(verify.status).toBe(429);
    expect(resend.status).toBe(429);
    expect(login.status).toBe(429);
    for (const res of passwordAnswers) expect(res.status).toBe(429);
  });
});
