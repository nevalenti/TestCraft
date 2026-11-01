import { randomUUID } from "node:crypto";

import { expect, test } from "../fixtures";

test.describe("Labels", () => {
  test.beforeEach(async ({ labelsPage, testProject }) => {
    await labelsPage.goto(testProject.path.replace("/runs", "/labels"));
  });

  test("renders labels page", async ({ page }) => {
    await expect(page.getByRole("button", { name: "New Label" })).toBeVisible();
  });

  test("creates and deletes a label", async ({ labelsPage }) => {
    const name = `E2E Label ${randomUUID()}`;
    await labelsPage.create(name);
    await labelsPage.delete(name);
  });

  test("edits a label name", async ({ labelsPage }) => {
    const name = `Label ${randomUUID()}`;
    await labelsPage.create(name);
    await labelsPage.edit(name, `${name} Updated`);
    await labelsPage.delete(`${name} Updated`);
  });
});
