import crypto from 'node:crypto';

// Compares two secrets (Buffers) in constant time. Different lengths are simply unequal: timingSafeEqual
// throws on them, and the length of a hash or fingerprint is not a secret.
export function constantTimeEqual(actual, expected) {
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
