import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticate, authorize } from '../authenticate.js';
import { errorHandler } from '../errorHandler.js';
import { signAccessToken, signRefreshToken } from '../../utils/jwt.js';

const app = express();
app.get('/me', authenticate, (req, res) => res.json(req.user));
app.get('/admin', authenticate, authorize('admin'), (_req, res) => res.json({ ok: true }));
app.get('/developer', authenticate, authorize('developer'), (_req, res) => res.json({ ok: true }));
app.use(errorHandler);

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

describe('authenticate / authorize', () => {
  it('sets req.user from a valid access token', async () => {
    const res = await request(app)
      .get('/me')
      .set(bearer(signAccessToken({ userId: 5, roles: ['buyer'] })));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 5, roles: ['buyer'] });
  });

  it('rejects a missing token with UNAUTHORIZED', async () => {
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a token signed with another secret', async () => {
    const forged = jwt.sign({ roles: ['admin'] }, 'x'.repeat(40), { subject: '1' });
    const res = await request(app).get('/me').set(bearer(forged));
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a refresh token', async () => {
    const res = await request(app)
      .get('/me')
      .set(bearer(signRefreshToken({ userId: 1 }).token));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  // TASK-053: what a refresh token would be if both secrets were equal (env.js now refuses that too).
  it('rejects a token of type refresh even when it is signed with the access secret', async () => {
    const refreshLike = jwt.sign({ typ: 'refresh', roles: ['admin'] }, process.env.JWT_ACCESS_SECRET, {
      subject: '1',
      jwtid: 'x',
    });
    const res = await request(app).get('/me').set(bearer(refreshLike));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects an expired token with TOKEN_EXPIRED', async () => {
    const expired = jwt.sign({ roles: ['buyer'] }, process.env.JWT_ACCESS_SECRET, {
      subject: '1',
      expiresIn: -10,
    });
    const res = await request(app).get('/me').set(bearer(expired));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('returns FORBIDDEN when the role is not allowed', async () => {
    const res = await request(app)
      .get('/admin')
      .set(bearer(signAccessToken({ userId: 1, roles: ['buyer'] })));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows a user who holds several roles when one of them matches', async () => {
    const res = await request(app)
      .get('/developer')
      .set(bearer(signAccessToken({ userId: 2, roles: ['buyer', 'developer'] })));
    expect(res.status).toBe(200);
  });

  it('treats a token without a roles list as having no roles', async () => {
    const legacy = jwt.sign({ typ: 'access', role: 'admin' }, process.env.JWT_ACCESS_SECRET, {
      subject: '1',
    });
    const res = await request(app).get('/admin').set(bearer(legacy));
    expect(res.status).toBe(403);
  });
});
