import { test, expect } from '@playwright/test';

// AC-1 / AC-2: selecting a role removes denied panels from the page.
test('selecting Marketing removes the headline metrics panel', async ({ page }) => {
  await page.goto('/');
  await page.locator('section[data-slot="headline-metrics"]').waitFor();
  await page.getByLabel('Active role').selectOption('marketing');
  await expect(page.locator('section[data-slot="headline-metrics"]')).toHaveCount(0);
  await expect(page.locator('section[data-slot="lead-sources"]')).toHaveCount(1);
});
