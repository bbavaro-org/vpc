import { test, expect } from '@playwright/test';

// Assets are served by the app itself, and the design system actually applies.
test('loads self-hosted with no CSP violation and the design system applied', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const external: string[] = [];

  page.on('request', (req) => {
    const url = req.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    if (new URL(url).origin !== origin) external.push(url);
  });
  await page.addInitScript(() => {
    const w = window as unknown as { __cspViolations: string[] };
    w.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      w.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });

  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('section.panel-slot').first().waitFor();

  expect(external).toEqual([]);
  const violations = await page.evaluate(
    () => (window as unknown as { __cspViolations: string[] }).__cspViolations,
  );
  expect(violations).toEqual([]);

  const applied = await page.evaluate(() => {
    const panel = document.querySelector('section.panel-slot')!;
    const cs = getComputedStyle(panel);
    return {
      white: getComputedStyle(document.documentElement).getPropertyValue('--white').trim(),
      sheets: document.styleSheets.length,
      border: parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth),
      shadow: cs.boxShadow,
    };
  });
  expect(applied.white).not.toBe('');
  expect(applied.sheets).toBeGreaterThan(0);
  expect(applied.border > 0 || applied.shadow !== 'none').toBe(true);
});
