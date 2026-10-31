import request from 'supertest';
import models, { sequelize } from '../../models/index.js';
import { createE2eApp } from '../e2eApp.js';
import { E2E_BASE_PATH } from '../e2eMode.js';
import { seedAccount } from '../e2eSeeds.js';

// STAFF-016: POST /api/__e2e/seed/staff seeds an employer's properties and staff for the Playwright suite.
describe('e2e staff seed', () => {
  let app;
  beforeEach(() => {
    ({ app } = createE2eApp({ models, sequelize }));
  });

  it('seeds properties and staff for the employer, newest staff last, with assignments', async () => {
    const employer = await seedAccount(models, sequelize, { role: 'developer', documents: 'approved' });

    const res = await request(app)
      .post(`${E2E_BASE_PATH}/seed/staff`)
      .send({
        employerEmail: employer.email,
        properties: [
          { name: 'Skyline Tower' },
          { name: 'Harbor View', propertyStatus: 'under_construction' },
        ],
        staff: [
          { fullName: 'Older Member', email: 'older@example.com', permissions: ['marketing'] },
          {
            fullName: 'Newer Member',
            email: 'newer@example.com',
            status: 'disabled',
            assignedProperties: ['Skyline Tower'],
          },
        ],
      });

    expect(res.status).toBe(201);
    const { properties, staff } = res.body.data;
    expect(properties.map((p) => p.name)).toEqual(['Skyline Tower', 'Harbor View']);
    expect(staff.map((s) => s.fullName)).toEqual(['Older Member', 'Newer Member']);
    const newer = await models.StaffMember.findByPk(staff[1].id);
    const older = await models.StaffMember.findByPk(staff[0].id);
    expect(newer.createdAt.getTime()).toBeGreaterThan(older.createdAt.getTime());
    expect(newer).toMatchObject({ employerId: employer.id, status: 'disabled' });
    expect(await models.StaffPropertyAssignment.count({ where: { staffMemberId: staff[1].id } })).toBe(1);
    expect(await models.Property.count({ where: { ownerId: employer.id } })).toBe(2);
  });

  it('answers 404 for an unknown employer and 400 for an assignment to an unseeded property', async () => {
    const unknown = await request(app)
      .post(`${E2E_BASE_PATH}/seed/staff`)
      .send({ employerEmail: 'nobody@example.com' });
    expect(unknown.status).toBe(404);

    const employer = await seedAccount(models, sequelize, { role: 'developer', documents: 'approved' });
    const bad = await request(app)
      .post(`${E2E_BASE_PATH}/seed/staff`)
      .send({
        employerEmail: employer.email,
        staff: [{ fullName: 'A Member', assignedProperties: ['Nowhere'] }],
      });
    expect(bad.status).toBe(400);
  });
});
