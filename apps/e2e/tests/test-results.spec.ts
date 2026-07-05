import path from "node:path";

import { expect, test } from "../fixtures";
import { ProjectsPage } from "../pages/projects.page";
import { SuitesPage } from "../pages/suites.page";
import { TestCasesPage } from "../pages/test-cases.page";
import { TestRunsPage } from "../pages/test-runs.page";

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json");

test.describe("Test Results", () => {
  test.describe.configure({ mode: "serial" });

  const projectName = `E2E Results ${Date.now()}`;
  const testCaseName = "E2E Results Case";
  let projectPath: string;
  let runPath: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);
    const ctx = await browser.newContext({ storageState: AUTH_FILE });
    const page = await ctx.newPage();

    const projects = new ProjectsPage(page);
    await projects.goto();
    await projects.create(projectName);
    await projects.open(projectName);
    await page.waitForURL(/\/projects\/[^/]+\/runs$/, { timeout: 15_000 });
    projectPath = new URL(page.url()).pathname;

    await page.getByRole("tab", { name: /Test Suites/i }).click();
    await page.waitForURL(/\/projects\/[^/]+\/suites$/, { timeout: 15_000 });

    const suites = new SuitesPage(page);
    await suites.create("E2E Results Suite");
    await suites.open("E2E Results Suite");
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+$/, {
      timeout: 15_000,
    });

    await new TestCasesPage(page).create(testCaseName);

    const runs = new TestRunsPage(page);
    await runs.goto(projectPath);
    await runs.create("E2E Results Run", "staging");
    await runs.open("E2E Results Run");
    await page.waitForURL(/\/projects\/[^/]+\/runs\/[^/]+$/, {
      timeout: 15_000,
    });
    runPath = new URL(page.url()).pathname;

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!projectPath) return;
    const ctx = await browser.newContext({ storageState: AUTH_FILE });
    const page = await ctx.newPage();

    const projects = new ProjectsPage(page);
    await projects.goto();
    if ((await projects.getCard(projectName).count()) === 0) {
      await ctx.close();
      return;
    }
    await projects.delete(projectName);

    await ctx.close();
  });

  test.beforeEach(async ({ testResultsPage }) => {
    await testResultsPage.goto(runPath);
  });

  test("renders empty state with no results", async ({ page }) => {
    await expect(page.getByText("No results recorded")).toBeVisible();
  });

  test("records a result and shows pass rate summary", async ({
    testResultsPage,
    page,
  }) => {
    await testResultsPage.addResult(testCaseName, "Passed");

    const row = testResultsPage.rows.first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row.getByText(testCaseName)).toBeVisible();
    await expect(row.getByText("Passed")).toBeVisible();
    await expect(page.getByText("pass rate")).toBeVisible();
    await expect(page.getByText("100%")).toBeVisible();

    await testResultsPage.deleteResult(0);
    await expect(testResultsPage.rows).toHaveCount(0);
  });

  test("filters results by status", async ({ testResultsPage }) => {
    for (const status of ["Passed", "Failed"] as const) {
      await testResultsPage.addResult(testCaseName, status);
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
    page,
  }) => {
    for (const status of ["Passed", "Failed", "Blocked"] as const) {
      await testResultsPage.addResult(testCaseName, status);
      await expect(testResultsPage.rows.last()).toBeVisible({
        timeout: 10_000,
      });
    }
    await expect(testResultsPage.rows).toHaveCount(3, { timeout: 10_000 });

    await expect(page.getByText("3 results")).toBeVisible();
    await expect(page.getByText("33%")).toBeVisible();

    for (let i = 0; i < 3; i++) {
      await testResultsPage.deleteResult(0);
    }
    await expect(testResultsPage.rows).toHaveCount(0);
  });

  test("edits a result status", async ({ testResultsPage }) => {
    await testResultsPage.addResult(testCaseName, "Passed");
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
