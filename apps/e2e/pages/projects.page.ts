import { expect, type Page } from '@playwright/test';

import { ConfirmDialog } from './confirm-dialog';

export class ProjectsPage {
  readonly confirmDialog: ConfirmDialog;

  constructor(private page: Page) {
    this.confirmDialog = new ConfirmDialog(page);
  }

  async goto() {
    await this.page.goto('/projects');
    await expect(
      this.page.getByRole('heading', { name: 'Projects' }),
    ).toBeVisible();
  }

  get createButton() {
    return this.page.getByRole('button', { name: /new project/i });
  }

  get searchInput() {
    return this.page.getByPlaceholder('Search projects…');
  }

  get dialog() {
    return this.page.locator('dialog[open]');
  }

  getCard(name: string) {
    return this.page
      .locator('[data-testid="project-card"]')
      .filter({ hasText: name });
  }

  async openCreateDialog() {
    await this.createButton.click();
  }

  async create(name: string) {
    await this.openCreateDialog();
    await this.page.getByLabel('Name').fill(name);
    await this.page.getByRole('button', { name: 'Save' }).click();
    await expect(this.getCard(name)).toBeVisible({ timeout: 10_000 });
  }

  async open(name: string) {
    await this.getCard(name)
      .getByRole('link', { name: 'Open project' })
      .click();
  }

  async delete(name: string) {
    const card = this.getCard(name);
    await card.hover();
    await card.getByRole('button', { name: 'Delete project' }).click();
    await this.confirmDialog.confirmDelete();
    await expect(this.getCard(name)).toHaveCount(0);
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }
}
