import path from 'node:path';

import { expect, test } from '../fixtures';
import { ProjectsPage } from '../pages/projects.page';

const AUTH_FILE = path.join(import.meta.dirname, '.auth/user.json');

test.describe('Project Settings', () => {
  test.describe.configure({ mode: 'serial' });

  const projectName = `E2E Settings ${Date.now()}`;
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

  test.beforeEach(async ({ page, projectSettingsPage }) => {
    await page.goto(projectPath);
    await projectSettingsPage.open();
  });

  test('renders the API Tokens tab by default', async ({
    projectSettingsPage,
  }) => {
    await expect(
      projectSettingsPage.dialog.getByRole('heading', {
        name: 'Project Settings',
      }),
    ).toBeVisible();
    await expect(
      projectSettingsPage.dialog.getByLabel('Token name'),
    ).toBeVisible();
  });

  test('creates and revokes an API token', async ({ projectSettingsPage }) => {
    const name = `E2E Token ${Date.now()}`;
    await projectSettingsPage.createToken(name);
    await projectSettingsPage.revokeToken(name);
  });

  test('adds and deletes a webhook', async ({ projectSettingsPage }) => {
    await projectSettingsPage.goToTab('Notifications');
    const url = `https://example.com/hook-${Date.now()}`;
    await projectSettingsPage.addWebhook(url);
    await projectSettingsPage.deleteWebhook(url);
  });

  test('adds and deletes an email subscription', async ({
    projectSettingsPage,
  }) => {
    await projectSettingsPage.goToTab('Notifications');
    const email = `alerts+${Date.now()}@example.com`;
    await projectSettingsPage.addEmail(email);
    await projectSettingsPage.deleteEmail(email);
  });

  test('adds and removes a project member', async ({ projectSettingsPage }) => {
    await projectSettingsPage.goToTab('Members');
    const email = 'e2e-member@testcraft.pro';
    await projectSettingsPage.addMember(email);
    await projectSettingsPage.removeMember(email);
  });
});
