import { expect, test } from "../fixtures";

test.describe("Test Results", () => {
  test.beforeEach(async ({ testResultsPage, testRun }) => {
    await testResultsPage.goto(testRun.path);
  });

  test("renders empty state with no results", async ({ page }) => {
    await expect(page.getByText("No results recorded")).toBeVisible();
  });

  test("records a result and shows pass rate summary", async ({
    testResultsPage,
    testCase,
    page,
  }) => {
    await testResultsPage.addResult(testCase.name, "Passed");

    const row = testResultsPage.rows.first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row.getByText(testCase.name)).toBeVisible();
    await expect(row.getByText("Passed")).toBeVisible();
    await expect(page.getByText("pass rate")).toBeVisible();
    await expect(page.getByText("100%")).toBeVisible();

    await testResultsPage.deleteResult(0);
    await expect(testResultsPage.rows).toHaveCount(0);
  });

  test("filters results by status", async ({
    testResultsPage,
    testData,
    testProject,
    testSuite,
    page,
  }) => {
    const cases = await Promise.all(
      [0, 1].map(() => testData.createCase(testProject.id, testSuite.id)),
    );
    await page.reload();
    for (const [i, status] of (["Passed", "Failed"] as const).entries()) {
      await testResultsPage.addResult(cases[i].name, status);
      await expect(testResultsPage.rows.last()).toBeVisible({
        timeout: 10_000,
      });
    }
    await expect(testResultsPage.rows).toHaveCount(2, { timeout: 10_000 });

    await testResultsPage.filterByStatus("passed");
    await expect(testResultsPage.rows).toHaveCount(1);
    await expect(testResultsPage.rows.getByText("Passed")).toBeVisible();

    await testResultsPage.showAllResults();
    await expect(testResultsPage.rows).toHaveCount(2);

    for (let i = 0; i < 2; i++) {
      await testResultsPage.deleteResult(0);
    }
  });

  test("pass rate reflects the actual mix of recorded result statuses", async ({
    testResultsPage,
    testData,
    testProject,
    testSuite,
    page,
  }) => {
    const cases = await Promise.all(
      [0, 1, 2].map(() => testData.createCase(testProject.id, testSuite.id)),
    );
    await page.reload();
    for (const [i, status] of (
      ["Passed", "Failed", "Blocked"] as const
    ).entries()) {
      await testResultsPage.addResult(cases[i].name, status);
      await expect(testResultsPage.rows.last()).toBeVisible({
        timeout: 10_000,
      });
    }
    await expect(testResultsPage.rows).toHaveCount(3, { timeout: 10_000 });

    await expect(page.getByText("3 results")).toBeVisible();
    await expect(page.getByText("33.3%")).toBeVisible();

    for (let i = 0; i < 3; i++) {
      await testResultsPage.deleteResult(0);
    }
    await expect(testResultsPage.rows).toHaveCount(0);
  });

  test("edits a result status", async ({ testResultsPage, testCase }) => {
    await testResultsPage.addResult(testCase.name, "Passed");

    await expect(testResultsPage.rows.first().getByText("Passed")).toBeVisible({
      timeout: 10_000,
    });

    await testResultsPage.editResult(0, "Failed");

    await expect(testResultsPage.rows.first().getByText("Failed")).toBeVisible({
      timeout: 10_000,
    });

    await testResultsPage.deleteResult(0);
  });
});
