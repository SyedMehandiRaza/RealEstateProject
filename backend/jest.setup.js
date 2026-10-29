// Runs in every test worker before the test file loads: test env vars and the "_test" database guard.
import { applyTestEnv } from './src/test/testEnv.js';

applyTestEnv();
