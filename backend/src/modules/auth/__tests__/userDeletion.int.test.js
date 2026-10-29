import crypto from 'node:crypto';
import models, { sequelize } from '../../../models/index.js';
import { createFakeStorage, silentLogger } from '../../../test/fileFakes.js';
import { createFileDeletionService } from '../../files/fileDeletion.service.js';
import { createPendingFileDeletionRepository } from '../../files/pendingFileDeletion.repository.js';
import { createUserDeletionService } from '../userDeletion.service.js';

const hex64 = () => crypto.randomBytes(32).toString('hex');
const inMinutes = (minutes) => new Date(Date.now() + minutes * 60_000);

// An Account with every kind of dependent row. refresh_tokens and verification_codes have no models yet.
async function createDeveloper(email) {
  const user = await models.User.create({
    fullName: 'Dev Eloper',
    email,
    phone: '+919876543210',
    passwordHash: 'not-a-real-hash',
    emailVerifiedAt: new Date(),
  });
  await models.UserRole.bulkCreate([
    { userId: user.id, role: 'buyer' },
    { userId: user.id, role: 'developer' },
  ]);
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.bulkInsert('refresh_tokens', [
    { user_id: user.id, jti: crypto.randomUUID(), token_hash: hex64(), expires_at: inMinutes(60) },
  ]);
  await queryInterface.bulkInsert('verification_codes', [
    { user_id: user.id, purpose: 'email_verification', code_hash: hex64(), expires_at: inMinutes(10) },
  ]);
  const profile = await models.ProfessionalProfile.create({
    userId: user.id,
    businessType: 'individual',
    licenseNumber: 'LIC-1',
    experienceLevel: '3_5',
    location: 'Pune',
  });
  const prefix = `realestate/test/documents/${profile.id}`;
  const documents = await models.VerificationDocument.bulkCreate([
    {
      professionalProfileId: profile.id,
      documentKind: 'government_id',
      idDocumentType: 'passport',
      cloudinaryPublicId: `${prefix}/id.pdf`,
      cloudinaryResourceType: 'raw',
      originalFilename: 'passport.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1000,
    },
    {
      professionalProfileId: profile.id,
      documentKind: 'profile_photo',
      cloudinaryPublicId: `${prefix}/photo`,
      cloudinaryResourceType: 'image',
      originalFilename: 'me.png',
      mimeType: 'image/png',
      sizeBytes: 2000,
    },
  ]);
  return { user, profile, documents };
}

const countFor = async (table, column, id) =>
  (
    await sequelize.query(`SELECT COUNT(*) AS n FROM \`${table}\` WHERE \`${column}\` = :id`, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT,
    })
  )[0].n;

function setup() {
  const storage = createFakeStorage();
  const fileDeletion = createFileDeletionService({
    repository: createPendingFileDeletionRepository(models),
    storage,
    logger: silentLogger(),
  });
  return { storage, service: createUserDeletionService({ sequelize, models, fileDeletion }) };
}

describe('user deletion on MySQL', () => {
  it('cascades to roles, tokens, codes, profile and documents, and queues their files', async () => {
    const { storage, service } = setup();
    const { user, profile, documents } = await createDeveloper('leaving@example.com');

    await service.deleteUser(user.id);

    expect(await models.User.count({ where: { id: user.id } })).toBe(0);
    for (const table of ['user_roles', 'refresh_tokens', 'verification_codes', 'professional_profiles']) {
      expect(await countFor(table, 'user_id', user.id)).toBe(0);
    }
    expect(await countFor('verification_documents', 'professional_profile_id', profile.id)).toBe(0);

    const queued = await models.PendingFileDeletion.findAll({ order: [['publicId', 'ASC']], raw: true });
    const expected = documents
      .map((document) => ({
        publicId: document.cloudinaryPublicId,
        resourceType: document.cloudinaryResourceType,
      }))
      .sort((a, b) => a.publicId.localeCompare(b.publicId));
    expect(queued).toEqual(
      expected.map((file) =>
        expect.objectContaining({
          ...file,
          deliveryType: 'authenticated',
          reason: 'record_deleted',
          status: 'pending',
        }),
      ),
    );
    // Cloudinary is never called inside the transaction; the worker deletes the files later.
    expect(storage.calls).toEqual([]);
  });

  it("leaves other Accounts' rows alone and clears the deleted user as a reviewer", async () => {
    const { service } = setup();
    const reviewer = await createDeveloper('reviewer@example.com');
    const other = await createDeveloper('stays@example.com');
    const [reviewed] = other.documents;
    await reviewed.update({ status: 'approved', reviewedBy: reviewer.user.id, reviewedAt: new Date() });

    await service.deleteUser(reviewer.user.id);

    expect(await countFor('user_roles', 'user_id', other.user.id)).toBe(2);
    expect(await countFor('refresh_tokens', 'user_id', other.user.id)).toBe(1);
    expect(await countFor('verification_codes', 'user_id', other.user.id)).toBe(1);
    expect(await countFor('verification_documents', 'professional_profile_id', other.profile.id)).toBe(2);
    expect(await models.VerificationDocument.findByPk(reviewed.id, { raw: true })).toMatchObject({
      status: 'approved',
      reviewedBy: null,
    });
    expect(await models.PendingFileDeletion.count()).toBe(2);
  });

  it('answers NOT_FOUND for an unknown Account and changes nothing', async () => {
    const { service } = setup();
    const { user } = await createDeveloper('stays@example.com');

    await expect(service.deleteUser(user.id + 1000)).rejects.toMatchObject({ code: 'NOT_FOUND' });

    expect(await models.User.count()).toBe(1);
    expect(await models.PendingFileDeletion.count()).toBe(0);
  });
});
