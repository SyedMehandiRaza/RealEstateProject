/* global document, window -- the page.evaluate callbacks run in the browser */
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

// The responsive check (playwright-e2e skill, DEC-039 "Responsive rule" in docs/modules/auth/figma.md):
// the page at a short laptop screen and a phone, each with a baseline and no horizontal scroll. The
// viewport goes back to the project's size afterwards, so the test can carry on as before.
export const RESPONSIVE_VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 375, height: 812 },
];

export async function expectResponsiveScreenshots(page, name, options = {}) {
  const original = page.viewportSize();
  for (const viewport of RESPONSIVE_VIEWPORTS) {
    await page.setViewportSize(viewport);
    const size = `${viewport.width}x${viewport.height}`;
    const widths = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(widths.scrollWidth, `${name} at ${size} scrolls sideways`).toBeLessThanOrEqual(widths.innerWidth);
    await expectPageScreenshot(page, `${name}-${size}.png`, options);
  }
  await page.setViewportSize(original);
}
