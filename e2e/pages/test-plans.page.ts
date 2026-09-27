import { expect, type Page } from '@playwright/test';

import { ConfirmDialog } from '../components/confirm-dialog';

export class TestPlansPage {
  readonly confirmDialog: ConfirmDialog;

  constructor(private page: Page) {
    this.confirmDialog = new ConfirmDialog(page);
  }

  async goto(plansPath: string) {
    await this.page.goto(plansPath);
    await expect(
      this.page.getByRole('button', { name: 'New Test Plan' }).first(),
    ).toBeVisible();
  }

  get createButton() {
    return this.page.getByRole('button', { name: 'New Test Plan' }).first();
  }

  get dialog() {
    return this.page.locator('dialog[open]');
  }

  getPlanRow(name: string) {
    return this.page
      .locator('[data-testid="plan-row"]')
      .filter({ hasText: name });
  }

  async create(name: string) {
    await this.createButton.click();
    await expect(
      this.page.getByRole('heading', { name: 'New Test Plan' }),
    ).toBeVisible();
    await this.dialog.locator('#plan-name').fill(name);
    await this.dialog.getByRole('button', { name: 'Create' }).click();
    await expect(this.getPlanRow(name)).toBeVisible({ timeout: 10_000 });
  }

  async delete(name: string) {
    const row = this.getPlanRow(name);
    await row.hover();
    await row.getByRole('button', { name: 'Delete plan' }).click();
    await this.confirmDialog.confirmDelete();
    await expect(this.getPlanRow(name)).toHaveCount(0);
  }

  async edit(name: string, newName: string) {
    const row = this.getPlanRow(name);
    await row.hover();
    await row.getByRole('button', { name: 'Edit plan' }).click();
    await expect(
      this.page.getByRole('heading', { name: 'Edit Test Plan' }),
    ).toBeVisible();
    await this.dialog.locator('#plan-name').fill(newName);
    await this.dialog.getByRole('button', { name: 'Save' }).click();
    await expect(this.dialog).not.toBeVisible();
    await expect(this.getPlanRow(newName)).toBeVisible({ timeout: 10_000 });
  }

  async open(name: string) {
    await this.getPlanRow(name).getByRole('link', { name }).click();
  }
}
