import { authMessages, commonMessages, ERROR_CODES } from '@real-estate/shared';
import { professionalInfoCases } from '@real-estate/shared/testing';
import models from '../../../models/index.js';
import { createApp } from '../../../app.js';
import { createTestApp } from '../../../test/testApp.js';
import { documentFile } from '../../../test/documentFiles.js';
import { seedDocument, seedDocuments } from '../../../test/verificationDocuments.js';
import { saveProfessionalProfile, signUpAndVerify, submitDocuments } from '../../../test/authFlows.js';

// Resubmission (SPEC-001 "Documents in one request", TASK-029): POST /me/documents accepts only kinds
// whose latest document is rejected; earlier rows stay as history (db.md, Q-022). Review decisions are
// seeded directly in real_estate_test (no admin API).

const m = authMessages;
const company = professionalInfoCases.valid;
const individual = { ...company, developerType: 'individual', companyName: undefined };
const DAY = 24 * 60 * 60 * 1000;

const documentsOf = (profileId) =>
  models.VerificationDocument.findAll({
    where: { professionalProfileId: profileId },
    order: [['id', 'ASC']],
  });
const queuedDeletions = () => models.PendingFileDeletion.findAll({ order: [['id', 'ASC']] });
const uploadsOf = (storage) => storage.calls.filter(([call]) => call === 'upload');
const destroysOf = (storage) => storage.calls.filter(([call]) => call === 'destroy');

const governmentIdOnly = () => ({
  files: { government_id: documentFile({ fileName: 'new-passport.pdf' }) },
  idDocumentType: 'passport',
});
const photoOnly = () => ({
  files: { profile_photo: documentFile({ fileName: 'new-me.png', mimeType: 'image/png' }) },
});

