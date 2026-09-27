import { expect, test } from '../fixtures';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('My Projects button navigates to /projects', async ({ page }) => {
    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    await page.waitForURL('**/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  });

  test('shows the Active Runs tab', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Active Runs' }),
    ).toBeVisible();
  });
});
