import request from 'supertest';
import { authMessages, ERROR_CODES } from '@real-estate/shared';
import models, { sequelize } from '../../models/index.js';
import { forgotPassword, getVerification, logIn } from '../authFlows.js';
import { createE2eApp } from '../e2eApp.js';
import { E2E_BASE_PATH } from '../e2eMode.js';
import { SeedError, seedAccount, setDocumentReview } from '../e2eSeeds.js';
import { createTestApp } from '../testApp.js';

// The e2e seed fixtures (TASK-042) produce Accounts the real API sees in the intended state: checked by
// logging in and reading GET /me/verification, as the e2e specs will.

jest.setTimeout(30_000); // every seed hashes a password and every login compares one (bcrypt cost 12)

const seed = (options) => seedAccount(models, sequelize, options);
const review = (options) => setDocumentReview(models, options);

describe('e2e seed fixtures', () => {
  let app;
  beforeEach(() => {
    ({ app } = createTestApp());
  });

  async function verificationOf(account) {
    const login = await logIn(app, account);
    expect(login.status).toBe(200);
    return { user: login.body.data.user, res: await getVerification(app, login.body.data.accessToken) };
  }

  it('seeds a verified Buyer who can log in', async () => {
    const buyer = await seed();
    const res = await logIn(app, buyer);
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: buyer.email, roles: ['buyer'] });
  });

  it('seeds an unverified Account that login sends to Verify', async () => {
    const buyer = await seed({ verified: false });
    const res = await logIn(app, buyer);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('seeds a Developer before Professional info (Under Review, no verification yet)', async () => {
    const developer = await seed({ role: 'developer', professionalInfo: false });
    const { user, res } = await verificationOf(developer);
    expect(user.developerVerificationStatus).toBe('under_review');
    expect(res.status).toBe(403);
  });

  it('seeds a Developer with Professional info and no documents (Under Review, empty slots)', async () => {
    const developer = await seed({ role: 'developer' });
    const { res } = await verificationOf(developer);
    expect(res.body.data.status).toBe('under_review');
    expect(res.body.data.documents.map((d) => [d.documentKind, d.status])).toEqual([
      ['government_id', null],
      ['profile_photo', null],
    ]);
  });

  it.each([
    ['pending', 'under_review'],
    ['approved', 'active'],
    ['rejected', 'unsuccessful'],
  ])('seeds a Developer whose documents are all %s (%s)', async (documents, status) => {
    const developer = await seed({ role: 'developer', documents });
    const { user, res } = await verificationOf(developer);
    expect(user.developerVerificationStatus).toBe(status);
    expect(res.body.data.status).toBe(status);
    expect(res.body.data.documents.every((d) => d.status === documents)).toBe(true);
  });

  it('seeds a Company with one rejected kind and the reason given', async () => {
    const developer = await seed({
      role: 'developer',
      developerType: 'company',
      documents: {
        government_id: 'approved',
        company_registration_certificate: 'rejected',
        profile_photo: 'approved',
      },
      rejectionReason: 'Expired certificate',
    });
    const { res } = await verificationOf(developer);
    expect(res.body.data.status).toBe('unsuccessful');
    expect(res.body.data.documents.map((d) => [d.documentKind, d.status, d.rejectionReason])).toEqual([
      ['government_id', 'approved', null],
      ['company_registration_certificate', 'rejected', 'Expired certificate'],
      ['profile_photo', 'approved', null],
    ]);
  });

  it('refuses options that would break the tables or mean nothing', async () => {
    await expect(seed({ role: 'buyer', documents: 'approved' })).rejects.toThrow(SeedError);
    await expect(
      seed({ role: 'developer', documents: { company_registration_certificate: 'pending' } }),
    ).rejects.toThrow(/not required for a individual developer/);
    await expect(seed({ role: 'developer', documents: 'lost' })).rejects.toThrow(/unknown status/);
    await expect(seed({ deadResetCodes: 4 })).rejects.toThrow(/deadResetCodes must be/);
    await expect(seed({ deadResetCodes: '3' })).rejects.toThrow(/deadResetCodes must be/);
  });

  it('seeds dead password_reset codes that pause new reset codes (TASK-054)', async () => {
    const buyer = await seed({ deadResetCodes: 3 });
    const res = await forgotPassword(app, buyer.email);
    expect(res.status).toBe(429);
    expect(res.body.error.message).toBe(authMessages.api.resetCodesPaused);

    const two = await seed({ deadResetCodes: 2 });
    expect((await forgotPassword(app, two.email)).status).toBe(200);
  });

  describe('setDocumentReview', () => {
    it('approves every latest document, turning the Developer Active', async () => {
      const developer = await seed({ role: 'developer', documents: 'pending' });
      const updated = await review({ email: developer.email, status: 'approved' });
      expect(updated.map((d) => d.status)).toEqual(['approved', 'approved']);
      expect((await verificationOf(developer)).res.body.data.status).toBe('active');
    });

    it('rejects one kind with a reason, and undoes a review with pending', async () => {
      const developer = await seed({ role: 'developer', documents: 'pending' });
      await review({
        email: developer.email,
        documentKind: 'profile_photo',
        status: 'rejected',
        rejectionReason: 'Blurry',
      });
      let { res } = await verificationOf(developer);
      expect(res.body.data.status).toBe('unsuccessful');
      expect(res.body.data.documents[1]).toMatchObject({ status: 'rejected', rejectionReason: 'Blurry' });

      await review({ email: developer.email, documentKind: 'profile_photo', status: 'pending' });
      ({ res } = await verificationOf(developer));
      expect(res.body.data.status).toBe('under_review');
    });

    it('answers 404 for an unknown email or an Account without that document', async () => {
      const developer = await seed({ role: 'developer' });
      await expect(review({ email: 'nobody@example.com', status: 'approved' })).rejects.toMatchObject({
        status: 404,
      });
      await expect(review({ email: developer.email, status: 'approved' })).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe('over HTTP (the e2e app)', () => {
    let e2e;
    beforeEach(() => {
      e2e = createE2eApp({ models, sequelize });
    });

    it('seeds through POST /seed/accounts and /seed/document-reviews', async () => {
      const seeded = await request(e2e.app)
        .post(`${E2E_BASE_PATH}/seed/accounts`)
        .send({ role: 'developer', documents: 'pending' });
      expect(seeded.status).toBe(201);
      expect(seeded.body.data).toMatchObject({ roles: ['developer'], password: 'secret123' });

      const reviewed = await request(e2e.app)
        .post(`${E2E_BASE_PATH}/seed/document-reviews`)
        .send({ email: seeded.body.data.email, status: 'approved' });
      expect(reviewed.status).toBe(201);
      expect(reviewed.body.data.map((d) => d.status)).toEqual(['approved', 'approved']);

      const missing = await request(e2e.app)
        .post(`${E2E_BASE_PATH}/seed/document-reviews`)
        .send({ email: 'nobody@example.com', status: 'approved' });
      expect(missing.status).toBe(404);
    });

    it('signs up with a captured code and resets everything with POST /reset', async () => {
      const email = 'sara@example.com';
      const signUp = await request(e2e.app).post('/api/auth/sign-up').send({
        role: 'buyer',
        fullName: 'Sara Khan',
        email,
        phone: '+971 50 123 4567',
        password: 'secret123',
        confirmPassword: 'secret123',
      });
      expect(signUp.status).toBe(201);
      const { code } = (await request(e2e.app).get(`${E2E_BASE_PATH}/mail/latest`).query({ email })).body
        .data;
      const verify = await request(e2e.app).post('/api/auth/verify-email').send({ email, code });
      expect(verify.status).toBe(200);

      expect((await request(e2e.app).post(`${E2E_BASE_PATH}/reset`)).status).toBe(204);
      expect(await models.User.count()).toBe(0);
      expect((await request(e2e.app).get(`${E2E_BASE_PATH}/mail/latest`).query({ email })).status).toBe(404);
    });

    it('hides unexpected errors behind INTERNAL_ERROR', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(models.User, 'create').mockRejectedValueOnce(new Error('boom'));
      const res = await request(e2e.app).post(`${E2E_BASE_PATH}/seed/accounts`).send({});
      expect(res.status).toBe(500);
      expect(res.body.error.message).toBe(ERROR_CODES.INTERNAL_ERROR.message);
      spy.mockRestore();
    });
  });
});
