import { expect, type Page } from "@playwright/test";

import { ConfirmDialog } from "./confirm-dialog";

export class SuitesPage {
  readonly confirmDialog: ConfirmDialog;

  constructor(private page: Page) {
    this.confirmDialog = new ConfirmDialog(page);
  }

  async goto(path: string) {
    await this.page.goto(path);
    await expect(
      this.page.getByRole("link", { name: /Test Suites/i }),
    ).toBeVisible();
  }

  get createButton() {
    return this.page.getByRole("button", { name: "New Suite" });
  }

  get dialog() {
    return this.page.locator("dialog[open]");
  }

  getCard(name: string) {
    return this.page
      .locator('[data-testid="suite-card"]')
      .filter({ hasText: name });
  }

  async openCreateDialog() {
    await this.createButton.click();
  }

  async create(name: string) {
    await this.openCreateDialog();
    await this.page.getByLabel("Name").fill(name);
    await this.page.getByRole("button", { name: "Save" }).click();
    await expect(this.getCard(name)).toBeVisible({ timeout: 10_000 });
  }

  async open(name: string) {
    await this.getCard(name)
      .getByRole("link", { name: "Open test suite" })
      .click();
  }

  async delete(name: string) {
    const card = this.getCard(name);
    await card.hover();
    await card.getByRole("button", { name: "Delete test suite" }).click();
    await this.confirmDialog.confirmDelete();
    await expect(this.getCard(name)).toHaveCount(0);
  }

  async edit(name: string, newName: string) {
    const card = this.getCard(name);
    await card.hover();
    await card.getByRole("button", { name: "Edit test suite" }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.locator("#suite-name").fill(newName);
    await this.dialog.getByRole("button", { name: "Save" }).click();
    await expect(this.dialog).not.toBeVisible();
    await expect(this.getCard(newName)).toBeVisible({ timeout: 10_000 });
  }
}
