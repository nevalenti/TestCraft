import path from 'node:path';

import { expect, test } from '../fixtures';
import { ProjectsPage } from '../pages/projects.page';

const AUTH_FILE = path.join(import.meta.dirname, '.auth/user.json');

test.describe('Analytics', () => {
  test.describe.configure({ mode: 'serial' });

  const projectName = `E2E Analytics ${Date.now()}`;
  let analyticsPath: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();

    const projects = new ProjectsPage(page);
    await projects.goto();
    await projects.create(projectName);
    await projects.open(projectName);
    await page.waitForURL(/\/projects\/[^/]+\/runs$/, { timeout: 15_000 });
    analyticsPath = new URL(page.url()).pathname.replace(
      '/runs',
      '/analytics/trend',
    );

    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!analyticsPath) return;
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();

    const projects = new ProjectsPage(page);
    await projects.goto();
    if ((await projects.getCard(projectName).count()) === 0) {
      await context.close();
      return;
    }
    await projects.delete(projectName);

    await context.close();
  });

  test.beforeEach(async ({ analyticsPage }) => {
    await analyticsPage.goto(analyticsPath);
  });

  test('renders trend tab by default with no-data message', async ({
    analyticsPage,
    page,
  }) => {
    await expect(analyticsPage.trendTab).toBeVisible();
    await expect(
      page.getByText('No run data yet. Complete a test run to see trend data.'),
    ).toBeVisible();
  });

  test('can switch to Flaky Tests tab', async ({ analyticsPage, page }) => {
    await analyticsPage.flakyTab.click();
    await expect(page).toHaveURL(/\/analytics\/flaky$/);
  });

  test('can switch to Suite Breakdown tab', async ({ analyticsPage, page }) => {
    await analyticsPage.suiteTab.click();
    await expect(page).toHaveURL(/\/analytics\/suite$/);
  });

  test('can switch to Run Comparison tab', async ({ analyticsPage, page }) => {
    await analyticsPage.comparisonTab.click();
    await expect(page).toHaveURL(/\/analytics\/comparison$/);
  });
});
