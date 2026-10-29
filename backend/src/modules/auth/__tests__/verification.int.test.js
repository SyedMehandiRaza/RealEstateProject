import express from 'express';
import request from 'supertest';
import { ERROR_CODES } from '@real-estate/shared';
import { professionalInfoCases } from '@real-estate/shared/testing';
import { authenticate } from '../../../middlewares/authenticate.js';
import { errorHandler } from '../../../middlewares/errorHandler.js';
import { sendSuccess } from '../../../utils/response.js';
import { createTestApp } from '../../../test/testApp.js';
import { documentSet } from '../../../test/documentFiles.js';
import { seedDocument, seedDocuments } from '../../../test/verificationDocuments.js';
import {
  becomeDeveloper,
  getVerification,
  logIn,
  ME,
  refresh,
  refreshTokenOf,
  saveProfessionalProfile,
  signUpAndVerify,
  submitDocuments,
} from '../../../test/authFlows.js';
import { requireActiveDeveloper } from '../index.js';

// GET /api/auth/me/verification, user.developerVerificationStatus and the "Active developer required"
// guard (SPEC-001, TASK-030). Review decisions are seeded directly (no admin API).

const company = professionalInfoCases.valid;
const individual = { ...company, developerType: 'individual', companyName: undefined };
const DAY = 24 * 60 * 60 * 1000;
const errorBody = (code) => ({ success: false, error: { code, message: ERROR_CODES[code].message } });
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

const emptyEntry = (documentKind) => ({
  documentKind,
  status: null,
  rejectionReason: null,
  fileName: null,
  sizeBytes: null,
});
const seededEntry = (documentKind, status, rejectionReason = null) => ({
  documentKind,
  status,
  rejectionReason,
  fileName: `${documentKind}-old.png`,
  sizeBytes: 1000,
});

// A later module's route behind the guard, as a properties router would mount it.
const guardedApp = () => {
  const app = express();
  app.get('/guarded', authenticate, requireActiveDeveloper, (_req, res) => sendSuccess(res, { ok: true }));
  app.use(errorHandler);
  return app;
};

