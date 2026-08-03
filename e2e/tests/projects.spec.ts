import { expect, test } from '../fixtures';

test.describe('Projects page', () => {
  test.beforeEach(async ({ projectsPage }) => {
    await projectsPage.goto();
  });

  test('renders page chrome', async ({ projectsPage }) => {
    await expect(projectsPage.searchInput).toBeVisible();
    await expect(projectsPage.createButton).toBeVisible();
  });

  test('opens and closes the create dialog', async ({ projectsPage, page }) => {
    await projectsPage.openCreateDialog();
    await expect(projectsPage.dialog).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'New Project' }),
    ).toBeVisible();

    await projectsPage.confirmDialog.cancel();
    await expect(projectsPage.dialog).not.toBeVisible();
  });

  test('creates and then deletes a project', async ({ projectsPage }) => {
    const name = `E2E Project ${Date.now()}`;
    await projectsPage.create(name);
    await projectsPage.delete(name);
  });

  test('filters projects by search', async ({ projectsPage, page }) => {
    const name = `E2E SearchTarget ${Date.now()}`;

    await projectsPage.create(name);

    await projectsPage.search(name.slice(0, 12));
    await expect(page.getByText(name)).toBeVisible();

    await projectsPage.search('zzz-no-match-zzz');
    await expect(page.getByText(name)).not.toBeVisible();

    await projectsPage.clearSearch();
    await projectsPage.delete(name);
  });
});
