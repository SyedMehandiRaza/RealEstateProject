import { jest } from '@jest/globals';
import request from 'supertest';
import { staffMessages } from '@real-estate/shared';
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

// STAFF-008: GET /api/staff/:id/assignable-properties (STAFF-SPEC-001 E7).
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

describe('GET /api/staff/:id/assignable-properties', () => {
  let app;
  beforeEach(() => {
    ({ app } = createTestApp());
  });
  afterEach(() => jest.restoreAllMocks());

  const assignable = (developer, id) =>
    request(app).get(`/api/staff/${id}/assignable-properties`).set(bearer(developer.accessToken));

  it("lists the caller's properties not assigned to this member, by name then id", async () => {
    const developer = await activeDeveloper();
    const other = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    const colleague = await createStaffMember(developer.id);
    const zenith = await createProperty(developer.id, {
      name: 'Zenith Heights',
      city: 'Pune',
      state: 'Maharashtra',
      propertyStatus: 'under_construction',
    });
    const alpha2 = await createProperty(developer.id, { name: 'Alpha Court' });
    const alpha1 = await createProperty(developer.id, { name: 'Alpha Court' });
    const assigned = await createProperty(developer.id, { name: 'Already Mine' });
    await createProperty(other.id, { name: 'Foreign Tower' });
    await assignProperties(member.id, [assigned.id]);
    await assignProperties(colleague.id, [zenith.id]);

    const res = await assignable(developer, member.id);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        properties: [
          {
            id: alpha2.id,
            name: 'Alpha Court',
            city: 'Mumbai',
            state: 'Maharashtra',
            propertyStatus: 'ready_to_move',
          },
          {
            id: alpha1.id,
            name: 'Alpha Court',
            city: 'Mumbai',
            state: 'Maharashtra',
            propertyStatus: 'ready_to_move',
          },
          {
            id: zenith.id,
            name: 'Zenith Heights',
            city: 'Pune',
            state: 'Maharashtra',
            propertyStatus: 'under_construction',
          },
        ],
      },
    });
  });

  it('lists every property for a member with no assignment yet', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    const property = await createProperty(developer.id);
    const res = await assignable(developer, member.id);
    expect(res.body.data.properties.map((p) => p.id)).toEqual([property.id]);
  });

  it('answers an empty list when the developer has no properties, or all are assigned', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    expect((await assignable(developer, member.id)).body.data).toEqual({ properties: [] });

    const property = await createProperty(developer.id);
    await assignProperties(member.id, [property.id]);
    expect((await assignable(developer, member.id)).body.data).toEqual({ properties: [] });
  });

  it('never writes to a property table', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    await createProperty(developer.id);
    const writes = ['create', 'update', 'destroy', 'bulkCreate', 'upsert'].map((method) =>
      jest.spyOn(models.Property, method),
    );
    expect((await assignable(developer, member.id)).status).toBe(200);
    for (const spy of writes) expect(spy).not.toHaveBeenCalled();
  });

  it("answers 404 for an unknown or another developer's member", async () => {
    const developer = await activeDeveloper();
    const foreign = await createStaffMember((await activeDeveloper()).id);
    for (const id of [foreign.id, 999999]) {
      const res = await assignable(developer, id);
      expect(res.status).toBe(404);
      expect(res.body.error).toEqual({ code: 'NOT_FOUND', message: staffMessages.api.notFound });
    }
  });

  describe('access', () => {
    it('refuses a request without a token with 401', async () => {
      expect((await request(app).get('/api/staff/1/assignable-properties')).status).toBe(401);
    });

    it('refuses a Buyer with 403 FORBIDDEN', async () => {
      expect((await assignable(await buyerAccount(), 1)).body.error.code).toBe('FORBIDDEN');
    });

    it('refuses a Developer under review with 403 DEVELOPER_NOT_ACTIVE', async () => {
      expect((await assignable(await developerUnderReview(), 1)).body.error.code).toBe(
        'DEVELOPER_NOT_ACTIVE',
      );
    });
  });
});
