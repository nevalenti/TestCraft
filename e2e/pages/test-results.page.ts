import { expect, type Page } from '@playwright/test';

import { ConfirmDialog } from '../components/confirm-dialog';

export class TestResultsPage {
  readonly confirmDialog: ConfirmDialog;

  constructor(private page: Page) {
    this.confirmDialog = new ConfirmDialog(page);
  }

  async goto(path: string) {
    await this.page.goto(path);
    await expect(
      this.page.getByRole('button', { name: 'Add Result' }),
    ).toBeVisible();
  }

  get addButton() {
    return this.page.getByRole('button', { name: 'Add Result' });
  }

  get dialog() {
    return this.page.locator('dialog[open]');
  }

  get rows() {
    return this.page.locator('[data-testid="result-row"]');
  }

  async addResult(testCaseName: string, status: string) {
    await this.addButton.click();
    await expect(this.dialog).toBeVisible();
    await this.dialog
      .getByLabel('Test Case')
      .selectOption({ label: testCaseName });
    await this.dialog.getByLabel('Status').selectOption(status);
    await this.dialog.getByRole('button', { name: 'Save' }).click();
    await expect(this.dialog).not.toBeVisible();
  }

  async deleteResult(index = 0) {
    await this.rows
      .nth(index)
      .getByRole('button', { name: 'Delete result' })
      .click();
    await this.confirmDialog.confirmDelete();
  }

  async editResult(index: number, newStatus: string) {
    await this.rows
      .nth(index)
      .getByRole('button', { name: 'Edit result' })
      .click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.locator('#update-result-status').selectOption(newStatus);
    await this.dialog.getByRole('button', { name: 'Save' }).click();
    await expect(this.dialog).not.toBeVisible();
  }

  async filterByStatus(status: string) {
    await this.page
      .getByRole('button', { name: new RegExp(status, 'i') })
      .first()
      .click();
  }

  async showAllResults() {
    await this.page.getByRole('button', { name: 'All results' }).click();
  }
}
