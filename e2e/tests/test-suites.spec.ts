import { randomUUID } from "node:crypto";

import { expect, test } from "../fixtures";

test.describe("Test Suites tab", () => {
  test.beforeEach(async ({ suitesPage, testProject }) => {
    await suitesPage.goto(testProject.path.replace("/runs", "/suites"));
  });

  test("renders suites tab by default", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "New Test Suite" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Project sections" })
        .getByRole("link", { name: /Test Suites/i }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Project sections" })
        .getByRole("link", { name: /Test Runs/i }),
    ).toBeVisible();
  });

  test("opens and closes the create suite dialog", async ({
    suitesPage,
    page,
  }) => {
    await suitesPage.openCreateDialog();
    await expect(suitesPage.dialog).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "New Test Suite" }),
    ).toBeVisible();

    await suitesPage.confirmDialog.cancel();
    await expect(suitesPage.dialog).not.toBeVisible();
  });

  test("creates and deletes a suite", async ({ suitesPage }) => {
    const name = `E2E Suite ${randomUUID()}`;
    await suitesPage.create(name);
    await suitesPage.delete(name);
  });

  test("edits a suite name", async ({ suitesPage }) => {
    const name = `E2E Suite Edit ${randomUUID()}`;
    await suitesPage.create(name);
    await suitesPage.edit(name, `${name} Updated`);
    await suitesPage.delete(`${name} Updated`);
  });

  test("refuses to overwrite a suite renamed elsewhere while editing", async ({
    page,
    suitesPage,
    testData,
    testProject,
    testSuite,
  }) => {
    await page.reload();
    const card = suitesPage.getCard(testSuite.name);
    await card.hover();
    await card.getByRole("button", { name: "Edit test suite" }).click();
    await expect(suitesPage.dialog).toBeVisible();

    const renamedElsewhere = `${testSuite.name} elsewhere`;
    await testData.renameSuite(testProject.id, testSuite.id, renamedElsewhere);
    await suitesPage.dialog
      .locator("#suite-name")
      .fill(`${testSuite.name} mine`);
    await suitesPage.dialog.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText(/changed by someone else/)).toBeVisible();
    await expect(suitesPage.getCard(renamedElsewhere)).toBeVisible();
  });

  test("navigates to a suite on card click", async ({ suitesPage, page }) => {
    const name = `E2E Suite Nav ${randomUUID()}`;
    await suitesPage.create(name);
    await suitesPage.open(name);
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+$/);

    await expect(
      page
        .getByRole("navigation", { name: "Breadcrumb" })
        .getByText(name, { exact: true }),
    ).toBeVisible();
  });
});
