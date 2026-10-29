import request from 'supertest';
import { authMessages, ERROR_CODES } from '@real-estate/shared';
import { professionalInfoCases } from '@real-estate/shared/testing';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import {
  becomeDeveloper,
  PROFESSIONAL_PROFILE,
  refresh,
  refreshTokenOf,
  saveProfessionalProfile,
  signUpAndVerify,
} from '../../../test/authFlows.js';
import { signAccessToken } from '../../../utils/jwt.js';

const errorBody = (code) => ({ success: false, error: { code, message: ERROR_CODES[code].message } });
const company = professionalInfoCases.valid;
const individual = {
  developerType: 'individual',
  licenseNumber: 'DLD-778',
  experienceLevel: '0_2',
  location: 'Singapore',
};

const profilesOf = (userId) => models.ProfessionalProfile.findAll({ where: { userId } });

// A Developer's documents, seeded directly (no review API yet). `status` per kind.
async function seedDocuments(profileId, statuses) {
  let n = 0;
  for (const [documentKind, status] of Object.entries(statuses)) {
    n += 1;
    await models.VerificationDocument.create({
      professionalProfileId: profileId,
      documentKind,
      idDocumentType: documentKind === 'government_id' ? 'passport' : null,
      cloudinaryPublicId: `realestate/test/documents/${profileId}/seed-${n}`,
      cloudinaryResourceType: 'image',
      originalFilename: `${documentKind}.png`,
      mimeType: 'image/png',
      sizeBytes: 1000,
      status,
      rejectionReason: status === 'rejected' ? 'Unreadable scan' : null,
      reviewedAt: status === 'pending' ? null : new Date(),
    });
  }
}

