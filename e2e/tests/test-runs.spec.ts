import { randomUUID } from "node:crypto";

import { expect, test } from "../fixtures";

test.describe("Test Runs tab", () => {
  test.beforeEach(async ({ testRunsPage, testProject }) => {
    await testRunsPage.goto(testProject.path);
  });

  test("renders runs tab", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "New Test Run" }),
    ).toBeVisible();
  });

  test("opens and closes the create run dialog", async ({
    testRunsPage,
    page,
  }) => {
    await testRunsPage.createButton.click();
    await expect(testRunsPage.dialog).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "New Test Run" }),
    ).toBeVisible();

    await testRunsPage.confirmDialog.cancel();
    await expect(testRunsPage.dialog).not.toBeVisible();
  });

  test("creates and deletes a run", async ({ testRunsPage }) => {
    const name = `E2E Run ${randomUUID()}`;
    await testRunsPage.create(name, "staging");
    await expect(testRunsPage.getCard(name).getByText("staging")).toBeVisible();
    await testRunsPage.delete(name);
  });

  test("edits a run", async ({ testRunsPage }) => {
    const name = `E2E Run Edit ${randomUUID()}`;
    await testRunsPage.create(name, "staging");
    await testRunsPage.edit(name, `${name} Updated`);
    await testRunsPage.delete(`${name} Updated`);
  });

  test("navigates into a run on card click", async ({ testRunsPage, page }) => {
    const name = `E2E Run Nav ${randomUUID()}`;
    await testRunsPage.create(name, "production");
    await testRunsPage.open(name);
    await page.waitForURL(/\/projects\/[^/]+\/runs\/[^/]+$/);

    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Result" }),
    ).toBeVisible();

    await page.goBack();
    await testRunsPage.delete(name);
  });

  test("shows validation error when creating with empty name", async ({
    testRunsPage,
    testData,
    testProject,
    page,
  }) => {
    await testRunsPage.createButton.click();
    await expect(testRunsPage.dialog).toBeVisible();

    await page.getByLabel("Environment").fill("staging");
    await testRunsPage.dialog.getByRole("button", { name: "Create" }).click();

    await expect(
      testRunsPage.dialog.getByText("Name is required", { exact: true }),
    ).toBeVisible();
    await expect(
      testRunsPage.dialog.getByLabel("Name", { exact: true }),
    ).toHaveAttribute("aria-invalid", "true");
    const runs = await testData.runs(testProject.id);
    expect(runs.total).toBe(0);
    await testRunsPage.confirmDialog.cancel();
    await expect(
      page.getByText("No test runs yet", { exact: true }),
    ).toBeVisible();
  });
});
