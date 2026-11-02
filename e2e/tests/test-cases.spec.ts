import { randomUUID } from "node:crypto";

import { expect, test } from "../fixtures";

test.describe("Test Cases", () => {
  test.beforeEach(async ({ testCasesPage, testSuite }) => {
    await testCasesPage.goto(testSuite.path);
  });

  test("renders test cases page with search", async ({ testCasesPage }) => {
    await expect(testCasesPage.searchInput).toBeVisible();
    await expect(testCasesPage.createButton).toBeVisible();
  });

  test("creates and deletes a test case", async ({ testCasesPage }) => {
    const name = `E2E Case ${randomUUID()}`;
    await testCasesPage.create(name);
    await testCasesPage.delete(name);
  });

  test("creates a test case with High priority", async ({ testCasesPage }) => {
    const name = `E2E Case Priority ${randomUUID()}`;
    await testCasesPage.create(name, "High");
    await expect(testCasesPage.getCard(name).getByText("High")).toBeVisible();
    await testCasesPage.delete(name);
  });

  test("edits a test case name", async ({ testCasesPage }) => {
    const name = `E2E Case Edit ${randomUUID()}`;
    await testCasesPage.create(name);
    await testCasesPage.edit(name, `${name} Updated`);
    await testCasesPage.delete(`${name} Updated`);
  });

  test("filters test cases by search", async ({ testCasesPage }) => {
    const name = `E2E Case Search ${randomUUID()}`;

    await testCasesPage.create(name);

    const control = `E2E Control ${randomUUID()}`;
    await testCasesPage.create(control);
    await testCasesPage.search(name);
    await expect(testCasesPage.getCard(name)).toBeVisible();
    await expect(testCasesPage.getCard(control)).toHaveCount(0);

    await testCasesPage.search("zzz-no-match-zzz");
    await expect(testCasesPage.getCard(name)).not.toBeVisible();

    await testCasesPage.clearSearch();
    await expect(testCasesPage.getCard(name)).toBeVisible();
    await expect(testCasesPage.getCard(control)).toBeVisible();
    await testCasesPage.delete(name);
    await testCasesPage.delete(control);
  });

  test("navigates to a test case on card click", async ({
    testCasesPage,
    page,
  }) => {
    const name = `E2E Case Nav ${randomUUID()}`;
    await testCasesPage.create(name);
    await testCasesPage.open(name);
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+\/cases\/[^/]+$/);

    await expect(
      page
        .getByRole("navigation", { name: "Breadcrumb" })
        .getByText(name, { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
  });
});
