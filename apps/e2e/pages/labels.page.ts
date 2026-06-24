import { expect, type Page } from "@playwright/test";

export class LabelsPage {
  constructor(private page: Page) {}

  async goto(labelsPath: string) {
    await this.page.goto(labelsPath);
    await expect(
      this.page.getByRole("button", { name: "New Label" }),
    ).toBeVisible();
  }

  get createButton() {
    return this.page.getByRole("button", { name: "New Label" });
  }

  get dialog() {
    return this.page.locator("dialog[open]");
  }

  getLabelRow(name: string) {
    return this.page.locator("tr").filter({ hasText: name });
  }

  async create(name: string) {
    await this.createButton.click();
    await expect(
      this.page.getByRole("heading", { name: "New Label" }),
    ).toBeVisible();
    await this.page.locator("#label-name").fill(name);
    await this.dialog.getByRole("button", { name: "Create" }).click();
    await expect(this.getLabelRow(name)).toBeVisible({ timeout: 10_000 });
  }

  async delete(name: string) {
    const row = this.getLabelRow(name);
    await row.hover();
    await row.getByRole("button", { name: "Delete label" }).click();
    await expect(this.getLabelRow(name)).toHaveCount(0);
  }

  async edit(name: string, newName: string) {
    const row = this.getLabelRow(name);
    await row.hover();
    await row.getByRole("button", { name: "Edit label" }).click();
    await expect(
      this.page.getByRole("heading", { name: "Edit Label" }),
    ).toBeVisible();
    await this.page.locator("#label-name").fill(newName);
    await this.dialog.getByRole("button", { name: "Save" }).click();
    await expect(this.dialog).not.toBeVisible();
    await expect(this.getLabelRow(newName)).toBeVisible({ timeout: 10_000 });
  }
}
