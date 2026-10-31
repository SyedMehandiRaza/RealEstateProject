import request from 'supertest';
import { ERROR_CODES, staffMessages } from '@real-estate/shared';
import { assignPropertyCases } from '@real-estate/shared/testing';
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

// STAFF-009: POST /api/staff/:id/properties (STAFF-SPEC-001 E8).
const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const NOW = Math.floor(Date.now() / 1000) * 1000;

describe('POST /api/staff/:id/properties', () => {
  let app;
  beforeEach(() => {
    ({ app } = createTestApp());
  });

  const assign = (developer, id, body) =>
    request(app).post(`/api/staff/${id}/properties`).set(bearer(developer.accessToken)).send(body);

  it('assigns an own property and returns the member with the new card first', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    const older = await createProperty(developer.id, { name: 'Older Assignment' });
    await assignProperties(member.id, [older.id], { createdAt: new Date(NOW - 3_600_000) });
    const property = await createProperty(developer.id, { name: 'Skyline Tower' });

    const res = await assign(developer, member.id, { propertyId: property.id });

    expect(res.status).toBe(201);
    expect(res.body.data.staffMember.assignedProperties).toEqual([
      {
        id: property.id,
        name: 'Skyline Tower',
        city: 'Mumbai',
        state: 'Maharashtra',
        propertyStatus: 'ready_to_move',
        assignedAt: expect.any(String),
      },
      expect.objectContaining({ id: older.id }),
    ]);
  });

  it('assigns to a disabled member', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id, { status: 'disabled' });
    const property = await createProperty(developer.id);
    const res = await assign(developer, member.id, { propertyId: property.id });
    expect(res.status).toBe(201);
    expect(res.body.data.staffMember.status).toBe('disabled');
  });

  it("answers 404 propertyNotFound for an unknown or another developer's property", async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    const foreign = await createProperty((await activeDeveloper()).id);
    for (const propertyId of [foreign.id, 999999]) {
      const res = await assign(developer, member.id, { propertyId });
      expect(res.status).toBe(404);
      expect(res.body.error).toEqual({ code: 'NOT_FOUND', message: staffMessages.api.propertyNotFound });
    }
    expect(await models.StaffPropertyAssignment.count()).toBe(0);
  });

  it('answers 409 alreadyAssigned, without fields, for a property already assigned', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    const property = await createProperty(developer.id);
    await assignProperties(member.id, [property.id]);

    const res = await assign(developer, member.id, { propertyId: property.id });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'CONFLICT', message: staffMessages.api.alreadyAssigned },
    });
  });

  it('turns a race on the same assignment into one 201 and one 409', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    const property = await createProperty(developer.id);
    const results = await Promise.all([
      assign(developer, member.id, { propertyId: property.id }),
      assign(developer, member.id, { propertyId: property.id }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409).body.error.message).toBe(staffMessages.api.alreadyAssigned);
    expect(await models.StaffPropertyAssignment.count()).toBe(1);
  });

  it("answers 404 notFound for an unknown or another developer's member", async () => {
    const developer = await activeDeveloper();
    const property = await createProperty(developer.id);
    const foreign = await createStaffMember((await activeDeveloper()).id);
    for (const id of [foreign.id, 999999]) {
      const res = await assign(developer, id, { propertyId: property.id });
      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe(staffMessages.api.notFound);
    }
  });

  describe('access', () => {
    it('refuses a request without a token with 401', async () => {
      expect((await request(app).post('/api/staff/1/properties').send({ propertyId: 1 })).status).toBe(401);
    });

    it('refuses a Buyer with 403 FORBIDDEN before validating', async () => {
      const res = await assign(await buyerAccount(), 1, {});
      expect(res.body.error).toEqual({ code: 'FORBIDDEN', message: ERROR_CODES.FORBIDDEN.message });
    });

    it('refuses a Developer under review with 403 DEVELOPER_NOT_ACTIVE before validating', async () => {
      expect((await assign(await developerUnderReview(), 1, {})).body.error.code).toBe(
        'DEVELOPER_NOT_ACTIVE',
      );
    });
  });

  describe('validation parity', () => {
    it.each(assignPropertyCases.invalid)(
      'rejects $name with the shared message',
      async ({ input, field, message }) => {
        const developer = await activeDeveloper();
        const member = await createStaffMember(developer.id);
        const res = await assign(developer, member.id, { ...assignPropertyCases.valid, ...input });
        expect(res.status).toBe(422);
        expect(res.body.error.fields[field]).toContain(message);
      },
    );
  });
});