describe('PUT /api/auth/me/professional-profile', () => {
  let app;
  let mailer;

  beforeEach(() => {
    ({ app, mailer } = createTestApp());
  });

  async function developer(overrides) {
    const res = await signUpAndVerify(app, mailer, { role: 'developer', ...overrides });
    expect(res.status).toBe(200);
    return res.body.data;
  }

  it('creates the profile of a Company and returns 200 { profile } in the request field names', async () => {
    const { accessToken, user } = await developer();

    const res = await saveProfessionalProfile(app, accessToken, company);

    expect(res.status).toBe(200);
    const [stored] = await profilesOf(user.id);
    expect(res.body).toEqual({ success: true, data: { profile: { id: stored.id, ...company } } });
    expect(stored).toMatchObject({
      organizationName: 'Skyline Homes',
      businessType: 'company',
      licenseNumber: 'RERA-12345',
      experienceLevel: '6_10',
      location: 'Dubai Marina',
    });
  });

  it('creates an Individual profile without a Company Name (left out of the body), stored as NULL', async () => {
    const { accessToken, user } = await developer();

    const res = await saveProfessionalProfile(app, accessToken, individual);

    expect(res.status).toBe(200);
    expect(res.body.data.profile).toEqual({ id: expect.any(Number), ...individual, companyName: null });
    const [stored] = await profilesOf(user.id);
    expect(stored.organizationName).toBeNull();
  });

  it('treats a blank Company Name of an Individual as not given', async () => {
    const { accessToken, user } = await developer();

    const res = await saveProfessionalProfile(app, accessToken, { ...individual, companyName: '   ' });

    expect(res.status).toBe(200);
    expect(res.body.data.profile.companyName).toBeNull();
    expect((await profilesOf(user.id))[0].organizationName).toBeNull();
  });

  it('keeps a Company Name an Individual chose to give', async () => {
    const { accessToken } = await developer();

    const res = await saveProfessionalProfile(app, accessToken, {
      ...individual,
      companyName: ' Solo Build ',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.profile.companyName).toBe('Solo Build');
  });

  it('replaces the profile on a second PUT, keeping one profile with the same id', async () => {
    const { accessToken, user } = await developer();
    const first = await saveProfessionalProfile(app, accessToken, company);

    const res = await saveProfessionalProfile(app, accessToken, individual);

    expect(res.status).toBe(200);
    expect(res.body.data.profile).toEqual({
      id: first.body.data.profile.id,
      ...individual,
      companyName: null,
    });
    const stored = await profilesOf(user.id);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      organizationName: null,
      businessType: 'individual',
      location: 'Singapore',
    });
  });

  it('keeps one profile when two PUTs race', async () => {
    const { accessToken, user } = await developer();

    const results = await Promise.all([
      saveProfessionalProfile(app, accessToken, company),
      saveProfessionalProfile(app, accessToken, individual),
    ]);

    expect(results.map((res) => res.status)).toEqual([200, 200]);
    expect(await profilesOf(user.id)).toHaveLength(1);
  });

  it('answers 422 on companyName for a Company without a Company Name, and stores nothing', async () => {
    const { accessToken, user } = await developer();
    const { companyName: _omitted, ...withoutName } = company;

    const res = await saveProfessionalProfile(app, accessToken, withoutName);

    expect(res.status).toBe(422);
    expect(res.body.error.fields).toEqual({ companyName: [authMessages.companyName.required] });
    expect(await profilesOf(user.id)).toHaveLength(0);
  });

  it('lets a Developer whose documents are under review or rejected edit the profile', async () => {
    const { accessToken, user } = await developer();
    const created = await saveProfessionalProfile(app, accessToken, individual);
    await seedDocuments(created.body.data.profile.id, {
      government_id: 'approved',
      profile_photo: 'rejected',
    });

    const res = await saveProfessionalProfile(app, accessToken, { ...individual, location: 'Abu Dhabi' });

    expect(res.status).toBe(200);
    expect((await profilesOf(user.id))[0].location).toBe('Abu Dhabi');
  });

  it('refuses an Active Developer with 409 CONFLICT and changes nothing (Q-033 assumed)', async () => {
    const { accessToken, user } = await developer();
    const created = await saveProfessionalProfile(app, accessToken, individual);
    await seedDocuments(created.body.data.profile.id, {
      government_id: 'approved',
      profile_photo: 'approved',
    });

    const res = await saveProfessionalProfile(app, accessToken, company);

    expect(res.status).toBe(409);
    expect(res.body).toEqual(errorBody('CONFLICT'));
    expect((await profilesOf(user.id))[0]).toMatchObject({
      businessType: 'individual',
      location: 'Singapore',
    });
  });

  it('lets a Company with the certificate still missing edit (not Active yet)', async () => {
    const { accessToken } = await developer();
    const created = await saveProfessionalProfile(app, accessToken, company);
    await seedDocuments(created.body.data.profile.id, {
      government_id: 'approved',
      profile_photo: 'approved',
    });

    const res = await saveProfessionalProfile(app, accessToken, { ...company, licenseNumber: 'RERA-999' });

    expect(res.status).toBe(200);
    expect(res.body.data.profile.licenseNumber).toBe('RERA-999');
  });

  it('works for a Buyer who became a Developer, with the refreshed token', async () => {
    const res = await signUpAndVerify(app, mailer);
    const { accessToken } = res.body.data;
    expect((await becomeDeveloper(app, accessToken)).status).toBe(201);

    // The old token still says Buyer only.
    expect((await saveProfessionalProfile(app, accessToken, company)).status).toBe(403);
    const refreshed = await refresh(app, refreshTokenOf(res));

    const saved = await saveProfessionalProfile(app, refreshed.body.data.accessToken, company);
    expect(saved.status).toBe(200);
  });

  it('answers 403 FORBIDDEN for a buyer-only Account, before validation, and stores nothing', async () => {
    const { accessToken, user } = await signUpAndVerify(app, mailer).then((res) => res.body.data);

    const res = await saveProfessionalProfile(app, accessToken, { developerType: 'agency' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual(errorBody('FORBIDDEN'));
    expect(await profilesOf(user.id)).toHaveLength(0);
  });

  it('answers 401 without a token and with a bad token', async () => {
    const none = await request(app).put(PROFESSIONAL_PROFILE).send(company);
    expect(none.status).toBe(401);
    expect(none.body).toEqual(errorBody('UNAUTHORIZED'));

    const bad = await saveProfessionalProfile(app, 'not-a-token', company);
    expect(bad.status).toBe(401);
  });

  it('answers 401 for a Developer Account deleted since its token was issued', async () => {
    const { accessToken, user } = await developer();
    await models.User.destroy({ where: { id: user.id } });

    const res = await saveProfessionalProfile(app, accessToken, company);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(errorBody('UNAUTHORIZED'));
  });

  it('answers 401 for a Developer token of an Account that never existed', async () => {
    const token = signAccessToken({ userId: 987654, roles: ['developer'] });

    const res = await saveProfessionalProfile(app, token, company);

    expect(res.status).toBe(401);
  });
});
