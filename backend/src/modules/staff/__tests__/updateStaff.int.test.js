import { jest } from '@jest/globals';
import request from 'supertest';
import { commonMessages, staffMessages } from '@real-estate/shared';
import { staffMemberCases } from '@real-estate/shared/testing';
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

// STAFF-005: PUT /api/staff/:id (STAFF-SPEC-001 E4).
const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const valid = staffMemberCases.valid;

describe('PUT /api/staff/:id', () => {
  let app;
  beforeEach(() => {
    ({ app } = createTestApp());
  });
  afterEach(() => jest.restoreAllMocks());

  const editStaff = (developer, id, body) =>
    request(app).put(`/api/staff/${id}`).set(bearer(developer.accessToken)).send(body);

  it('saves every field, replaces the permission set and keeps status and assignments', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id, {
      email: 'old@example.com',
      status: 'disabled',
      permissions: ['marketing', 'leads_crm'],
    });
    const property = await createProperty(developer.id, { name: 'Skyline Tower' });
    await assignProperties(member.id, [property.id]);

    const res = await editStaff(developer, member.id, {
      fullName: '  Rajesh K Mehta ',
      email: 'New@Example.com',
      phone: '+971 50 123 4567',
      role: 'agent',
      permissions: ['facility_management', 'leads_crm'],
    });

    expect(res.status).toBe(200);
    expect(res.body.data.staffMember).toMatchObject({
      id: member.id,
      fullName: 'Rajesh K Mehta',
      email: 'new@example.com',
      phone: '+971501234567',
      role: 'agent',
      status: 'disabled',
      permissions: ['leads_crm', 'facility_management'],
      assignedProperties: [expect.objectContaining({ id: property.id, name: 'Skyline Tower' })],
    });
    const rows = await models.StaffMemberPermission.findAll({ where: { staffMemberId: member.id } });
    expect(rows.map((r) => r.permission).sort()).toEqual(['facility_management', 'leads_crm']);
  });

  it("keeps the member's own email without a conflict", async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id, { email: valid.email });
    const res = await editStaff(developer, member.id, valid);
    expect(res.status).toBe(200);
  });

  it("refuses another member's email of the same employer with 409 email.taken", async () => {
    const developer = await activeDeveloper();
    await createStaffMember(developer.id, { email: 'taken@example.com' });
    const member = await createStaffMember(developer.id, { email: 'mine@example.com' });

    const res = await editStaff(developer, member.id, { ...valid, email: 'TAKEN@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'CONFLICT',
      fields: { email: [staffMessages.email.taken] },
    });
    expect((await models.StaffMember.findByPk(member.id)).email).toBe('mine@example.com');
  });

  it("allows an email another developer's staff member has", async () => {
    const developer = await activeDeveloper();
    const other = await activeDeveloper();
    await createStaffMember(other.id, { email: valid.email });
    const member = await createStaffMember(developer.id);
    expect((await editStaff(developer, member.id, valid)).status).toBe(200);
  });

  it("refuses the developer's own email with 409 email.self", async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    const res = await editStaff(developer, member.id, { ...valid, email: developer.email });
    expect(res.status).toBe(409);
    expect(res.body.error.fields).toEqual({ email: [staffMessages.email.self] });
  });

  it('rolls everything back when the permission insert fails', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id, {
      fullName: 'Before Edit',
      permissions: ['marketing'],
    });
    jest.spyOn(models.StaffMemberPermission, 'bulkCreate').mockRejectedValueOnce(new Error('insert failed'));

    const res = await editStaff(developer, member.id, { ...valid, permissions: ['leads_crm'] });

    expect(res.status).toBe(500);
    const stored = await models.StaffMember.findByPk(member.id, {
      include: [{ model: models.StaffMemberPermission, as: 'permissions' }],
    });
    expect(stored.fullName).toBe('Before Edit');
    expect(stored.permissions.map((p) => p.permission)).toEqual(['marketing']);
  });

  it("answers 404 for an unknown or another developer's member, even with a taken email", async () => {
    const developer = await activeDeveloper();
    const other = await activeDeveloper();
    const foreign = await createStaffMember(other.id, { email: 'foreign-old@example.com' });
    await createStaffMember(other.id, { email: 'foreign-taken@example.com' });

    for (const id of [foreign.id, 999999]) {
      const res = await editStaff(developer, id, { ...valid, email: 'foreign-taken@example.com' });
      expect(res.status).toBe(404);
      expect(res.body.error).toEqual({ code: 'NOT_FOUND', message: staffMessages.api.notFound });
    }
    expect((await models.StaffMember.findByPk(foreign.id)).email).toBe('foreign-old@example.com');
  });

  it('rejects an invalid id with 422', async () => {
    const developer = await activeDeveloper();
    const res = await editStaff(developer, 'abc', valid);
    expect(res.status).toBe(422);
    expect(res.body.error.fields.id).toEqual([commonMessages.id.invalid]);
  });

  describe('access', () => {
    it('refuses a request without a token with 401', async () => {
      expect((await request(app).put('/api/staff/1').send(valid)).status).toBe(401);
    });

    it('refuses a Buyer with 403 FORBIDDEN before validating', async () => {
      const res = await editStaff(await buyerAccount(), 1, {});
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('refuses a Developer under review with 403 DEVELOPER_NOT_ACTIVE before validating', async () => {
      const res = await editStaff(await developerUnderReview(), 1, {});
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('DEVELOPER_NOT_ACTIVE');
    });
  });

  describe('validation parity', () => {
    let developer;
    let member;
    beforeEach(async () => {
      developer = await activeDeveloper();
      member = await createStaffMember(developer.id);
    });

    it.each(staffMemberCases.invalid)(
      'rejects $name with the shared message',
      async ({ input, field, message }) => {
        const res = await editStaff(developer, member.id, { ...valid, ...input });
        expect(res.status).toBe(422);
        expect(res.body.error.fields[field]).toContain(message);
      },
    );
  });
});
