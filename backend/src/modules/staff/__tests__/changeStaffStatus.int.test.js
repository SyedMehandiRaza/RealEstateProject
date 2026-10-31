import request from 'supertest';
import { staffMessages } from '@real-estate/shared';
import { staffStatusCases } from '@real-estate/shared/testing';
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

// STAFF-006: PATCH /api/staff/:id/status (STAFF-SPEC-001 E5).
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

describe('PATCH /api/staff/:id/status', () => {
  let app;
  beforeEach(() => {
    ({ app } = createTestApp());
  });

  const changeStatus = (developer, id, body) =>
    request(app).patch(`/api/staff/${id}/status`).set(bearer(developer.accessToken)).send(body);

  it('disables and re-activates a member, keeping permissions and assignments', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id, { permissions: ['marketing'] });
    const property = await createProperty(developer.id);
    await assignProperties(member.id, [property.id]);

    const disabled = await changeStatus(developer, member.id, { status: 'disabled' });
    expect(disabled.status).toBe(200);
    expect(disabled.body.data.staffMember).toMatchObject({
      id: member.id,
      status: 'disabled',
      permissions: ['marketing'],
      assignedProperties: [expect.objectContaining({ id: property.id })],
    });
    expect((await models.StaffMember.findByPk(member.id)).status).toBe('disabled');

    const active = await changeStatus(developer, member.id, { status: 'active' });
    expect(active.body.data.staffMember.status).toBe('active');
  });

  it('answers 200 with no change when the status is already the one sent', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id);
    const res = await changeStatus(developer, member.id, { status: 'active' });
    expect(res.status).toBe(200);
    expect(res.body.data.staffMember.status).toBe('active');
  });

  it("answers 404 for an unknown or another developer's member, leaving it unchanged", async () => {
    const developer = await activeDeveloper();
    const foreign = await createStaffMember((await activeDeveloper()).id);
    for (const id of [foreign.id, 999999]) {
      const res = await changeStatus(developer, id, { status: 'disabled' });
      expect(res.status).toBe(404);
      expect(res.body.error).toEqual({ code: 'NOT_FOUND', message: staffMessages.api.notFound });
    }
    expect((await models.StaffMember.findByPk(foreign.id)).status).toBe('active');
  });

  describe('access', () => {
    it('refuses a request without a token with 401', async () => {
      expect((await request(app).patch('/api/staff/1/status').send({ status: 'active' })).status).toBe(401);
    });

    it('refuses a Buyer with 403 FORBIDDEN before validating', async () => {
      const res = await changeStatus(await buyerAccount(), 1, {});
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('refuses a Developer under review with 403 DEVELOPER_NOT_ACTIVE before validating', async () => {
      const res = await changeStatus(await developerUnderReview(), 1, {});
      expect(res.body.error.code).toBe('DEVELOPER_NOT_ACTIVE');
    });
  });

  describe('validation parity', () => {
    it.each(staffStatusCases.invalid)(
      'rejects $name with the shared message',
      async ({ input, field, message }) => {
        const developer = await activeDeveloper();
        const member = await createStaffMember(developer.id);
        const res = await changeStatus(developer, member.id, { ...staffStatusCases.valid, ...input });
        expect(res.status).toBe(422);
        expect(res.body.error.fields[field]).toContain(message);
      },
    );
  });
});
