import { jest } from '@jest/globals';
import request from 'supertest';
import { ERROR_CODES, STAFF_PERMISSIONS, staffMessages } from '@real-estate/shared';
import { staffMemberCases } from '@real-estate/shared/testing';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import {
  activeDeveloper,
  buyerAccount,
  createStaffMember,
  developerUnderReview,
} from '../../../test/staffFactories.js';

// STAFF-003: POST /api/staff (STAFF-SPEC-001 E2).
const STAFF = '/api/staff';
const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const valid = staffMemberCases.valid;

describe('POST /api/staff', () => {
  let app;
  let mailer;
  beforeEach(() => {
    ({ app, mailer } = createTestApp());
  });
  afterEach(() => jest.restoreAllMocks());

  const addStaff = (developer, body) =>
    request(app).post(STAFF).set(bearer(developer.accessToken)).send(body);

  it('adds an Active staff member with the permissions in the shared order and no properties', async () => {
    const developer = await activeDeveloper();

    const res = await addStaff(developer, {
      ...valid,
      email: ' Rajesh@Example.COM ',
      permissions: ['leads_crm', 'properties_management', 'marketing'],
    });

    expect(res.status).toBe(201);
    const { staffMember } = res.body.data;
    expect(staffMember).toEqual({
      id: expect.any(Number),
      fullName: 'Rajesh Mehta',
      email: 'rajesh@example.com',
      phone: '+917485961245',
      role: 'agent',
      status: 'active',
      permissions: ['properties_management', 'leads_crm', 'marketing'],
      assignedProperties: [],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    const stored = await models.StaffMember.findByPk(staffMember.id);
    expect(stored).toMatchObject({ employerId: developer.id, userId: null, email: 'rajesh@example.com' });
    expect(res.text).not.toMatch(/employerId|userId/);
    expect(mailer.messages).toEqual([]);
  });

  it('accepts every permission at once', async () => {
    const developer = await activeDeveloper();
    const res = await addStaff(developer, { ...valid, permissions: [...STAFF_PERMISSIONS].reverse() });
    expect(res.status).toBe(201);
    expect(res.body.data.staffMember.permissions).toEqual(STAFF_PERMISSIONS);
  });

  it('shows the new member first in the list', async () => {
    const developer = await activeDeveloper();
    await createStaffMember(developer.id, { createdAt: new Date(Date.now() - 60_000) });
    const res = await addStaff(developer, valid);
    const list = await request(app).get(STAFF).set(bearer(developer.accessToken));
    expect(list.body.data[0].id).toBe(res.body.data.staffMember.id);
  });

  describe('email rules', () => {
    it('refuses an email the employer already uses (any case) with 409 and the shared field message', async () => {
      const developer = await activeDeveloper();
      await createStaffMember(developer.id, { email: 'rajesh@example.com' });

      const res = await addStaff(developer, { ...valid, email: 'RAJESH@example.com' });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        success: false,
        error: {
          code: 'CONFLICT',
          message: ERROR_CODES.CONFLICT.message,
          fields: { email: [staffMessages.email.taken] },
        },
      });
    });

    it('lets another developer add the same email', async () => {
      const developer = await activeDeveloper();
      const other = await activeDeveloper();
      await createStaffMember(other.id, { email: valid.email });
      expect((await addStaff(developer, valid)).status).toBe(201);
    });

    it('turns a race on the same email into one 201 and one 409, never the raw database error', async () => {
      const developer = await activeDeveloper();
      const results = await Promise.all([addStaff(developer, valid), addStaff(developer, valid)]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      const conflict = results.find((r) => r.status === 409);
      expect(conflict.body.error.fields).toEqual({ email: [staffMessages.email.taken] });
      expect(await models.StaffMember.count({ where: { employerId: developer.id } })).toBe(1);
    });

    it("refuses the developer's own email (any case) with 409 and the shared field message", async () => {
      const developer = await activeDeveloper();
      const res = await addStaff(developer, { ...valid, email: developer.email.toUpperCase() });
      expect(res.status).toBe(409);
      expect(res.body.error.fields).toEqual({ email: [staffMessages.email.self] });
      expect(await models.StaffMember.count()).toBe(0);
    });
  });

  it('writes the member and its permissions in one transaction', async () => {
    const developer = await activeDeveloper();
    jest.spyOn(models.StaffMemberPermission, 'bulkCreate').mockRejectedValueOnce(new Error('insert failed'));

    const res = await addStaff(developer, valid);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(await models.StaffMember.count()).toBe(0);
  });

  describe('access', () => {
    it('refuses a request without a token with 401', async () => {
      const res = await request(app).post(STAFF).send(valid);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('refuses a Buyer with 403 FORBIDDEN before validating the body', async () => {
      const res = await addStaff(await buyerAccount(), {});
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('refuses a Developer under review with 403 DEVELOPER_NOT_ACTIVE before validating the body', async () => {
      const res = await addStaff(await developerUnderReview(), {});
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('DEVELOPER_NOT_ACTIVE');
    });
  });

  describe('validation parity', () => {
    let developer;
    beforeEach(async () => {
      developer = await activeDeveloper();
    });

    it.each(staffMemberCases.invalid)(
      'rejects $name with the shared message',
      async ({ input, field, message }) => {
        const res = await addStaff(developer, { ...valid, ...input });
        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.fields[field]).toContain(message);
      },
    );
  });
});
