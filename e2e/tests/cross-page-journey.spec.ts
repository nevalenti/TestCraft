import { randomUUID } from "node:crypto";

import { expect, test } from "../fixtures";

test.describe("Cross-page business journey", () => {
  const projectName = `E2E Journey ${randomUUID()}`;
  const suiteName = "E2E Suite";
  const caseName = "E2E Journey Case";
  const runName = "E2E Journey Run";

  test("create project, suite, case, run a result, and see it reflected in analytics", async ({
    page,
    projectsPage,
    suitesPage,
    testCasesPage,
    testRunsPage,
    testResultsPage,
    analyticsPage,
  }) => {
    test.setTimeout(120_000);

    await projectsPage.goto();
    await projectsPage.create(projectName);
    await projectsPage.open(projectName);
    await page.waitForURL(/\/projects\/[^/]+\/runs$/, { timeout: 15_000 });
    const projectPath = new URL(page.url()).pathname;

    await page
      .getByRole("navigation", { name: "Project sections" })
      .getByRole("link", { name: /Test Suites/i })
      .click();
    await page.waitForURL(/\/projects\/[^/]+\/suites$/, { timeout: 15_000 });
    await suitesPage.create(suiteName);
    await suitesPage.open(suiteName);
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+$/, {
      timeout: 15_000,
    });

    await testCasesPage.create(caseName);

    await testRunsPage.goto(projectPath);
    await testRunsPage.create(runName, "staging");
    await testRunsPage.open(runName);
    await page.waitForURL(/\/projects\/[^/]+\/runs\/[^/]+$/, {
      timeout: 15_000,
    });

    await testResultsPage.addResult(caseName, "Passed");

    await expect(testResultsPage.rows.first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("100%")).toBeVisible();

    const analyticsPath = projectPath.replace("/runs", "/analytics/suite");
    const breakdownResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/suite-breakdown") && response.ok(),
    );
    await analyticsPage.goto(analyticsPath);
    await analyticsPage.suiteTab.click();
    await expect(page).toHaveURL(/\/analytics\/suite$/);

    const runOptionValue = await page
      .locator("#suite-run-select option")
      .filter({ hasText: runName })
      .getAttribute("value");
    expect(runOptionValue).toBeTruthy();
    await expect(page.locator("#suite-run-select")).toHaveValue(
      runOptionValue!,
    );
    const response = await breakdownResponse;
    expect(response.url()).toContain(
      `/analytics/runs/${runOptionValue}/suite-breakdown`,
    );
    expect(await response.json()).toEqual([
      {
        suite_name: suiteName,
        passed: 1,
        failed: 0,
        blocked: 0,
        skipped: 0,
        untested: 0,
      },
    ]);
    await expect(page.getByText(suiteName).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
