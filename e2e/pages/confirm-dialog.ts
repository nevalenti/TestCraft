import type { Page } from '@playwright/test';

export class ConfirmDialog {
  constructor(private page: Page) {}

  get locator() {
    return this.page.locator('dialog[open]');
  }

  async confirmDelete() {
    await this.locator
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
  }

  async cancel() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }
}
