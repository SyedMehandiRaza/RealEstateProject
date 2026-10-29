import bcrypt from 'bcryptjs';
import { DUMMY_PASSWORD_HASH, hashPassword, SALT_ROUNDS, verifyPassword } from '../password.js';

// Each test runs real cost-12 bcrypt hashes, which exceed Jest's 5 s default on a loaded machine.
jest.setTimeout(30 * 1000);

describe('password hashing', () => {
  it('verifies a password against its own hash only', async () => {
    const hash = await hashPassword('secret123');
    await expect(verifyPassword('secret123', hash)).resolves.toBe(true);
    await expect(verifyPassword('secret124', hash)).resolves.toBe(false);
  });

  // Log in compares unknown emails with the dummy hash; the same cost makes both paths take as long.
  it('has a dummy hash with the same cost as real hashes', async () => {
    expect(bcrypt.getRounds(DUMMY_PASSWORD_HASH)).toBe(SALT_ROUNDS);
    expect(bcrypt.getRounds(await hashPassword('secret123'))).toBe(SALT_ROUNDS);
    await expect(verifyPassword('secret123', DUMMY_PASSWORD_HASH)).resolves.toBe(false);
  });
});
