import { expect, type Page } from "@playwright/test";

import { ConfirmDialog } from "./confirm-dialog";

export class TestRunsPage {
  readonly confirmDialog: ConfirmDialog;

  constructor(private page: Page) {
    this.confirmDialog = new ConfirmDialog(page);
  }

  async goto(projectPath: string) {
    await this.page.goto(projectPath);
    await this.page.getByRole("tab", { name: /Test Runs/i }).click();
    await expect(
      this.page.getByRole("button", { name: "New Run" }),
    ).toBeVisible();
  }

  get createButton() {
    return this.page.getByRole("button", { name: "New Run" });
  }

  get dialog() {
    return this.page.locator("dialog[open]");
  }

  getCard(name: string) {
    return this.page
      .locator('[data-testid="run-card"]')
      .filter({ hasText: name });
  }

  async create(name: string, environment: string) {
    await this.createButton.click();
    await this.page.getByLabel("Name").fill(name);
    await this.page.getByLabel("Environment").fill(environment);
    await this.page.getByRole("button", { name: "Save" }).click();
    await expect(this.getCard(name)).toBeVisible({ timeout: 10_000 });
  }

  async open(name: string) {
    await this.getCard(name)
      .getByRole("link", { name: "Open test run" })
      .click();
  }

  async delete(name: string) {
    const card = this.getCard(name);
    await card.hover();
    await card.getByRole("button", { name: "Delete test run" }).click();
    await this.confirmDialog.confirmDelete();
    await expect(this.getCard(name)).toHaveCount(0);
  }

  async edit(name: string, newName: string) {
    const card = this.getCard(name);
    await card.hover();
    await card.getByRole("button", { name: "Edit test run" }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.locator("#run-name").fill(newName);
    await this.dialog.getByRole("button", { name: "Save" }).click();
    await expect(this.dialog).not.toBeVisible();
    await expect(this.getCard(newName)).toBeVisible({ timeout: 10_000 });
  }
}
