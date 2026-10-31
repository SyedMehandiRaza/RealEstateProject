import request from 'supertest';
import { commonMessages, staffMessages } from '@real-estate/shared';
import { createTestApp } from '../../../test/testApp.js';
import {
  activeDeveloper,
  assignProperties,
  buyerAccount,
  createProperty,
  createStaffMember,
  developerUnderReview,
} from '../../../test/staffFactories.js';

// STAFF-004: GET /api/staff/:id (STAFF-SPEC-001 E3).
const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const minutesAgo = (minutes) => new Date(Math.floor(Date.now() / 1000) * 1000 - minutes * 60_000);

describe('GET /api/staff/:id', () => {
  let app;
  beforeEach(() => {
    ({ app } = createTestApp());
  });

  const getStaff = (developer, id) => request(app).get(`/api/staff/${id}`).set(bearer(developer.accessToken));

  it('returns the member with permissions in the shared order and property cards, newest assignment first', async () => {
    const developer = await activeDeveloper();
    const member = await createStaffMember(developer.id, {
      fullName: 'Shivam Gawali',
      email: 'shivam@example.com',
      permissions: ['payment_tracking', 'properties_management', 'leads_crm'],
    });
    const skyline = await createProperty(
      developer.id,
      { name: 'Skyline Tower', city: 'Mumbai', state: 'Maharashtra', propertyStatus: 'ready_to_move' },
      { withImage: true },
    );
    const harbor = await createProperty(developer.id, {
      name: 'Harbor View',
      city: 'Pune',
      state: 'Maharashtra',
      propertyStatus: 'under_construction',
    });
    await assignProperties(member.id, [skyline.id], { createdAt: minutesAgo(10) });
    await assignProperties(member.id, [harbor.id], { createdAt: minutesAgo(2) });

    const res = await getStaff(developer, member.id);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        staffMember: {
          id: member.id,
          fullName: 'Shivam Gawali',
          email: 'shivam@example.com',
          phone: '+917485961245',
          role: 'agent',
          status: 'active',
          permissions: ['properties_management', 'leads_crm', 'payment_tracking'],
          assignedProperties: [
            {
              id: harbor.id,
              name: 'Harbor View',
              city: 'Pune',
              state: 'Maharashtra',
              propertyStatus: 'under_construction',
              assignedAt: minutesAgo(2).toISOString(),
            },
            {
              id: skyline.id,
              name: 'Skyline Tower',
              city: 'Mumbai',
              state: 'Maharashtra',
              propertyStatus: 'ready_to_move',
              assignedAt: minutesAgo(10).toISOString(),
            },
          ],
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
    });
    expect(res.text).not.toMatch(/employerId|userId|cloudinary|url/i);
  });

  it('answers 404 with the shared message for an unknown id', async () => {
    const developer = await activeDeveloper();
    const res = await getStaff(developer, 999999);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: staffMessages.api.notFound },
    });
  });

  it("answers 404 for another developer's staff member, revealing nothing", async () => {
    const developer = await activeDeveloper();
    const other = await activeDeveloper();
    const foreign = await createStaffMember(other.id);
    const res = await getStaff(developer, foreign.id);
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe(staffMessages.api.notFound);
  });

  it.each(['abc', '0', '-1', '1.5'])('rejects id "%s" with 422 and the shared message', async (id) => {
    const developer = await activeDeveloper();
    const res = await getStaff(developer, id);
    expect(res.status).toBe(422);
    expect(res.body.error.fields).toEqual({ id: [commonMessages.id.invalid] });
  });

  describe('access', () => {
    it('refuses a request without a token with 401', async () => {
      expect((await request(app).get('/api/staff/1')).status).toBe(401);
    });

    it('refuses a Buyer with 403 FORBIDDEN', async () => {
      const res = await getStaff(await buyerAccount(), 'abc');
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('refuses a Developer under review with 403 DEVELOPER_NOT_ACTIVE', async () => {
      const res = await getStaff(await developerUnderReview(), 'abc');
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('DEVELOPER_NOT_ACTIVE');
    });
  });
});
