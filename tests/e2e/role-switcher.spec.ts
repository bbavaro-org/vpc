import { test, expect } from '@playwright/test';

// AC-1 / AC-2: selecting a role removes denied panels from the page.
test('selecting Marketing removes the headline metrics panel', async ({ page }) => {
  await page.goto('/');
  await page.locator('section[data-slot="headline-metrics"]').waitFor();
  await page.getByLabel('Active role').selectOption('marketing');
  await expect(page.locator('section[data-slot="headline-metrics"]')).toHaveCount(0);
  await expect(page.locator('section[data-slot="lead-sources"]')).toHaveCount(1);
});

// Audit view navigation: open, back, and close-on-role-switch handlers.
test.describe('audit view navigation', () => {
  test('opens the audit view and returns to the panels via the back control', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Active role').selectOption('management');
    await page.locator('section[data-slot="headline-metrics"]').waitFor();
    await page.getByRole('button', { name: 'View audit log' }).click();
    await expect(page.getByTestId('audit-view')).toBeVisible();
    await expect(page.locator('section[data-slot]')).toHaveCount(0);
    const rows = await page.getByTestId('audit-view').locator('tbody tr').count();
    await page.getByRole('button', { name: 'Back to dashboard' }).click();
    await expect(page.getByTestId('audit-view')).toHaveCount(0);
    await expect(page.locator('section[data-slot="headline-metrics"]')).toHaveCount(1);
    await page.getByRole('button', { name: 'View audit log' }).click();
    // Going back records nothing; reopening records exactly one more entry.
    await expect(page.getByTestId('audit-view').locator('tbody tr')).toHaveCount(rows + 1);
  });

  test('switching role closes the audit view', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Active role').selectOption('management');
    await page.getByRole('button', { name: 'View audit log' }).click();
    await expect(page.getByTestId('audit-view')).toBeVisible();
    await page.getByLabel('Active role').selectOption('marketing');
    await expect(page.getByTestId('audit-view')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'View audit log' })).toHaveCount(0);
    await expect(page.locator('section[data-slot="lead-sources"]')).toHaveCount(1);
  });
});
