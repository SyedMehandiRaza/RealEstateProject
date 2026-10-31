import request from 'supertest';
import { authMessages, commonMessages, staffMessages } from '@real-estate/shared';
import models, { sequelize } from '../../../models/index.js';
import { createFakeStorage, silentLogger } from '../../../test/fileFakes.js';
import { createTestApp } from '../../../test/testApp.js';
import {
  activeDeveloper,
  assignProperties,
  buyerAccount,
  createProperty,
  createStaffMember,
  developerUnderReview,
} from '../../../test/staffFactories.js';
import { createUserDeletionService } from '../../auth/userDeletion.service.js';
import { createFileDeletionService } from '../../files/fileDeletion.service.js';
import { createPendingFileDeletionRepository } from '../../files/pendingFileDeletion.repository.js';

// STAFF-007: DELETE /api/staff/:id (STAFF-SPEC-001 E6, STAFF-DEC-003).
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

describe('DELETE /api/staff/:id', () => {
  let app;
  beforeEach(() => {
    ({ app } = createTestApp());
  });

  const removeStaff = (developer, id) =>
    request(app).delete(`/api/staff/${id}`).set(bearer(developer.accessToken));

  it('removes the member with its permissions and assignments, keeping the properties', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id, { permissions: ['marketing', 'leads_crm'] });
    const kept = await createStaffMember(developer.id);
    const property = await createProperty(developer.id);
    await assignProperties(member.id, [property.id]);

    const res = await removeStaff(developer, member.id);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(await models.StaffMember.count({ where: { id: member.id } })).toBe(0);
    expect(await models.StaffMemberPermission.count({ where: { staffMemberId: member.id } })).toBe(0);
    expect(await models.StaffPropertyAssignment.count({ where: { staffMemberId: member.id } })).toBe(0);
    expect(await models.Property.count({ where: { id: property.id } })).toBe(1);
    const list = await request(app).get('/api/staff').set(bearer(developer.accessToken));
    expect(list.body.data.map((m) => m.id)).toEqual([kept.id]);
  });

  it('answers 404 when the member was already removed', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    expect((await removeStaff(developer, member.id)).status).toBe(204);
    const again = await removeStaff(developer, member.id);
    expect(again.status).toBe(404);
    expect(again.body.error).toEqual({ code: 'NOT_FOUND', message: staffMessages.api.notFound });
  });

  it("answers 404 for another developer's member and does not delete it", async () => {
    const developer = await activeDeveloper();
    const foreign = await createStaffMember((await activeDeveloper()).id);
    const res = await removeStaff(developer, foreign.id);
    expect(res.status).toBe(404);
    expect(await models.StaffMember.count({ where: { id: foreign.id } })).toBe(1);
  });

  it('rejects an invalid id with 422', async () => {
    const res = await removeStaff(await activeDeveloper(), 'abc');
    expect(res.status).toBe(422);
    expect(res.body.error.fields).toEqual({ id: [commonMessages.id.invalid] });
  });

  it('lets the account be deleted once its staff are removed (PROP-DEC-001)', async () => {
    const storage = createFakeStorage();
    const deletion = createUserDeletionService({
      sequelize,
      models,
      fileDeletion: createFileDeletionService({
        repository: createPendingFileDeletionRepository(models),
        storage,
        logger: silentLogger(),
      }),
    });
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);

    await expect(deletion.deleteUser(developer.id)).rejects.toMatchObject({
      code: 'CONFLICT',
      message: authMessages.api.accountHasPropertiesOrStaff,
    });

    expect((await removeStaff(developer, member.id)).status).toBe(204);
    await deletion.deleteUser(developer.id);
    expect(await models.User.count({ where: { id: developer.id } })).toBe(0);
  });

  describe('access', () => {
    it('refuses a request without a token with 401', async () => {
      expect((await request(app).delete('/api/staff/1')).status).toBe(401);
    });

    it('refuses a Buyer with 403 FORBIDDEN', async () => {
      expect((await removeStaff(await buyerAccount(), 'abc')).body.error.code).toBe('FORBIDDEN');
    });

    it('refuses a Developer under review with 403 DEVELOPER_NOT_ACTIVE', async () => {
      expect((await removeStaff(await developerUnderReview(), 'abc')).body.error.code).toBe(
        'DEVELOPER_NOT_ACTIVE',
      );
    });
  });
});
