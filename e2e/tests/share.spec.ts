import path from 'node:path';

import { expect, test } from '../fixtures';
import { ProjectsPage } from '../pages/projects.page';
import { SharePage } from '../pages/share.page';
import { TestRunsPage } from '../pages/test-runs.page';

const AUTH_FILE = path.join(import.meta.dirname, '.auth/user.json');

test.describe('Share', () => {
  test.describe.configure({ mode: 'serial' });

  const projectName = `E2E Share ${Date.now()}`;
  const runName = `E2E Share Run ${Date.now()}`;
  let projectPath: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();

    const projects = new ProjectsPage(page);
    await projects.goto();
    await projects.create(projectName);
    await projects.open(projectName);
    await page.waitForURL(/\/projects\/[^/]+\/runs$/, { timeout: 15_000 });
    projectPath = new URL(page.url()).pathname;

    const testRuns = new TestRunsPage(page);
    await testRuns.goto(projectPath);
    await testRuns.create(runName, 'staging');

    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!projectPath) return;
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

  test('creates a share link and the public page renders the run without authentication', async ({
    page,
    browser,
  }) => {
    const testRuns = new TestRunsPage(page);
    await testRuns.goto(projectPath);
    await testRuns.open(runName);
    await page.waitForURL(/\/projects\/[^/]+\/runs\/[^/]+$/);

    await page.getByRole('button', { name: 'Share this run' }).click();
    const dialog = page.locator('dialog[open]');
    await dialog.getByRole('button', { name: 'Create Link' }).click();

    const shareUrlInput = dialog.locator('input[readonly]');
    await expect(shareUrlInput).toBeVisible({ timeout: 10_000 });

    const shareUrl = await shareUrlInput.inputValue();
    expect(shareUrl).toContain('/share/');

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    const publicShare = new SharePage(publicPage);
    await publicShare.goto(shareUrl);
    await publicShare.expectRunVisible(runName);

    await publicContext.close();
  });
});
