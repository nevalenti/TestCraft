import path from 'node:path';

import { expect, test } from '../fixtures';
import { ProjectsPage } from '../pages/projects.page';
import { TestCasesPage } from '../pages/test-cases.page';
import { TestSuitesPage } from '../pages/test-suites.page';

const AUTH_FILE = path.join(import.meta.dirname, '.auth/user.json');

test.describe('Test Case Steps', () => {
  test.describe.configure({ mode: 'serial' });

  const projectName = `E2E Steps ${Date.now()}`;
  let casePath: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90_000);
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();

    const projects = new ProjectsPage(page);
    await projects.goto();
    await projects.create(projectName);
    await projects.open(projectName);
    await page.waitForURL(/\/projects\/[^/]+\/runs$/, { timeout: 15_000 });

    await page.getByRole('tab', { name: /Test Suites/i }).click();
    await page.waitForURL(/\/projects\/[^/]+\/suites$/, { timeout: 15_000 });

    const suites = new TestSuitesPage(page);
    await suites.create('E2E Steps Suite');
    await suites.open('E2E Steps Suite');
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+$/, {
      timeout: 15_000,
    });

    const cases = new TestCasesPage(page);
    await cases.create('E2E Steps Case');
    await cases.open('E2E Steps Case');
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+\/cases\/[^/]+$/, {
      timeout: 15_000,
    });
    casePath = new URL(page.url()).pathname;

    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!casePath) return;
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

  test.beforeEach(async ({ testStepsPage }) => {
    await testStepsPage.goto(casePath);
  });

  test('renders empty state when no steps exist', async ({ page }) => {
    await expect(page.getByText('No steps defined')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Step' })).toBeVisible();
  });

  test('opens and closes the add step dialog', async ({
    testStepsPage,
    page,
  }) => {
    await testStepsPage.addButton.click();
    await expect(testStepsPage.dialog).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Step' })).toBeVisible();

    await testStepsPage.confirmDialog.cancel();
    await expect(testStepsPage.dialog).not.toBeVisible();
  });

  test('adds and deletes a step', async ({ testStepsPage }) => {
    await testStepsPage.addStep(
      'Navigate to the login page',
      'Login page is displayed',
    );

    const row = testStepsPage.rows.first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row.getByText('Navigate to the login page')).toBeVisible();
    await expect(row.getByText('Login page is displayed')).toBeVisible();

    await testStepsPage.deleteStep(0);
    await expect(testStepsPage.rows).toHaveCount(0);
  });

  test('edits a step', async ({ testStepsPage }) => {
    await testStepsPage.addStep('Click the submit button', 'Form is submitted');
    await expect(testStepsPage.rows.first()).toBeVisible({ timeout: 10_000 });

    await testStepsPage.editStep(0, 'Double-click the submit button');
    await expect(
      testStepsPage.rows.first().getByText('Double-click the submit button'),
    ).toBeVisible({ timeout: 10_000 });

    await testStepsPage.deleteStep(0);
  });

  test('adds multiple steps and shows them in order', async ({
    testStepsPage,
  }) => {
    const actions = ['First action', 'Second action', 'Third action'];

    for (const [index, action] of actions.entries()) {
      await testStepsPage.addStep(action, `Result ${index + 1}`);
      await expect(testStepsPage.rows).toHaveCount(index + 1, {
        timeout: 10_000,
      });
    }

    await expect(
      testStepsPage.rows.first().getByText('First action'),
    ).toBeVisible();
    await expect(
      testStepsPage.rows.nth(1).getByText('Second action'),
    ).toBeVisible();
    await expect(
      testStepsPage.rows.nth(2).getByText('Third action'),
    ).toBeVisible();

    for (let i = 0; i < 3; i++) {
      await testStepsPage.deleteStep(0);
    }
  });
});