describe('POST /api/auth/me/documents (resubmission)', () => {
  let app;
  let mailer;
  let storage;
  let clock;
  let reviewedAt; // a day before the test clock's now, so the seeded rows are older than new uploads

  beforeEach(() => {
    ({ app, mailer, storage, clock } = createTestApp());
    reviewedAt = new Date(Math.floor((clock.now().getTime() - DAY) / 1000) * 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // A verified Developer with Professional info and the seeded documents ({ kind: status }).
  async function developerWith(info, statuses) {
    const { accessToken } = (await signUpAndVerify(app, mailer, { role: 'developer' })).body.data;
    const saved = await saveProfessionalProfile(app, accessToken, info);
    expect(saved.status).toBe(200);
    const profileId = saved.body.data.profile.id;
    const seeded = await seedDocuments(profileId, statuses, { createdAt: reviewedAt });
    return { accessToken, profileId, seeded };
  }

  describe('accepted', () => {
    it('stores a new pending Government ID and keeps the rejected row as history', async () => {
      const { accessToken, profileId, seeded } = await developerWith(individual, {
        government_id: 'rejected',
        profile_photo: 'approved',
      });

      const res = await submitDocuments(app, accessToken, governmentIdOnly());

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        success: true,
        data: {
          verification: {
            status: 'under_review',
            documents: [
              {
                documentKind: 'government_id',
                status: 'pending',
                rejectionReason: null,
                fileName: 'new-passport.pdf',
                sizeBytes: 2048,
              },
              {
                documentKind: 'profile_photo',
                status: 'approved',
                rejectionReason: null,
                fileName: 'profile_photo-old.png',
                sizeBytes: 1000,
              },
            ],
          },
        },
      });
      const rows = await documentsOf(profileId);
      expect(rows).toHaveLength(3);
      // The rejected row is untouched: same status, reason and file.
      expect(rows[0].get({ plain: true })).toEqual(seeded[0].get({ plain: true }));
      expect(rows[2]).toMatchObject({
        documentKind: 'government_id',
        status: 'pending',
        originalFilename: 'new-passport.pdf',
        reviewedAt: null,
        rejectionReason: null,
      });
      expect(rows[2].cloudinaryPublicId).not.toBe(seeded[0].cloudinaryPublicId);
      expect(uploadsOf(storage)).toHaveLength(1);
    });

    it('never deletes the file of the rejected document it replaces', async () => {
      const { accessToken, seeded } = await developerWith(individual, {
        government_id: 'rejected',
        profile_photo: 'approved',
      });

      expect((await submitDocuments(app, accessToken, governmentIdOnly())).status).toBe(201);

      expect(destroysOf(storage)).toEqual([]);
      expect(await queuedDeletions()).toEqual([]);
      expect(await models.VerificationDocument.findByPk(seeded[0].id)).not.toBeNull();
    });

    it('accepts every rejected kind of a Company in one request', async () => {
      const { accessToken, profileId } = await developerWith(company, {
        government_id: 'rejected',
        company_registration_certificate: 'rejected',
        profile_photo: 'approved',
      });

      const res = await submitDocuments(app, accessToken, {
        files: {
          government_id: documentFile({ fileName: 'new-passport.pdf' }),
          company_registration_certificate: documentFile({ fileName: 'new-certificate.pdf' }),
        },
        idDocumentType: 'passport',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.verification.status).toBe('under_review');
      expect(res.body.data.verification.documents.map((d) => d.status)).toEqual([
        'pending',
        'pending',
        'approved',
      ]);
      expect(await documentsOf(profileId)).toHaveLength(5);
    });

    // SPEC-001 accepts any kind whose latest document is rejected; it does not require all of them at
    // once. The kinds left out stay rejected, so the headline stays Unsuccessful.
    it('accepts a subset of the rejected kinds; the others stay rejected', async () => {
      const { accessToken } = await developerWith(individual, {
        government_id: 'rejected',
        profile_photo: 'rejected',
      });

      const res = await submitDocuments(app, accessToken, photoOnly());

      expect(res.status).toBe(201);
      expect(res.body.data.verification).toMatchObject({
        status: 'unsuccessful',
        documents: [
          { documentKind: 'government_id', status: 'rejected', rejectionReason: 'Unreadable scan' },
          { documentKind: 'profile_photo', status: 'pending', rejectionReason: null },
        ],
      });
    });

    it('accepts a kind rejected again after an earlier resubmission, keeping every row', async () => {
      const { accessToken, profileId } = await developerWith(individual, {
        government_id: 'rejected',
        profile_photo: 'approved',
      });
      // A second review rejected the resubmitted ID too (newer than the first).
      await seedDocument(profileId, {
        documentKind: 'government_id',
        status: 'rejected',
        rejectionReason: 'Name does not match',
        createdAt: new Date(reviewedAt.getTime() + 60 * 60 * 1000),
      });

      const res = await submitDocuments(app, accessToken, governmentIdOnly());

      expect(res.status).toBe(201);
      expect(res.body.data.verification.documents[0]).toMatchObject({ status: 'pending' });
      const ids = (await documentsOf(profileId)).filter((row) => row.documentKind === 'government_id');
      expect(ids.map((row) => row.status)).toEqual(['rejected', 'rejected', 'pending']);
    });

    it('accepts an Approved kind later rejected (the latest row wins)', async () => {
      const { accessToken, profileId } = await developerWith(individual, {
        government_id: 'approved',
        profile_photo: 'approved',
      });
      await seedDocument(profileId, {
        documentKind: 'government_id',
        status: 'rejected',
        createdAt: new Date(reviewedAt.getTime() + 1000),
      });

      expect((await submitDocuments(app, accessToken, governmentIdOnly())).status).toBe(201);
    });
  });

  describe('refused with 409 CONFLICT (Q-036), uploading nothing', () => {
    it.each([
      ['approved', 'approved'],
      ['pending', 'pending'],
    ])('refuses a request that includes a kind whose latest document is %s', async (_name, status) => {
      const { accessToken, profileId } = await developerWith(individual, {
        government_id: 'rejected',
        profile_photo: status,
      });

      const res = await submitDocuments(app, accessToken, {
        files: { ...governmentIdOnly().files, ...photoOnly().files },
        idDocumentType: 'passport',
      });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        success: false,
        error: { code: 'CONFLICT', message: m.api.documentAlreadySubmitted },
      });
      expect(storage.calls).toEqual([]);
      expect(await documentsOf(profileId)).toHaveLength(2);
    });

    it('refuses a kind whose rejected row was already replaced by a pending one', async () => {
      const { accessToken, profileId } = await developerWith(individual, {
        government_id: 'rejected',
        profile_photo: 'approved',
      });
      expect((await submitDocuments(app, accessToken, governmentIdOnly())).status).toBe(201);
      const callsBefore = storage.calls.length;

      const res = await submitDocuments(app, accessToken, governmentIdOnly());

      expect(res.status).toBe(409);
      expect(res.body.error.message).toBe(m.api.documentAlreadySubmitted);
      expect(storage.calls).toHaveLength(callsBefore);
      expect(await documentsOf(profileId)).toHaveLength(3);
    });

    it('refuses an approved kind sent alone', async () => {
      const { accessToken } = await developerWith(individual, {
        government_id: 'rejected',
        profile_photo: 'approved',
      });

      const res = await submitDocuments(app, accessToken, photoOnly());

      expect(res.status).toBe(409);
      expect(storage.calls).toEqual([]);
    });

    it('lets only one of two racing resubmissions through; the loser gets 409 and its file is deleted', async () => {
      const { accessToken, profileId } = await developerWith(individual, {
        government_id: 'rejected',
        profile_photo: 'approved',
      });
      // Two app instances with the same fakes: one instance answers a second concurrent upload of the
      // Account with 429 (TASK-053), so only across instances does the profile row lock decide.
      const otherInstance = createApp(app.locals.dependencies);

      const results = await Promise.all([
        submitDocuments(app, accessToken, governmentIdOnly()),
        submitDocuments(otherInstance, accessToken, governmentIdOnly()),
      ]);

      expect(results.map((res) => res.status).sort()).toEqual([201, 409]);
      const rows = await documentsOf(profileId);
      expect(rows).toHaveLength(3);
      const uploaded = uploadsOf(storage).map(([, publicId]) => publicId);
      const destroyed = destroysOf(storage).map(([, publicId]) => publicId);
      // Either the loser uploaded and then deleted its file, or it was refused before uploading.
      expect(uploaded.filter((id) => !destroyed.includes(id))).toEqual([rows[2].cloudinaryPublicId]);
    });
  });

  describe('missing kinds', () => {
    it('asks for the rejected kinds when nothing is sent', async () => {
      const { accessToken } = await developerWith(company, {
        government_id: 'rejected',
        company_registration_certificate: 'approved',
        profile_photo: 'rejected',
      });

      const res = await submitDocuments(app, accessToken, {});

      expect(res.status).toBe(422);
      expect(res.body.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: commonMessages.invalidInput,
        fields: {
          'documents.government_id.file': [m.documents.required.government_id],
          'documents.profile_photo.file': [m.documents.required.profile_photo],
        },
      });
      expect(storage.calls).toEqual([]);
    });

    // Professional info stays editable while Unsuccessful (DEC-033); switching to Company adds the
    // certificate, which has no document yet, so it must come with the resubmission.
    it('requires a newly required kind (Individual switched to Company) alongside the resubmission', async () => {
      const { accessToken, profileId } = await developerWith(individual, {
        government_id: 'approved',
        profile_photo: 'rejected',
      });
      expect((await saveProfessionalProfile(app, accessToken, company)).status).toBe(200);

      const refused = await submitDocuments(app, accessToken, photoOnly());
      expect(refused.status).toBe(422);
      expect(refused.body.error.fields).toEqual({
        'documents.company_registration_certificate.file': [
          m.documents.required.company_registration_certificate,
        ],
      });
      expect(storage.calls).toEqual([]);

      const res = await submitDocuments(app, accessToken, {
        files: {
          ...photoOnly().files,
          company_registration_certificate: documentFile({ fileName: 'certificate.pdf' }),
        },
      });
      expect(res.status).toBe(201);
      expect(res.body.data.verification).toMatchObject({
        status: 'under_review',
        documents: [{ status: 'approved' }, { status: 'pending' }, { status: 'pending' }],
      });
      expect(await documentsOf(profileId)).toHaveLength(4);
    });
  });

  describe('failures leave no new file behind and keep the history (DEC-018)', () => {
    it('deletes the new file when the DB save fails; the rejected row and its file stay', async () => {
      const { accessToken, profileId, seeded } = await developerWith(individual, {
        government_id: 'rejected',
        profile_photo: 'approved',
      });
      jest.spyOn(models.VerificationDocument, 'bulkCreate').mockRejectedValueOnce(new Error('DB down'));

      const res = await submitDocuments(app, accessToken, governmentIdOnly());

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: ERROR_CODES.INTERNAL_ERROR.message },
      });
      const [[, uploaded]] = uploadsOf(storage);
      expect(destroysOf(storage)).toEqual([['destroy', uploaded]]);
      expect(destroysOf(storage).flat()).not.toContain(seeded[0].cloudinaryPublicId);
      const rows = await documentsOf(profileId);
      expect(rows.map((row) => row.get({ plain: true }))).toEqual(
        seeded.map((row) => row.get({ plain: true })),
      );
      expect(await queuedDeletions()).toEqual([]);
    });

    it('queues the new file when its immediate delete fails too, never the rejected one', async () => {
      const { accessToken, seeded } = await developerWith(individual, {
        government_id: 'rejected',
        profile_photo: 'approved',
      });
      jest.spyOn(models.VerificationDocument, 'bulkCreate').mockRejectedValueOnce(new Error('DB down'));
      storage.failNextDestroys(1);

      const res = await submitDocuments(app, accessToken, governmentIdOnly());

      expect(res.status).toBe(500);
      const [[, uploaded]] = uploadsOf(storage);
      const queued = await queuedDeletions();
      expect(queued.map((row) => [row.publicId, row.reason])).toEqual([[uploaded, 'save_failed']]);
      expect(queued[0].publicId).not.toBe(seeded[0].cloudinaryPublicId);
    });
  });
});
