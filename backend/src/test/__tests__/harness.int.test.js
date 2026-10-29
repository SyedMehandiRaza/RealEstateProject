import request from 'supertest';
import models, { sequelize } from '../../models/index.js';
import { createTestApp } from '../testApp.js';
import { resetDatabase } from '../testDatabase.js';

const user = (email) => ({
  fullName: 'Test User',
  email,
  phone: '+919876543210',
  passwordHash: 'not-a-real-hash',
});

// The two "starts empty" tests rely on running in order: the first leaves rows behind on purpose.
describe('integration harness', () => {
  it('is connected to the test database', () => {
    expect(sequelize.getDatabaseName()).toMatch(/_test$/);
  });

  it('lets a test write rows (left behind on purpose)', async () => {
    await models.User.create(user('left-behind@example.com'));
    expect(await models.User.count()).toBe(1);
  });

  it('starts the next test from empty tables', async () => {
    expect(await models.User.count()).toBe(0);
  });

  it('empties tables that reference each other, in any order', async () => {
    const owner = await models.User.create(user('owner@example.com'));
    await models.UserRole.create({ userId: owner.id, role: 'buyer' });
    await resetDatabase(sequelize);
    expect(await models.UserRole.count()).toBe(0);
    expect(await models.User.count()).toBe(0);
  });

  it('serves the app built with fakes over HTTP', async () => {
    const { app } = createTestApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});
