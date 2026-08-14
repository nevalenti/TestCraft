import { expect, test } from '../fixtures';

test.describe('Account', () => {
  test.beforeEach(async ({ accountPage }) => {
    await accountPage.goto();
  });

  test('renders profile fields from the authenticated session', async ({
    page,
  }) => {
    await expect(
      page.getByText('Manage your profile and preferences'),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /manage account/i }),
    ).toBeVisible();
  });

  test('opens and cancels the sign-out dialog without signing out', async ({
    accountPage,
    page,
  }) => {
    await accountPage.openSignOutDialog();
    await expect(page.getByText('Sign out?')).toBeVisible();

    await accountPage.cancelSignOut();
    await expect(page.getByText('Sign out?')).not.toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
  });
});
