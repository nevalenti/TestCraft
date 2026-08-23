import { expect, type Page } from '@playwright/test';

import { ConfirmDialog } from '../components/confirm-dialog';

export class TestCasesPage {
  readonly confirmDialog: ConfirmDialog;

  constructor(private page: Page) {
    this.confirmDialog = new ConfirmDialog(page);
  }

  async goto(path: string) {
    await this.page.goto(path);
    await expect(
      this.page.getByRole('button', { name: 'New Test Case' }),
    ).toBeVisible();
  }

  get createButton() {
    return this.page.getByRole('button', { name: 'New Test Case' });
  }

  get searchInput() {
    return this.page.getByPlaceholder('Search test cases…');
  }

  get dialog() {
    return this.page.locator('dialog[open]');
  }

  getCard(name: string) {
    return this.page
      .locator('[data-testid="case-card"]')
      .filter({ hasText: name });
  }

  async create(name: string, priority?: string) {
    await this.createButton.click();
    await this.page.getByLabel('Name').fill(name);
    if (priority) {
      await this.page.getByLabel('Priority').selectOption(priority);
    }
    await this.page.getByRole('button', { name: 'Save' }).click();
    await expect(this.getCard(name)).toBeVisible({ timeout: 10_000 });
  }

  async open(name: string) {
    await this.getCard(name)
      .getByRole('link', { name: 'Open test case' })
      .click();
  }

  async delete(name: string) {
    const card = this.getCard(name);
    await card.hover();
    await card.getByRole('button', { name: 'Delete test case' }).click();
    await this.confirmDialog.confirmDelete();
    await expect(this.getCard(name)).toHaveCount(0);
  }

  async edit(name: string, newName: string) {
    const card = this.getCard(name);
    await card.hover();
    await card.getByRole('button', { name: 'Edit test case' }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.locator('#case-name').fill(newName);
    await this.dialog.getByRole('button', { name: 'Save' }).click();
    await expect(this.dialog).not.toBeVisible();
    await expect(this.getCard(newName)).toBeVisible({ timeout: 10_000 });
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }
}
