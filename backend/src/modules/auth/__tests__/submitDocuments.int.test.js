import request from 'supertest';
import { authMessages, commonMessages, ERROR_CODES, LIMITS } from '@real-estate/shared';
import { professionalInfoCases } from '@real-estate/shared/testing';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import { documentFile, documentSet } from '../../../test/documentFiles.js';
import {
  DOCUMENTS,
  saveProfessionalProfile,
  signUpAndVerify,
  submitDocuments,
} from '../../../test/authFlows.js';

const m = authMessages;
const errorBody = (code) => ({ success: false, error: { code, message: ERROR_CODES[code].message } });
const company = professionalInfoCases.valid;
const individual = { ...company, developerType: 'individual', companyName: undefined };

const documentsOf = (profileId) =>
  models.VerificationDocument.findAll({
    where: { professionalProfileId: profileId },
    order: [['id', 'ASC']],
  });
const queuedDeletions = () => models.PendingFileDeletion.findAll({ order: [['id', 'ASC']] });

// Files the fake storage holds: uploaded and not destroyed since.
const storedFiles = (storage) => {
  const live = new Set();
  for (const [call, publicId] of storage.calls) {
    if (call === 'upload') live.add(publicId);
    else live.delete(publicId);
  }
  return [...live];
};

const pendingEntry = (documentKind, fileName, sizeBytes = 2048) => ({
  documentKind,
  status: 'pending',
  rejectionReason: null,
  fileName,
  sizeBytes,
});

