import path from "node:path";

import { expect, test } from "@playwright/test";

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

    await page.goto("/projects");
    await page.getByRole("button", { name: /new project/i }).click();
    await page.getByLabel("Name").fill(projectName);
    await page.getByRole("button", { name: "Save" }).click();

    const projectCard = page
      .locator('[data-testid="project-card"]')
      .filter({ hasText: projectName });
    await expect(projectCard).toBeVisible({ timeout: 15_000 });
    await projectCard.getByRole("link", { name: "Open project" }).click();
    await page.waitForURL(/\/projects\/[^/]+$/, { timeout: 15_000 });
    projectPath = new URL(page.url()).pathname;

    await page.getByRole("button", { name: "New Suite" }).click();
    await page.getByLabel("Name").fill("E2E Results Suite");
    await page.getByRole("button", { name: "Save" }).click();

    const suiteCard = page
      .locator('[data-testid="suite-card"]')
      .filter({ hasText: "E2E Results Suite" });
    await expect(suiteCard).toBeVisible({ timeout: 15_000 });
    await suiteCard.getByRole("link", { name: "Open test suite" }).click();
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+$/, {
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "New Test Case" }).click();
    await page.getByLabel("Name").fill(testCaseName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page
        .locator('[data-testid="case-card"]')
        .filter({ hasText: testCaseName }),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto(projectPath);
    await page.getByRole("button", { name: "Test Runs" }).click();
    await page.getByRole("button", { name: "New Run" }).click();
    await page.getByLabel("Name").fill("E2E Results Run");
    await page.getByLabel("Environment").fill("staging");
    await page.getByRole("button", { name: "Save" }).click();

    const runCard = page
      .locator('[data-testid="run-card"]')
      .filter({ hasText: "E2E Results Run" });
    await expect(runCard).toBeVisible({ timeout: 15_000 });
    await runCard.getByRole("link", { name: "Open test run" }).click();
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

    await page.goto("/projects");
    const card = page
      .locator('[data-testid="project-card"]')
      .filter({ hasText: projectName });
    if ((await card.count()) === 0) {
      await ctx.close();
      return;
    }

    await card.hover();
    await card.getByRole("button", { name: "Delete project" }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();

    await ctx.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(runPath);
    await expect(
      page.getByRole("button", { name: "Add Result" }),
    ).toBeVisible();
  });

  test("renders empty state with no results", async ({ page }) => {
    await expect(page.getByText("No results recorded")).toBeVisible();
  });

  test("records a result and shows pass rate summary", async ({ page }) => {
    await page.getByRole("button", { name: "Add Result" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page.getByLabel("Test Case").selectOption({ label: testCaseName });
    await page.getByLabel("Status").selectOption("Passed");
    await page.getByRole("button", { name: "Save" }).click();

    const row = page.locator('[data-testid="result-row"]').first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row.getByText(testCaseName)).toBeVisible();
    await expect(row.getByText("Passed")).toBeVisible();
    await expect(page.getByText("pass rate")).toBeVisible();
    await expect(page.getByText("100%")).toBeVisible();

    await row.getByRole("button", { name: "Delete result" }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(page.locator('[data-testid="result-row"]')).toHaveCount(0);
  });

  test("filters results by status", async ({ page }) => {
    for (const status of ["Passed", "Failed"] as const) {
      await page.getByRole("button", { name: "Add Result" }).click();
      await expect(page.locator("dialog[open]")).toBeVisible();
      await page
        .locator("dialog[open]")
        .getByLabel("Test Case")
        .selectOption({ label: testCaseName });
      await page
        .locator("dialog[open]")
        .getByLabel("Status")
        .selectOption(status);
      await page
        .locator("dialog[open]")
        .getByRole("button", { name: "Save" })
        .click();
      await expect(page.locator("dialog[open]")).not.toBeVisible();
      await expect(
        page.locator('[data-testid="result-row"]').last(),
      ).toBeVisible({ timeout: 10_000 });
    }

    await expect(page.locator('[data-testid="result-row"]')).toHaveCount(2, {
      timeout: 10_000,
    });

    await page
      .getByRole("button", { name: /passed/i })
      .first()
      .click();
    await expect(page.locator('[data-testid="result-row"]')).toHaveCount(1);
    await expect(
      page.locator('[data-testid="result-row"]').getByText("Passed"),
    ).toBeVisible();

    await page.getByRole("button", { name: "All results" }).click();
    await expect(page.locator('[data-testid="result-row"]')).toHaveCount(2);

    for (let i = 0; i < 2; i++) {
      const firstRow = page.locator('[data-testid="result-row"]').first();
      await firstRow.getByRole("button", { name: "Delete result" }).click();
      await page
        .locator("dialog[open]")
        .getByRole("button", { name: "Delete", exact: true })
        .click();
    }
  });

  test("edits a result status", async ({ page }) => {
    await page.getByRole("button", { name: "Add Result" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page
      .locator("dialog[open] #result-test-case")
      .selectOption({ label: testCaseName });
    await page.locator("dialog[open] #result-status").selectOption("Passed");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Save" })
      .click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();

    const row = page.locator('[data-testid="result-row"]').first();
    await expect(row.getByText("Passed")).toBeVisible({ timeout: 10_000 });

    await row.getByRole("button", { name: "Edit result" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page
      .locator("dialog[open] #update-result-status")
      .selectOption("Failed");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Save" })
      .click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();

    await expect(
      page.locator('[data-testid="result-row"]').first().getByText("Failed"),
    ).toBeVisible({ timeout: 10_000 });

    const updatedRow = page.locator('[data-testid="result-row"]').first();
    await updatedRow.getByRole("button", { name: "Delete result" }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
  });
});
