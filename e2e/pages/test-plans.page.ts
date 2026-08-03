import { expect, type Page } from '@playwright/test';

export class TestPlansPage {
  constructor(private page: Page) {}

  async goto(plansPath: string) {
    await this.page.goto(plansPath);
    await expect(
      this.page.getByRole('button', { name: 'New Plan' }).first(),
    ).toBeVisible();
  }

  get createButton() {
    return this.page.getByRole('button', { name: 'New Plan' }).first();
  }

  get dialog() {
    return this.page.locator('dialog[open]');
  }

  getPlanRow(name: string) {
    return this.page.locator('li').filter({ hasText: name });
  }

  async create(name: string) {
    await this.createButton.click();
    await expect(
      this.page.getByRole('heading', { name: 'New Test Plan' }),
    ).toBeVisible();
    await this.page.locator('#create-plan-name').fill(name);
    await this.dialog.getByRole('button', { name: 'Create' }).click();
    await expect(this.getPlanRow(name)).toBeVisible({ timeout: 10_000 });
  }

  async delete(name: string) {
    const row = this.getPlanRow(name);
    await row.getByRole('button', { name: 'Delete plan' }).click();
    await expect(this.getPlanRow(name)).toHaveCount(0);
  }

  async edit(name: string, newName: string) {
    const row = this.getPlanRow(name);
    await row.getByRole('button', { name: 'Edit plan' }).click();
    await expect(
      this.page.getByRole('heading', { name: 'Edit Test Plan' }),
    ).toBeVisible();
    await this.page.locator('#edit-plan-name').fill(newName);
    await this.dialog.getByRole('button', { name: 'Save' }).click();
    await expect(this.dialog).not.toBeVisible();
    await expect(this.getPlanRow(newName)).toBeVisible({ timeout: 10_000 });
  }

  async open(name: string) {
    await this.getPlanRow(name).getByRole('link', { name }).click();
  }
}
