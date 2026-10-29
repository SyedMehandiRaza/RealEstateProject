/* global document -- the page.evaluate callback runs in the browser */
import { expect } from '@playwright/test';

// Visual baselines of the Figma-checked pages (figma-to-module defers the screenshot check to e2e).
// The project viewport is 1440 wide, the Figma frame width. Fonts come from Google Fonts and the hero is
// an image, so wait for both before comparing; Playwright already disables animations and hides the caret.
// `mask` takes locators for anything that changes between runs.
export async function expectPageScreenshot(page, name, { mask = [] } = {}) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) =>
        img.complete ? null : new Promise((resolve) => img.addEventListener('load', resolve, { once: true })),
      ),
    );
  });
  await expect(page).toHaveScreenshot(name, { fullPage: true, mask, maxDiffPixelRatio: 0.005 });
}
