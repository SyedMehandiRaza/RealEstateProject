import { existsSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A parallel-module folder (git worktree) sets its own WEB_PORT and API_PROXY_TARGET in the root
// .env.worktree (docs/execution/README.md). It never overrides a variable that is already set.
const worktreeEnv = fileURLToPath(new URL('../.env.worktree', import.meta.url));
if (existsSync(worktreeEnv)) process.loadEnvFile(worktreeEnv);

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.WEB_PORT ?? 5173),
    // Same-origin API calls in development, so the httpOnly refresh cookie works without CORS issues.
    // API_PROXY_TARGET (Node side, never sent to the browser) lets the e2e suite point it at its own API.
    proxy: {
      '/api': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:5000', changeOrigin: true },
    },
  },
});
