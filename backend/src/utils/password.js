import bcrypt from 'bcryptjs';

export const SALT_ROUNDS = 12;

export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

// A hash of a random password nobody knows, with the same cost as real ones. Log in compares against it
// when the email has no Account, so an unknown email takes as long as a wrong password. Not a secret.
export const DUMMY_PASSWORD_HASH = '$2b$12$L7buxq1SjBaQ..yJ5TLYsetiAne9vqpXkQQR0tXAqz/DFfGi5dmt2';
