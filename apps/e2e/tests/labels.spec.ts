import path from 'node:path';

import { expect, test } from '../fixtures';
import { ProjectsPage } from '../pages/projects.page';

const AUTH_FILE = path.join(import.meta.dirname, '.auth/user.json');

test.describe('Labels', () => {
  test.describe.configure({ mode: 'serial' });

  const projectName = `E2E Labels ${Date.now()}`;
  let labelsPath: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();

    const projects = new ProjectsPage(page);
    await projects.goto();
    await projects.create(projectName);
    await projects.open(projectName);
    await page.waitForURL(/\/projects\/[^/]+\/runs$/, { timeout: 15_000 });
    labelsPath = new URL(page.url()).pathname.replace('/runs', '/labels');

    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!labelsPath) return;
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

  test.beforeEach(async ({ labelsPage }) => {
    await labelsPage.goto(labelsPath);
  });

  test('renders labels page', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'New Label' })).toBeVisible();
  });

  test('creates and deletes a label', async ({ labelsPage }) => {
    const name = `E2E Label ${Date.now()}`;
    await labelsPage.create(name);
    await labelsPage.delete(name);
  });

  test('edits a label name', async ({ labelsPage }) => {
    const name = `E2E Label Edit ${Date.now()}`;
    await labelsPage.create(name);
    await labelsPage.edit(name, `${name} Updated`);
    await labelsPage.delete(`${name} Updated`);
  });
});
