import { expect, test } from "../fixtures";

test.describe("Analytics", () => {
  test.beforeEach(async ({ analyticsPage, testProject }) => {
    await analyticsPage.goto(
      testProject.path.replace("/runs", "/analytics/trend"),
    );
  });

  test("renders trend tab by default with no-data message", async ({
    analyticsPage,
    page,
  }) => {
    await expect(analyticsPage.trendTab).toBeVisible();
    await expect(page.getByText("No run data yet")).toBeVisible();
    await expect(
      page.getByText("Complete a test run to see trend data."),
    ).toBeVisible();
  });

  test("can switch to Flaky Tests tab", async ({ analyticsPage, page }) => {
    await analyticsPage.flakyTab.click();
    await expect(page).toHaveURL(/\/analytics\/flaky$/);
  });

  test("can switch to Suite Breakdown tab", async ({ analyticsPage, page }) => {
    await analyticsPage.suiteTab.click();
    await expect(page).toHaveURL(/\/analytics\/suite$/);
  });

  test("can switch to Run Comparison tab", async ({ analyticsPage, page }) => {
    await analyticsPage.comparisonTab.click();
    await expect(page).toHaveURL(/\/analytics\/comparison$/);
  });
});
