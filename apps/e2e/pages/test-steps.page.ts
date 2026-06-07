import { expect, type Page } from "@playwright/test";

import { ConfirmDialog } from "./confirm-dialog";

export class TestStepsPage {
  readonly confirmDialog: ConfirmDialog;

  constructor(private page: Page) {
    this.confirmDialog = new ConfirmDialog(page);
  }

  async goto(path: string) {
    await this.page.goto(path);
    await expect(
      this.page.getByRole("button", { name: "Add Step" }),
    ).toBeVisible();
  }

  get addButton() {
    return this.page.getByRole("button", { name: "Add Step" });
  }

  get dialog() {
    return this.page.locator("dialog[open]");
  }

  get rows() {
    return this.page.locator('[data-testid="step-row"]');
  }

  async addStep(action: string, expectedResult: string) {
    await this.addButton.click();
    await expect(this.dialog).toBeVisible();
    await this.page.getByLabel("Action").fill(action);
    await this.page.getByLabel("Expected Result").fill(expectedResult);
    await this.page.getByRole("button", { name: "Save" }).click();
    await expect(this.dialog).not.toBeVisible();
  }

  async deleteStep(index = 0) {
    await this.rows
      .nth(index)
      .getByRole("button", { name: "Delete step" })
      .click();
    await this.confirmDialog.confirmDelete();
  }

  async editStep(index: number, newAction: string) {
    await this.rows
      .nth(index)
      .getByRole("button", { name: "Edit step" })
      .click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.locator("#step-action").fill(newAction);
    await this.dialog.getByRole("button", { name: "Save" }).click();
    await expect(this.dialog).not.toBeVisible();
  }
}
