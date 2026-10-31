import request from 'supertest';
import { ERROR_CODES } from '@real-estate/shared';
import { staffListQueryCases } from '@real-estate/shared/testing';
import { createTestApp } from '../../../test/testApp.js';
import {
  activeDeveloper,
  buyerAccount,
  createStaffMember,
  developerUnderReview,
} from '../../../test/staffFactories.js';

// STAFF-002: GET /api/staff (STAFF-SPEC-001 E1).
const STAFF = '/api/staff';
const bearer = (token) => ({ Authorization: `Bearer ${token}` });
// One base time for the whole file, so a date built twice (seed and assertion) is the same value.
const NOW = Math.floor(Date.now() / 1000) * 1000;
const minutesAgo = (minutes) => new Date(NOW - minutes * 60_000);

describe('GET /api/staff', () => {
  let app;
  beforeEach(() => {
    ({ app } = createTestApp());
  });

  it("lists only the caller's staff, newest first, with the summary fields", async () => {
    const developer = await activeDeveloper();
    const other = await activeDeveloper();
    const older = await createStaffMember(developer.id, {
      fullName: 'Rajesh Mehta',
      email: 'rajesh@example.com',
      createdAt: minutesAgo(10),
    });
    const newer = await createStaffMember(developer.id, {
      fullName: 'Shivam Gawali',
      email: 'shivam@example.com',
      status: 'disabled',
      createdAt: minutesAgo(1),
    });
    await createStaffMember(other.id, { email: 'foreign@example.com' });

    const res = await request(app).get(STAFF).set(bearer(developer.accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: [
        {
          id: newer.id,
          fullName: 'Shivam Gawali',
          email: 'shivam@example.com',
          phone: '+917485961245',
          role: 'agent',
          status: 'disabled',
          createdAt: minutesAgo(1).toISOString(),
        },
        {
          id: older.id,
          fullName: 'Rajesh Mehta',
          email: 'rajesh@example.com',
          phone: '+917485961245',
          role: 'agent',
          status: 'active',
          createdAt: minutesAgo(10).toISOString(),
        },
      ],
      meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
    });
  });

  it('breaks ties on the same second by id, newest id first', async () => {
    const developer = await activeDeveloper();
    const at = minutesAgo(5);
    const first = await createStaffMember(developer.id, { createdAt: at });
    const second = await createStaffMember(developer.id, { createdAt: at });
    const res = await request(app).get(STAFF).set(bearer(developer.accessToken));
    expect(res.body.data.map((m) => m.id)).toEqual([second.id, first.id]);
  });

  it('pages 10 at a time by default and honours page and pageSize', async () => {
    const developer = await activeDeveloper();
    const ids = [];
    for (let i = 0; i < 12; i += 1) {
      ids.push((await createStaffMember(developer.id, { createdAt: minutesAgo(20 - i) })).id);
    }
    const newestFirst = ids.reverse();

    const first = await request(app).get(STAFF).set(bearer(developer.accessToken));
    expect(first.body.data.map((m) => m.id)).toEqual(newestFirst.slice(0, 10));
    expect(first.body.meta).toEqual({ page: 1, pageSize: 10, total: 12, totalPages: 2 });

    const second = await request(app).get(`${STAFF}?page=2`).set(bearer(developer.accessToken));
    expect(second.body.data.map((m) => m.id)).toEqual(newestFirst.slice(10));

    const small = await request(app).get(`${STAFF}?page=3&pageSize=5`).set(bearer(developer.accessToken));
    expect(small.body.data.map((m) => m.id)).toEqual(newestFirst.slice(10, 12));
    expect(small.body.meta).toEqual({ page: 3, pageSize: 5, total: 12, totalPages: 3 });
  });

  it('answers an empty list with total 0', async () => {
    const developer = await activeDeveloper();
    const res = await request(app).get(STAFF).set(bearer(developer.accessToken));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: [],
      meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
    });
  });

  describe('access', () => {
    it('refuses a request without a token with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get(STAFF);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('refuses a Buyer with 403 FORBIDDEN, before validating the query', async () => {
      const buyer = await buyerAccount();
      const res = await request(app).get(`${STAFF}?page=0`).set(bearer(buyer.accessToken));
      expect(res.status).toBe(403);
      expect(res.body.error).toEqual({ code: 'FORBIDDEN', message: ERROR_CODES.FORBIDDEN.message });
    });

    it('refuses a Developer under review with 403 DEVELOPER_NOT_ACTIVE', async () => {
      const developer = await developerUnderReview();
      const res = await request(app).get(`${STAFF}?page=0`).set(bearer(developer.accessToken));
      expect(res.status).toBe(403);
      expect(res.body.error).toEqual({
        code: 'DEVELOPER_NOT_ACTIVE',
        message: ERROR_CODES.DEVELOPER_NOT_ACTIVE.message,
      });
    });
  });

  describe('validation parity', () => {
    it.each(staffListQueryCases.invalid)(
      'rejects $name with the shared message',
      async ({ input, field, message }) => {
        const developer = await activeDeveloper();
        const res = await request(app).get(STAFF).query(input).set(bearer(developer.accessToken));
        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.fields[field]).toContain(message);
      },
    );
  });
});
