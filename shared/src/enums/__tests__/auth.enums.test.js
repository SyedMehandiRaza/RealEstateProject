import { SIGNUP_ROLES, USER_ROLES } from '../auth.enums.js';

describe('auth enums', () => {
  it('lets people sign up only as buyer or developer, never admin', () => {
    expect(SIGNUP_ROLES).toEqual(['buyer', 'developer']);
    expect(SIGNUP_ROLES.every((role) => USER_ROLES.includes(role))).toBe(true);
    expect(SIGNUP_ROLES).not.toContain('admin');
  });
});