describe('Verification status (TASK-030)', () => {
  let app;
  let mailer;
  let clock;
  let reviewedAt; // a day before the test clock's now

  beforeEach(() => {
    ({ app, mailer, clock } = createTestApp());
    reviewedAt = new Date(Math.floor((clock.now().getTime() - DAY) / 1000) * 1000);
  });

  // A verified Developer (Professional info of `info` unless null). Returns { accessToken, refreshToken, profileId }.
  async function developer(info = individual) {
    const verified = await signUpAndVerify(app, mailer, { role: 'developer' });
    expect(verified.status).toBe(200);
    const { accessToken } = verified.body.data;
    const refreshToken = refreshTokenOf(verified);
    if (!info) return { accessToken, refreshToken, verified };
    const saved = await saveProfessionalProfile(app, accessToken, info);
    expect(saved.status).toBe(200);
    return { accessToken, refreshToken, verified, profileId: saved.body.data.profile.id };
  }

  describe('GET /api/auth/me/verification', () => {
    it('lists the 2 Individual kinds with nulls before any upload, Under Review', async () => {
      const { accessToken } = await developer(individual);

      const res = await getVerification(app, accessToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: {
          status: 'under_review',
          documents: [emptyEntry('government_id'), emptyEntry('profile_photo')],
        },
      });
    });

    it('lists the 3 Company kinds', async () => {
      const { accessToken } = await developer(company);

      const res = await getVerification(app, accessToken);

      expect(res.body.data.documents.map((d) => d.documentKind)).toEqual([
        'government_id',
        'company_registration_certificate',
        'profile_photo',
      ]);
    });

    it('is Under Review with every document pending after a submission, the same body as its 201', async () => {
      const { accessToken } = await developer(company);
      const submitted = await submitDocuments(app, accessToken, documentSet('company'));
      expect(submitted.status).toBe(201);

      const res = await getVerification(app, accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(submitted.body.data.verification);
      expect(res.body.data).toEqual({
        status: 'under_review',
        documents: [
          {
            documentKind: 'government_id',
            status: 'pending',
            rejectionReason: null,
            fileName: 'passport.pdf',
            sizeBytes: 2048,
          },
          {
            documentKind: 'company_registration_certificate',
            status: 'pending',
            rejectionReason: null,
            fileName: 'certificate.pdf',
            sizeBytes: 2048,
          },
          {
            documentKind: 'profile_photo',
            status: 'pending',
            rejectionReason: null,
            fileName: 'me.png',
            sizeBytes: 2048,
          },
        ],
      });
    });

    it('is Active when every required latest document is approved', async () => {
      const { accessToken, profileId } = await developer(individual);
      await seedDocuments(
        profileId,
        { government_id: 'approved', profile_photo: 'approved' },
        { createdAt: reviewedAt },
      );

      const res = await getVerification(app, accessToken);

      expect(res.body.data).toEqual({
        status: 'active',
        documents: [seededEntry('government_id', 'approved'), seededEntry('profile_photo', 'approved')],
      });
    });

    it('is Unsuccessful with each rejection reason as written', async () => {
      const { accessToken, profileId } = await developer(company);
      const reasons = {
        government_id: 'ID expired on 01/2026 — please upload a valid one',
        profile_photo: 'Face not visible',
      };
      await seedDocument(profileId, {
        documentKind: 'government_id',
        status: 'rejected',
        rejectionReason: reasons.government_id,
        createdAt: reviewedAt,
      });
      await seedDocument(profileId, {
        documentKind: 'company_registration_certificate',
        status: 'approved',
        createdAt: reviewedAt,
      });
      await seedDocument(profileId, {
        documentKind: 'profile_photo',
        status: 'rejected',
        rejectionReason: reasons.profile_photo,
        createdAt: reviewedAt,
      });

      const res = await getVerification(app, accessToken);

      expect(res.body.data).toEqual({
        status: 'unsuccessful',
        documents: [
          seededEntry('government_id', 'rejected', reasons.government_id),
          seededEntry('company_registration_certificate', 'approved'),
          seededEntry('profile_photo', 'rejected', reasons.profile_photo),
        ],
      });
    });

    it('uses the latest row per kind (a resubmission after a rejection is Under Review again)', async () => {
      const { accessToken, profileId } = await developer(individual);
      await seedDocuments(
        profileId,
        { government_id: 'rejected', profile_photo: 'approved' },
        { createdAt: reviewedAt },
      );
      expect((await getVerification(app, accessToken)).body.data.status).toBe('unsuccessful');

      expect(
        (
          await submitDocuments(app, accessToken, {
            files: { government_id: documentSet().files.government_id },
            idDocumentType: 'passport',
          })
        ).status,
      ).toBe(201);

      const res = await getVerification(app, accessToken);
      expect(res.body.data.status).toBe('under_review');
      expect(res.body.data.documents[0]).toMatchObject({
        status: 'pending',
        rejectionReason: null,
        fileName: 'passport.pdf',
      });
    });

    it('ignores rows of a kind the Type of Developer does not require', async () => {
      const { accessToken, profileId } = await developer(company);
      await seedDocuments(
        profileId,
        {
          government_id: 'approved',
          company_registration_certificate: 'rejected',
          profile_photo: 'approved',
        },
        { createdAt: reviewedAt },
      );
      expect((await getVerification(app, accessToken)).body.data.status).toBe('unsuccessful');

      // Professional info stays editable while Unsuccessful (DEC-033).
      expect((await saveProfessionalProfile(app, accessToken, individual)).status).toBe(200);

      const res = await getVerification(app, accessToken);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.documents).toHaveLength(2);
    });

    it('answers 403 FORBIDDEN for a buyer-only Account', async () => {
      const { accessToken } = (await signUpAndVerify(app, mailer)).body.data;

      const res = await getVerification(app, accessToken);

      expect(res.status).toBe(403);
      expect(res.body).toEqual(errorBody('FORBIDDEN'));
    });

    it('answers 403 FORBIDDEN for a Developer without Professional info (no Type of Developer yet)', async () => {
      const { accessToken } = await developer(null);

      const res = await getVerification(app, accessToken);

      expect(res.status).toBe(403);
      expect(res.body).toEqual(errorBody('FORBIDDEN'));
    });

    it('answers 401 without a valid token', async () => {
      const res = await getVerification(app, 'not-a-token');
      expect(res.status).toBe(401);
      expect(res.body).toEqual(errorBody('UNAUTHORIZED'));
    });
  });

  describe('user.developerVerificationStatus', () => {
    it('is null for a buyer-only Account', async () => {
      const verified = await signUpAndVerify(app, mailer);
      expect(verified.body.data.user.developerVerificationStatus).toBeNull();
    });

    it('is under_review for a new Developer, before Professional info', async () => {
      const { verified, accessToken } = await developer(null);

      expect(verified.body.data.user.developerVerificationStatus).toBe('under_review');
      const me = await request(app).get(ME).set(bearer(accessToken));
      expect(me.body.data.user.developerVerificationStatus).toBe('under_review');
    });

    it('is under_review for a Buyer who just became a Developer', async () => {
      const { accessToken } = (await signUpAndVerify(app, mailer)).body.data;

      const res = await becomeDeveloper(app, accessToken);

      expect(res.status).toBe(201);
      expect(res.body.data.user.developerVerificationStatus).toBe('under_review');
    });

    it('follows the documents in /me, login and refresh: active, then unsuccessful', async () => {
      const { accessToken, refreshToken, profileId } = await developer(individual);
      const [id] = await seedDocuments(
        profileId,
        { government_id: 'approved', profile_photo: 'approved' },
        { createdAt: reviewedAt },
      );

      const me = await request(app).get(ME).set(bearer(accessToken));
      expect(me.body.data.user.developerVerificationStatus).toBe('active');
      const login = await logIn(app);
      expect(login.body.data.user.developerVerificationStatus).toBe('active');

      await seedDocument(profileId, {
        documentKind: 'government_id',
        status: 'rejected',
        createdAt: new Date(id.createdAt.getTime() + 1000),
      });
      const refreshed = await refresh(app, refreshToken);
      expect(refreshed.status).toBe(200);
      expect(refreshed.body.data.user.developerVerificationStatus).toBe('unsuccessful');
    });

    it('agrees with GET /me/verification', async () => {
      const { accessToken, profileId } = await developer(company);
      await seedDocuments(
        profileId,
        { government_id: 'approved', company_registration_certificate: 'pending', profile_photo: 'approved' },
        { createdAt: reviewedAt },
      );

      const me = await request(app).get(ME).set(bearer(accessToken));
      const verification = await getVerification(app, accessToken);

      expect(me.body.data.user.developerVerificationStatus).toBe(verification.body.data.status);
      expect(verification.body.data.status).toBe('under_review');
    });
  });

  describe('requireActiveDeveloper guard', () => {
    it('passes an Active Developer', async () => {
      const { accessToken, profileId } = await developer(individual);
      await seedDocuments(
        profileId,
        { government_id: 'approved', profile_photo: 'approved' },
        { createdAt: reviewedAt },
      );

      const res = await request(guardedApp()).get('/guarded').set(bearer(accessToken));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: { ok: true } });
    });

    it.each([
      ['without Professional info', null, {}],
      ['before any upload', individual, {}],
      ['Under Review', individual, { government_id: 'approved', profile_photo: 'pending' }],
      ['Unsuccessful', individual, { government_id: 'approved', profile_photo: 'rejected' }],
      [
        'a Company missing its certificate',
        company,
        { government_id: 'approved', profile_photo: 'approved' },
      ],
    ])('answers 403 DEVELOPER_NOT_ACTIVE for a Developer %s', async (_name, info, statuses) => {
      const { accessToken, profileId } = await developer(info);
      if (profileId) await seedDocuments(profileId, statuses, { createdAt: reviewedAt });

      const res = await request(guardedApp()).get('/guarded').set(bearer(accessToken));

      expect(res.status).toBe(403);
      expect(res.body).toEqual(errorBody('DEVELOPER_NOT_ACTIVE'));
    });

    it('answers 403 FORBIDDEN for a buyer-only Account', async () => {
      const { accessToken } = (await signUpAndVerify(app, mailer)).body.data;

      const res = await request(guardedApp()).get('/guarded').set(bearer(accessToken));

      expect(res.status).toBe(403);
      expect(res.body).toEqual(errorBody('FORBIDDEN'));
    });

    it('answers 401 without a token', async () => {
      const res = await request(guardedApp()).get('/guarded');
      expect(res.status).toBe(401);
      expect(res.body).toEqual(errorBody('UNAUTHORIZED'));
    });
  });
});
