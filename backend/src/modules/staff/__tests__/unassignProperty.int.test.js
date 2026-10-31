import request from 'supertest';
import { commonMessages, staffMessages } from '@real-estate/shared';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import {
  activeDeveloper,
  assignProperties,
  buyerAccount,
  createProperty,
  createStaffMember,
  developerUnderReview,
} from '../../../test/staffFactories.js';

// STAFF-010: DELETE /api/staff/:id/properties/:propertyId (STAFF-SPEC-001 E9).
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

describe('DELETE /api/staff/:id/properties/:propertyId', () => {
  let app;
  beforeEach(() => {
    ({ app } = createTestApp());
  });

  const unassign = (developer, id, propertyId) =>
    request(app).delete(`/api/staff/${id}/properties/${propertyId}`).set(bearer(developer.accessToken));

  it('removes the assignment, keeps the property and lists it as assignable again', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    const property = await createProperty(developer.id, { name: 'Skyline Tower' });
    const kept = await createProperty(developer.id, { name: 'Harbor View' });
    await assignProperties(member.id, [property.id, kept.id]);

    const res = await unassign(developer, member.id, property.id);

    expect(res.status).toBe(200);
    expect(res.body.data.staffMember.assignedProperties.map((p) => p.id)).toEqual([kept.id]);
    expect(await models.Property.count({ where: { id: property.id } })).toBe(1);
    const assignable = await request(app)
      .get(`/api/staff/${member.id}/assignable-properties`)
      .set(bearer(developer.accessToken));
    expect(assignable.body.data.properties.map((p) => p.id)).toEqual([property.id]);
  });

  it("answers 404 notAssigned for a property not assigned to this member, including another developer's", async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    const colleague = await createStaffMember(developer.id);
    const colleagues = await createProperty(developer.id);
    await assignProperties(colleague.id, [colleagues.id]);
    const foreign = await createProperty((await activeDeveloper()).id);

    for (const propertyId of [colleagues.id, foreign.id, 999999]) {
      const res = await unassign(developer, member.id, propertyId);
      expect(res.status).toBe(404);
      expect(res.body.error).toEqual({ code: 'NOT_FOUND', message: staffMessages.api.notAssigned });
    }
    expect(await models.StaffPropertyAssignment.count({ where: { staffMemberId: colleague.id } })).toBe(1);
  });

  it("answers 404 notFound for an unknown or another developer's member, leaving its assignment", async () => {
    const developer = await activeDeveloper();
    const other = await activeDeveloper();
    const foreign = await createStaffMember(other.id);
    const property = await createProperty(other.id);
    await assignProperties(foreign.id, [property.id]);

    for (const id of [foreign.id, 999999]) {
      const res = await unassign(developer, id, property.id);
      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe(staffMessages.api.notFound);
    }
    expect(await models.StaffPropertyAssignment.count({ where: { staffMemberId: foreign.id } })).toBe(1);
  });

  it.each([
    ['abc', '1', 'id', commonMessages.id.invalid],
    ['0', '1', 'id', commonMessages.id.invalid],
    ['1', '0', 'propertyId', staffMessages.propertyId.invalid],
    ['1', '1.5', 'propertyId', staffMessages.propertyId.invalid],
  ])('rejects ids %s / %s with 422 on %s', async (id, propertyId, field, message) => {
    const res = await unassign(await activeDeveloper(), id, propertyId);
    expect(res.status).toBe(422);
    expect(res.body.error.fields[field]).toEqual([message]);
  });

  describe('access', () => {
    it('refuses a request without a token with 401', async () => {
      expect((await request(app).delete('/api/staff/1/properties/1')).status).toBe(401);
    });

    it('refuses a Buyer with 403 FORBIDDEN', async () => {
      expect((await unassign(await buyerAccount(), 'abc', 1)).body.error.code).toBe('FORBIDDEN');
    });

    it('refuses a Developer under review with 403 DEVELOPER_NOT_ACTIVE', async () => {
      expect((await unassign(await developerUnderReview(), 'abc', 1)).body.error.code).toBe(
        'DEVELOPER_NOT_ACTIVE',
      );
    });
  });
});
