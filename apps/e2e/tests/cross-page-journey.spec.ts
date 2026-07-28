import path from 'node:path';

import { expect, test } from '../fixtures';
import { ProjectsPage } from '../pages/projects.page';

const AUTH_FILE = path.join(import.meta.dirname, '.auth/user.json');

test.describe('Cross-page business journey', () => {
  test.describe.configure({ mode: 'serial' });

  const projectName = `E2E Journey ${Date.now()}`;
  const suiteName = 'E2E Suite';
  const caseName = 'E2E Journey Case';
  const runName = 'E2E Journey Run';

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();

    const projects = new ProjectsPage(page);
    await projects.goto();
    if ((await projects.getCard(projectName).count()) > 0) {
      await projects.delete(projectName);
    }

    await context.close();
  });

  test('create project, suite, case, run a result, and see it reflected in analytics', async ({
    page,
    projectsPage,
    suitesPage,
    testCasesPage,
    testRunsPage,
    testResultsPage,
    analyticsPage,
  }) => {
    test.setTimeout(120_000);

    await projectsPage.goto();
    await projectsPage.create(projectName);
    await projectsPage.open(projectName);
    await page.waitForURL(/\/projects\/[^/]+\/runs$/, { timeout: 15_000 });
    const projectPath = new URL(page.url()).pathname;

    await page.getByRole('tab', { name: /Test Suites/i }).click();
    await page.waitForURL(/\/projects\/[^/]+\/suites$/, { timeout: 15_000 });
    await suitesPage.create(suiteName);
    await suitesPage.open(suiteName);
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+$/, {
      timeout: 15_000,
    });

    await testCasesPage.create(caseName);

    await testRunsPage.goto(projectPath);
    await testRunsPage.create(runName, 'staging');
    await testRunsPage.open(runName);
    await page.waitForURL(/\/projects\/[^/]+\/runs\/[^/]+$/, {
      timeout: 15_000,
    });

    await testResultsPage.addResult(caseName, 'Passed');
    await expect(testResultsPage.rows.first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('100%')).toBeVisible();

    const analyticsPath = projectPath.replace('/runs', '/analytics/suite');
    await analyticsPage.goto(analyticsPath);
    await analyticsPage.suiteTab.click();
    await expect(page).toHaveURL(/\/analytics\/suite$/);

    const runOptionValue = await page
      .locator('#suite-run-select option')
      .filter({ hasText: runName })
      .getAttribute('value');
    await page.locator('#suite-run-select').selectOption(runOptionValue ?? '');
    await expect(page.getByText(suiteName)).toBeVisible({ timeout: 10_000 });
  });
});
