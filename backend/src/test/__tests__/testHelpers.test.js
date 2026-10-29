import { createFakeMailer } from '../fakeMailer.js';
import { createTestClock } from '../testClock.js';

describe('createTestClock', () => {
  it('starts at the given time and only moves when told to', () => {
    const clock = createTestClock(new Date('2026-10-29T10:00:00Z'));
    expect(clock.now()).toEqual(new Date('2026-10-29T10:00:00Z'));

    clock.advance(59_000);
    expect(clock.now()).toEqual(new Date('2026-10-29T10:00:59Z'));

    clock.set(new Date('2026-10-30T00:00:00Z'));
    expect(clock.now()).toEqual(new Date('2026-10-30T00:00:00Z'));
  });

  it('returns a new Date each time, so callers cannot move the clock by mutating it', () => {
    const clock = createTestClock(new Date('2026-10-29T10:00:00Z'));
    clock.now().setFullYear(2000);
    expect(clock.now()).toEqual(new Date('2026-10-29T10:00:00Z'));
  });
});

describe('createFakeMailer', () => {
  it('records every message so a test can read the code from the "email"', async () => {
    const mailer = createFakeMailer();
    await mailer.sendVerificationCode({ to: 'a@example.com', code: '012345', purpose: 'email_verification' });
    await mailer.sendVerificationCode({ to: 'a@example.com', code: '999999', purpose: 'password_reset' });

    expect(mailer.messages).toHaveLength(2);
    expect(mailer.lastCodeFor('a@example.com')).toBe('999999');
    expect(mailer.lastCodeFor('a@example.com', 'email_verification')).toBe('012345');
  });

  it('throws when no code was sent, instead of returning undefined', () => {
    expect(() => createFakeMailer().lastCodeFor('nobody@example.com')).toThrow(/No verification code/);
  });

  it('can simulate an SMTP failure', async () => {
    const mailer = createFakeMailer();
    mailer.failNextSends(1);
    await expect(
      mailer.sendVerificationCode({ to: 'a@example.com', code: '1', purpose: 'email_verification' }),
    ).rejects.toThrow('SMTP unavailable');
    await mailer.sendVerificationCode({ to: 'a@example.com', code: '2', purpose: 'email_verification' });
    expect(mailer.messages).toHaveLength(1);
  });
});
