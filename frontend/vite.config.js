import process from 'node:process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin API calls in development, so the httpOnly refresh cookie works without CORS issues.
    // API_PROXY_TARGET (Node side, never sent to the browser) lets the e2e suite point it at its own API.
    proxy: {
      '/api': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:5000', changeOrigin: true },
    },
  },
});
