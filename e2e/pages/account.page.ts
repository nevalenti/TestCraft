import { expect, type Page } from '@playwright/test';

export class AccountPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/account');
    await expect(
      this.page.getByRole('heading', { name: 'Account' }),
    ).toBeVisible();
  }

  get signOutTrigger() {
    return this.page.getByRole('button', { name: 'Sign out' }).first();
  }

  get signOutDialog() {
    return this.page.locator('dialog[open]');
  }

  async openSignOutDialog() {
    await this.signOutTrigger.click();
    await expect(this.signOutDialog).toBeVisible();
  }

  async cancelSignOut() {
    await this.signOutDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(this.signOutDialog).not.toBeVisible();
  }
}
