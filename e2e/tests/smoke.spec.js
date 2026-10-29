import { test, expect } from '@playwright/test';
import { ERROR_CODES } from '@real-estate/shared';
import { withApi } from '../playwright.config.js';

test.describe('smoke', () => {
  test('home page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Real Estate' })).toBeVisible();
  });

  test('unknown route shows the not-found page', async ({ page }) => {
    await page.goto('/missing-page');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await page.getByRole('link', { name: 'Go to home' }).click();
    await expect(page).toHaveURL('/');
  });

  test('API health and error contract through the dev proxy', async ({ request }) => {
    test.skip(!withApi, 'Backend not started (E2E_WITH_API=false)');

    const health = await request.get('/api/health');
    expect(await health.json()).toEqual({ success: true, data: { status: 'ok' } });

    const missing = await request.get('/api/nope');
    expect(missing.status()).toBe(404);
    expect((await missing.json()).error.message).toBe(ERROR_CODES.NOT_FOUND.message);
  });
});