describe('POST /api/auth/me/documents (first submission)', () => {
  let app;
  let mailer;
  let storage;

  beforeEach(() => {
    ({ app, mailer, storage } = createTestApp());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // A verified Developer with Professional info of the given type. Returns { accessToken, profileId }.
  async function developerWithProfile(info = individual) {
    const verified = await signUpAndVerify(app, mailer, { role: 'developer' });
    const { accessToken } = verified.body.data;
    const saved = await saveProfessionalProfile(app, accessToken, info);
    expect(saved.status).toBe(200);
    return { accessToken, profileId: saved.body.data.profile.id };
  }

  describe('success', () => {
    it('stores an Individual set (2 documents) and answers 201 { verification }', async () => {
      const { accessToken, profileId } = await developerWithProfile(individual);

      const res = await submitDocuments(app, accessToken, documentSet('individual'));

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        success: true,
        data: {
          verification: {
            status: 'under_review',
            documents: [
              pendingEntry('government_id', 'passport.pdf'),
              pendingEntry('profile_photo', 'me.png'),
            ],
          },
        },
      });
      const rows = await documentsOf(profileId);
      expect(rows.map((row) => row.get({ plain: true }))).toEqual([
        expect.objectContaining({
          documentKind: 'government_id',
          idDocumentType: 'passport',
          cloudinaryResourceType: 'raw',
          originalFilename: 'passport.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
          status: 'pending',
          rejectionReason: null,
          reviewedAt: null,
        }),
        expect.objectContaining({
          documentKind: 'profile_photo',
          idDocumentType: null,
          cloudinaryResourceType: 'image',
          originalFilename: 'me.png',
          mimeType: 'image/png',
        }),
      ]);
      // Every file under realestate/<env>/documents/<profile id>/, each referenced by its row.
      expect(storedFiles(storage).sort()).toEqual(rows.map((row) => row.cloudinaryPublicId).sort());
      for (const row of rows) {
        expect(row.cloudinaryPublicId.startsWith(`realestate/test/documents/${profileId}/`)).toBe(true);
      }
      expect(await queuedDeletions()).toEqual([]);
    });

    it('stores a Company set (3 documents)', async () => {
      const { accessToken, profileId } = await developerWithProfile(company);

      const res = await submitDocuments(app, accessToken, documentSet('company'));

      expect(res.status).toBe(201);
      expect(res.body.data.verification).toEqual({
        status: 'under_review',
        documents: [
          pendingEntry('government_id', 'passport.pdf'),
          pendingEntry('company_registration_certificate', 'certificate.pdf'),
          pendingEntry('profile_photo', 'me.png'),
        ],
      });
      expect(await documentsOf(profileId)).toHaveLength(3);
      expect(storedFiles(storage)).toHaveLength(3);
    });

    it('accepts JPEG photos and image IDs, and keeps a non-ASCII file name', async () => {
      const { accessToken, profileId } = await developerWithProfile(individual);

      const res = await submitDocuments(app, accessToken, {
        files: {
          government_id: documentFile({ fileName: 'licencia-año.jpg', mimeType: 'image/jpeg' }),
          profile_photo: documentFile({ fileName: 'foto.jpg', mimeType: 'image/jpeg', size: 500 }),
        },
        idDocumentType: 'driving_license',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.verification.documents[0].fileName).toBe('licencia-año.jpg');
      const [id] = await documentsOf(profileId);
      expect(id).toMatchObject({ idDocumentType: 'driving_license', cloudinaryResourceType: 'image' });
    });

    it('accepts a file of exactly 10 MB', async () => {
      const { accessToken } = await developerWithProfile(individual);
      const set = documentSet('individual');
      set.files.government_id = documentFile({ size: LIMITS.auth.maxFileBytes });

      const res = await submitDocuments(app, accessToken, set);

      expect(res.status).toBe(201);
      expect(res.body.data.verification.documents[0].sizeBytes).toBe(LIMITS.auth.maxFileBytes);
    });
  });

  describe('required documents (DEC-022, Q-036)', () => {
    it('answers 422 for a Company without the certificate, uploading nothing', async () => {
      const { accessToken, profileId } = await developerWithProfile(company);

      const res = await submitDocuments(app, accessToken, documentSet('individual'));

      expect(res.status).toBe(422);
      expect(res.body.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: commonMessages.invalidInput,
        fields: {
          'documents.company_registration_certificate.file': [
            m.documents.required.company_registration_certificate,
          ],
        },
      });
      expect(storage.calls).toEqual([]);
      expect(await documentsOf(profileId)).toEqual([]);
    });

    it('asks for every required kind when nothing is sent', async () => {
      const { accessToken } = await developerWithProfile(company);

      const res = await submitDocuments(app, accessToken, {});

      expect(res.status).toBe(422);
      expect(res.body.error.fields).toEqual({
        'documents.government_id.file': [m.documents.required.government_id],
        'documents.company_registration_certificate.file': [
          m.documents.required.company_registration_certificate,
        ],
        'documents.profile_photo.file': [m.documents.required.profile_photo],
      });
    });

    it('answers 422 for an Individual missing the Profile Photo', async () => {
      const { accessToken } = await developerWithProfile(individual);
      const set = documentSet('individual');
      delete set.files.profile_photo;

      const res = await submitDocuments(app, accessToken, set);

      expect(res.status).toBe(422);
      expect(res.body.error.fields).toEqual({
        'documents.profile_photo.file': [m.documents.required.profile_photo],
      });
      expect(storage.calls).toEqual([]);
    });

    it('refuses a certificate from an Individual (not a required kind)', async () => {
      const { accessToken, profileId } = await developerWithProfile(individual);

      const res = await submitDocuments(app, accessToken, documentSet('company'));

      expect(res.status).toBe(422);
      expect(res.body.error.fields).toEqual({
        'documents.company_registration_certificate.file': [commonMessages.unknownField],
      });
      expect(await documentsOf(profileId)).toEqual([]);
    });
  });

  describe('per-file checks', () => {
    it('answers 422 mimeType.invalid for a PNG declared as a PDF (sniffed), uploading nothing', async () => {
      const { accessToken } = await developerWithProfile(individual);
      const set = documentSet('individual');
      set.files.government_id = documentFile({ mimeType: 'application/pdf', bytesOf: 'image/png' });

      const res = await submitDocuments(app, accessToken, set);

      expect(res.status).toBe(422);
      expect(res.body.error.fields).toEqual({ 'documents.government_id.mimeType': [m.mimeType.invalid] });
      expect(storage.calls).toEqual([]);
    });

    it('answers 422 sizeBytes.max for a file over 10 MB', async () => {
      const { accessToken } = await developerWithProfile(individual);
      const set = documentSet('individual');
      set.files.profile_photo = documentFile({ mimeType: 'image/png', size: LIMITS.auth.maxFileBytes + 1 });

      const res = await submitDocuments(app, accessToken, set);

      expect(res.status).toBe(422);
      expect(res.body.error.fields).toEqual({ 'documents.profile_photo.sizeBytes': [m.sizeBytes.max] });
      expect(storage.calls).toEqual([]);
    });

    // The schema's cross-field rules (such as the missing ID type) run only once the base fields pass,
    // as in the browser, so the Government ID reports only its type here.
    it('reports every bad file together', async () => {
      const { accessToken } = await developerWithProfile(individual);

      const res = await submitDocuments(app, accessToken, {
        files: {
          government_id: documentFile({ mimeType: 'image/gif' }),
          profile_photo: documentFile({ fileName: 'me.pdf' }),
        },
      });

      expect(res.status).toBe(422);
      expect(res.body.error.fields).toEqual({
        'documents.government_id.mimeType': [m.mimeType.invalid],
        'documents.profile_photo.mimeType': [m.mimeType.photo],
      });
    });

    it('answers 422 at idDocumentType when it comes without a Government ID', async () => {
      const { accessToken } = await developerWithProfile(individual);

      const res = await submitDocuments(app, accessToken, {
        files: { profile_photo: documentFile({ fileName: 'me.png', mimeType: 'image/png' }) },
        idDocumentType: 'passport',
      });

      expect(res.status).toBe(422);
      expect(res.body.error.fields).toEqual({ idDocumentType: [m.idDocumentType.notAllowed] });
    });

    it.each([
      ['an unknown file part', { files: { selfie: documentFile() } }],
      ['an unknown text field', { ...documentSet('individual'), fields: { note: 'hi' } }],
    ])('answers 422 _form unknownField for %s', async (_name, payload) => {
      const { accessToken } = await developerWithProfile(individual);

      const res = await submitDocuments(app, accessToken, payload);

      expect(res.status).toBe(422);
      expect(res.body.error.fields).toEqual({ _form: [commonMessages.unknownField] });
      expect(storage.calls).toEqual([]);
    });

    it('answers 422 _form unknownField for two files of one kind', async () => {
      const { accessToken } = await developerWithProfile(individual);

      const res = await request(app)
        .post(DOCUMENTS)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('government_id', documentFile().buffer, { filename: 'a.pdf', contentType: 'application/pdf' })
        .attach('government_id', documentFile().buffer, { filename: 'b.pdf', contentType: 'application/pdf' })
        .field('idDocumentType', 'passport');

      expect(res.status).toBe(422);
      expect(res.body.error.fields).toEqual({ _form: [commonMessages.unknownField] });
    });

    it('answers 400 BAD_REQUEST for a broken multipart body', async () => {
      const { accessToken } = await developerWithProfile(individual);

      const res = await request(app)
        .post(DOCUMENTS)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'multipart/form-data; boundary=xyz')
        .send('--xyz\r\nContent-Disposition: form-data; name="government_id"; filename="a.pdf"\r\n\r\n%PDF');

      expect(res.status).toBe(400);
      expect(res.body).toEqual(errorBody('BAD_REQUEST'));
      expect(storage.calls).toEqual([]);
    });
  });

  describe('already submitted (Q-036)', () => {
    it('answers 409 CONFLICT for kinds already under review, uploading nothing', async () => {
      const { accessToken, profileId } = await developerWithProfile(individual);
      expect((await submitDocuments(app, accessToken, documentSet('individual'))).status).toBe(201);
      const callsBefore = storage.calls.length;

      const res = await submitDocuments(app, accessToken, documentSet('individual'));

      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        success: false,
        error: { code: 'CONFLICT', message: m.api.documentAlreadySubmitted },
      });
      expect(storage.calls).toHaveLength(callsBefore);
      expect(await documentsOf(profileId)).toHaveLength(2);
    });

    it('answers 409 for an empty request once everything is under review', async () => {
      const { accessToken } = await developerWithProfile(individual);
      await submitDocuments(app, accessToken, documentSet('individual'));

      const res = await submitDocuments(app, accessToken, {});

      expect(res.status).toBe(409);
      expect(res.body.error.message).toBe(m.api.documentAlreadySubmitted);
    });

    it('stores one set when two submissions race; the loser gets 409 and its files are deleted', async () => {
      const { accessToken, profileId } = await developerWithProfile(individual);

      const results = await Promise.all([
        submitDocuments(app, accessToken, documentSet('individual')),
        submitDocuments(app, accessToken, documentSet('individual')),
      ]);

      expect(results.map((res) => res.status).sort()).toEqual([201, 409]);
      const rows = await documentsOf(profileId);
      expect(rows).toHaveLength(2);
      expect(storedFiles(storage).sort()).toEqual(rows.map((row) => row.cloudinaryPublicId).sort());
    });
  });

  describe('failures leave no file behind (DEC-018)', () => {
    it('deletes every uploaded file when the DB save fails', async () => {
      const { accessToken, profileId } = await developerWithProfile(company);
      jest.spyOn(models.VerificationDocument, 'bulkCreate').mockRejectedValueOnce(new Error('DB down'));

      const res = await submitDocuments(app, accessToken, documentSet('company'));

      expect(res.status).toBe(500);
      expect(res.body).toEqual(errorBody('INTERNAL_ERROR'));
      expect(storage.calls.filter(([call]) => call === 'upload')).toHaveLength(3);
      expect(storedFiles(storage)).toEqual([]);
      expect(await documentsOf(profileId)).toEqual([]);
    });

    it('queues the files whose immediate delete fails', async () => {
      const { accessToken } = await developerWithProfile(individual);
      jest.spyOn(models.VerificationDocument, 'bulkCreate').mockRejectedValueOnce(new Error('DB down'));
      storage.failNextDestroys(2);

      const res = await submitDocuments(app, accessToken, documentSet('individual'));

      expect(res.status).toBe(500);
      const uploaded = storage.calls.filter(([call]) => call === 'upload').map(([, publicId]) => publicId);
      const queued = await queuedDeletions();
      expect(queued.map((row) => row.publicId).sort()).toEqual(uploaded.sort());
      expect(queued.every((row) => row.reason === 'save_failed' && row.status === 'pending')).toBe(true);
    });

    it('deletes the files already uploaded when a later upload fails, and saves nothing', async () => {
      const { accessToken, profileId } = await developerWithProfile(company);
      const upload = storage.upload.bind(storage);
      let count = 0;
      storage.upload = async (buffer, options) => {
        count += 1;
        if (count === 3) throw new Error('Cloudinary unavailable');
        return upload(buffer, options);
      };

      const res = await submitDocuments(app, accessToken, documentSet('company'));

      expect(res.status).toBe(500);
      expect(storedFiles(storage)).toEqual([]);
      expect(storage.calls.filter(([call]) => call === 'destroy')).toHaveLength(2);
      expect(await documentsOf(profileId)).toEqual([]);
    });
  });

  describe('parallel uploads (TASK-048)', () => {
    // Holds every upload until all `expected` have started, so a sequential upload loop would hang
    // (and time out) instead of passing. failing: indexes, in start order, of uploads that reject.
    function holdUntilAllStarted(expected, { failing = [] } = {}) {
      const upload = storage.upload.bind(storage);
      let started = 0;
      let release;
      const allStarted = new Promise((resolve) => {
        release = resolve;
      });
      storage.upload = async (buffer, options) => {
        const index = started;
        started += 1;
        if (started === expected) release();
        await allStarted;
        if (failing.includes(index)) throw new Error('Cloudinary unavailable');
        return upload(buffer, options);
      };
    }

    it('starts every upload before any finishes and stores all of them', async () => {
      const { accessToken, profileId } = await developerWithProfile(company);
      holdUntilAllStarted(3);

      const res = await submitDocuments(app, accessToken, documentSet('company'));

      expect(res.status).toBe(201);
      const rows = await documentsOf(profileId);
      expect(rows).toHaveLength(3);
      expect(storedFiles(storage).sort()).toEqual(rows.map((row) => row.cloudinaryPublicId).sort());
    });

    it('deletes the other uploads when the first one fails, and saves nothing', async () => {
      const { accessToken, profileId } = await developerWithProfile(company);
      holdUntilAllStarted(3, { failing: [0] });

      const res = await submitDocuments(app, accessToken, documentSet('company'));

      expect(res.status).toBe(500);
      expect(res.body).toEqual(errorBody('INTERNAL_ERROR'));
      expect(storage.calls.filter(([call]) => call === 'upload')).toHaveLength(2);
      expect(storage.calls.filter(([call]) => call === 'destroy')).toHaveLength(2);
      expect(storedFiles(storage)).toEqual([]);
      expect(await documentsOf(profileId)).toEqual([]);
    });

    it('queues the successful uploads whose delete fails when another upload fails', async () => {
      const { accessToken, profileId } = await developerWithProfile(company);
      holdUntilAllStarted(3, { failing: [1] });
      storage.failNextDestroys(2);

      const res = await submitDocuments(app, accessToken, documentSet('company'));

      expect(res.status).toBe(500);
      const uploaded = storage.calls.filter(([call]) => call === 'upload').map(([, publicId]) => publicId);
      expect(uploaded).toHaveLength(2);
      const queued = await queuedDeletions();
      expect(queued.map((row) => row.publicId).sort()).toEqual(uploaded.sort());
      expect(queued.every((row) => row.reason === 'save_failed')).toBe(true);
      expect(await documentsOf(profileId)).toEqual([]);
    });

    it('deletes every file when the save fails after the parallel uploads', async () => {
      const { accessToken, profileId } = await developerWithProfile(company);
      holdUntilAllStarted(3);
      jest.spyOn(models.VerificationDocument, 'bulkCreate').mockRejectedValueOnce(new Error('DB down'));

      const res = await submitDocuments(app, accessToken, documentSet('company'));

      expect(res.status).toBe(500);
      expect(storage.calls.filter(([call]) => call === 'upload')).toHaveLength(3);
      expect(storage.calls.filter(([call]) => call === 'destroy')).toHaveLength(3);
      expect(storedFiles(storage)).toEqual([]);
      expect(await documentsOf(profileId)).toEqual([]);
    });
  });

  describe('access', () => {
    it('answers 403 FORBIDDEN for a Developer without Professional info, uploading nothing', async () => {
      const { accessToken } = (await signUpAndVerify(app, mailer, { role: 'developer' })).body.data;

      const res = await submitDocuments(app, accessToken, documentSet('individual'));

      expect(res.status).toBe(403);
      expect(res.body).toEqual(errorBody('FORBIDDEN'));
      expect(storage.calls).toEqual([]);
    });

    it('answers 403 FORBIDDEN for a buyer-only Account', async () => {
      const { accessToken } = (await signUpAndVerify(app, mailer)).body.data;

      const res = await submitDocuments(app, accessToken, documentSet('individual'));

      expect(res.status).toBe(403);
      expect(res.body).toEqual(errorBody('FORBIDDEN'));
      expect(storage.calls).toEqual([]);
    });

    it('answers 401 without a token', async () => {
      const res = await submitDocuments(app, 'not-a-token', documentSet('individual'));
      expect(res.status).toBe(401);
      expect(res.body).toEqual(errorBody('UNAUTHORIZED'));
      expect(storage.calls).toEqual([]);
    });
  });
});
