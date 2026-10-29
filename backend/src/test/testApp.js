import { createApp } from '../app.js';
import { createFakeMailer } from './fakeMailer.js';
import { createFakeStorage } from './fileFakes.js';
import { createTestClock } from './testClock.js';

// The app with every external dependency faked: no email is sent and Cloudinary is never called.
// Returns the fakes too, so a test can read sent codes, inspect stored files and move the clock.
// Pass any of { mailer, storage, clock } to replace a default fake.
export function createTestApp({
  mailer = createFakeMailer(),
  storage = createFakeStorage({ uniqueIds: true }),
  clock = createTestClock(),
} = {}) {
  return { app: createApp({ mailer, storage, clock }), mailer, storage, clock };
}
