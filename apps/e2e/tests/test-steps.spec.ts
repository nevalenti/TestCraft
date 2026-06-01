import path from "node:path";

import { expect, test } from "@playwright/test";

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json");

test.describe("Test Case Steps", () => {
  test.describe.configure({ mode: "serial" });

  const projectName = `E2E Steps ${Date.now()}`;
  let casePath: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90_000);
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

    await page.getByRole("button", { name: "New Suite" }).click();
    await page.getByLabel("Name").fill("E2E Steps Suite");
    await page.getByRole("button", { name: "Save" }).click();

    const suiteCard = page
      .locator('[data-testid="suite-card"]')
      .filter({ hasText: "E2E Steps Suite" });
    await expect(suiteCard).toBeVisible({ timeout: 15_000 });
    await suiteCard.getByRole("link", { name: "Open test suite" }).click();
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+$/, {
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "New Test Case" }).click();
    await page.getByLabel("Name").fill("E2E Steps Case");
    await page.getByRole("button", { name: "Save" }).click();

    const caseCard = page
      .locator('[data-testid="case-card"]')
      .filter({ hasText: "E2E Steps Case" });
    await expect(caseCard).toBeVisible({ timeout: 15_000 });
    await caseCard.getByRole("link", { name: "Open test case" }).click();
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+\/cases\/[^/]+$/, {
      timeout: 15_000,
    });
    casePath = new URL(page.url()).pathname;

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!casePath) return;
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
    await page.goto(casePath);
    await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
  });

  test("renders empty state when no steps exist", async ({ page }) => {
    await expect(page.getByText("No steps defined")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
  });

  test("opens and closes the add step dialog", async ({ page }) => {
    await page.getByRole("button", { name: "Add Step" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add Step" })).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();
  });

  test("adds and deletes a step", async ({ page }) => {
    await page.getByRole("button", { name: "Add Step" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page.getByLabel("Action").fill("Navigate to the login page");
    await page.getByLabel("Expected Result").fill("Login page is displayed");
    await page.getByRole("button", { name: "Save" }).click();

    const row = page.locator('[data-testid="step-row"]').first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row.getByText("Navigate to the login page")).toBeVisible();
    await expect(row.getByText("Login page is displayed")).toBeVisible();

    await row.getByRole("button", { name: "Delete step" }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(page.locator('[data-testid="step-row"]')).toHaveCount(0);
  });

  test("edits a step", async ({ page }) => {
    await page.getByRole("button", { name: "Add Step" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page
      .locator("dialog[open]")
      .getByLabel("Action")
      .fill("Click the submit button");
    await page
      .locator("dialog[open]")
      .getByLabel("Expected Result")
      .fill("Form is submitted");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Save" })
      .click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();

    const row = page.locator('[data-testid="step-row"]').first();
    await expect(row).toBeVisible({ timeout: 10_000 });

    await row.getByRole("button", { name: "Edit step" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page
      .locator("dialog[open] #step-action")
      .fill("Double-click the submit button");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Save" })
      .click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();

    await expect(
      page
        .locator('[data-testid="step-row"]')
        .first()
        .getByText("Double-click the submit button"),
    ).toBeVisible({ timeout: 10_000 });

    const updatedRow = page.locator('[data-testid="step-row"]').first();
    await updatedRow.getByRole("button", { name: "Delete step" }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
  });

  test("adds multiple steps and shows them in order", async ({ page }) => {
    for (const [i, action] of [
      "First action",
      "Second action",
      "Third action",
    ].entries()) {
      await page.getByRole("button", { name: "Add Step" }).click();
      await expect(page.locator("dialog[open]")).toBeVisible();
      await page.getByLabel("Action").fill(action);
      await page.getByLabel("Expected Result").fill(`Result ${i + 1}`);
      await page.getByRole("button", { name: "Save" }).click();
      await expect(page.locator('[data-testid="step-row"]')).toHaveCount(
        i + 1,
        { timeout: 10_000 },
      );
    }

    const rows = page.locator('[data-testid="step-row"]');
    await expect(rows.first().getByText("First action")).toBeVisible();
    await expect(rows.nth(1).getByText("Second action")).toBeVisible();
    await expect(rows.nth(2).getByText("Third action")).toBeVisible();

    for (let i = 0; i < 3; i++) {
      const firstRow = page.locator('[data-testid="step-row"]').first();
      await firstRow.getByRole("button", { name: "Delete step" }).click();
      await page
        .locator("dialog[open]")
        .getByRole("button", { name: "Delete", exact: true })
        .click();
    }
  });
});
