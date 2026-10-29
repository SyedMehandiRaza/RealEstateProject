import models, { sequelize } from '../../../models/index.js';
import { seedDocument } from '../../../test/verificationDocuments.js';
import { createAuthRepository } from '../auth.repository.js';
import { toUserResponse } from '../auth.presenter.js';

// What the Account reads load for user.developerVerificationStatus (TASK-048): nothing beyond the roles
// for a non-Developer, and for a Developer the profile with only the latest document row of each kind.

const repository = createAuthRepository(models);
const T0 = new Date('2026-10-01T10:00:00.000Z');
const later = (seconds) => new Date(T0.getTime() + seconds * 1000);

let created = 0;
async function account(roles) {
  created += 1;
  const user = await models.User.create({
    fullName: 'Repo Tester',
    email: `repo-${created}@example.com`,
    phone: '+971501234567',
    passwordHash: 'not-a-real-hash',
    emailVerifiedAt: T0,
  });
  for (const role of roles) await models.UserRole.create({ userId: user.id, role });
  return user;
}

async function developerWithProfile(businessType = 'individual') {
  const user = await account(['buyer', 'developer']);
  const profile = await models.ProfessionalProfile.create({
    userId: user.id,
    organizationName: businessType === 'company' ? 'Acme Homes' : null,
    businessType,
    licenseNumber: 'LIC-1',
    experienceLevel: '3_5',
    location: 'Dubai',
  });
  return { user, profile };
}

// Every SELECT the callback runs, as SQL text.
async function selectsOf(callback) {
  const query = jest.spyOn(sequelize, 'query');
  try {
    const result = await callback();
    const selects = query.mock.calls.map(([sql]) => String(sql)).filter((sql) => /^\s*SELECT/i.test(sql));
    return { result, selects };
  } finally {
    query.mockRestore();
  }
}

const reads = {
  findUserById: (user) => repository.findUserById(user.id),
  findUserByEmail: (user) => repository.findUserByEmail(user.email),
  findUserForLogin: (user) => repository.findUserForLogin(user.email),
  'findUserById in a transaction': (user) =>
    sequelize.transaction((transaction) => repository.findUserById(user.id, { transaction })),
};

describe('auth.repository Account reads (TASK-048)', () => {
  describe.each(Object.entries(reads))('%s', (_name, read) => {
    it('reads a buyer-only Account and its roles in one SELECT, without profile or documents', async () => {
      const buyer = await account(['buyer']);

      const { result, selects } = await selectsOf(() => read(buyer));

      expect(result.roles.map((r) => r.role)).toEqual(['buyer']);
      expect(toUserResponse(result).developerVerificationStatus).toBeNull();
      expect(selects).toHaveLength(1);
      expect(selects[0]).not.toMatch(/professional_profiles|verification_documents/);
    });

    it('loads only the latest document of each kind for a Developer', async () => {
      const { user, profile } = await developerWithProfile('individual');
      await seedDocument(profile.id, { documentKind: 'government_id', status: 'rejected', createdAt: T0 });
      await seedDocument(profile.id, {
        documentKind: 'government_id',
        status: 'rejected',
        createdAt: later(1),
      });
      const latestId = await seedDocument(profile.id, {
        documentKind: 'government_id',
        status: 'approved',
        createdAt: later(2),
      });
      await seedDocument(profile.id, { documentKind: 'profile_photo', status: 'rejected', createdAt: T0 });
      const latestPhoto = await seedDocument(profile.id, {
        documentKind: 'profile_photo',
        status: 'approved',
        createdAt: later(1),
      });

      const result = await read(user);

      const ids = result.professionalProfile.documents.map((d) => d.id).sort((a, b) => a - b);
      expect(ids).toEqual([latestId.id, latestPhoto.id].sort((a, b) => a - b));
      expect(toUserResponse(result).developerVerificationStatus).toBe('active');
    });

    it('breaks a created_at tie by the higher id, as verificationStatus does', async () => {
      const { user, profile } = await developerWithProfile('individual');
      await seedDocument(profile.id, { documentKind: 'government_id', status: 'approved', createdAt: T0 });
      const newer = await seedDocument(profile.id, {
        documentKind: 'government_id',
        status: 'rejected',
        createdAt: T0,
      });

      const result = await read(user);

      expect(result.professionalProfile.documents.map((d) => d.id)).toEqual([newer.id]);
      expect(toUserResponse(result).developerVerificationStatus).toBe('unsuccessful');
    });

    it('gives a Developer without documents an empty list (Under Review)', async () => {
      const { user } = await developerWithProfile('company');

      const result = await read(user);

      expect(result.professionalProfile.documents).toEqual([]);
      expect(toUserResponse(result).developerVerificationStatus).toBe('under_review');
    });

    it('gives a Developer without Professional info a null profile (Under Review)', async () => {
      const user = await account(['buyer', 'developer']);

      const result = await read(user);

      expect(result.professionalProfile).toBeNull();
      expect(toUserResponse(result).developerVerificationStatus).toBe('under_review');
    });

    it('never mixes in the documents of another Developer', async () => {
      const { user } = await developerWithProfile('individual');
      const other = await developerWithProfile('individual');
      await seedDocument(other.profile.id, {
        documentKind: 'government_id',
        status: 'approved',
        createdAt: T0,
      });

      const result = await read(user);

      expect(result.professionalProfile.documents).toEqual([]);
    });
  });

  it('answers null for an unknown Account', async () => {
    expect(await repository.findUserById(999999)).toBeNull();
    expect(await repository.findUserByEmail('nobody@example.com')).toBeNull();
    expect(await repository.findUserForLogin('nobody@example.com')).toBeNull();
  });
});
