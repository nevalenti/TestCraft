import path from "node:path";

import { expect, test } from "@playwright/test";

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json");

test.describe("Test Suites tab", () => {
  test.describe.configure({ mode: "serial" });

  const projectName = `E2E Suites ${Date.now()}`;
  let projectPath: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
    const ctx = await browser.newContext({ storageState: AUTH_FILE });
    const page = await ctx.newPage();

    await page.goto("/projects");
    await page.getByRole("button", { name: /new project/i }).click();
    await page.getByLabel("Name").fill(projectName);
    await page.getByRole("button", { name: "Save" }).click();

    const card = page
      .locator('[data-testid="project-card"]')
      .filter({ hasText: projectName });
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole("link", { name: "Open project" }).click();
    await page.waitForURL(/\/projects\/[^/]+$/, { timeout: 15_000 });
    projectPath = new URL(page.url()).pathname;

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
    await page.goto(projectPath);
    await expect(
      page.getByRole("button", { name: "Test Suites" }),
    ).toBeVisible();
  });

  test("renders suites tab by default", async ({ page }) => {
    await expect(page.getByRole("button", { name: "New Suite" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Test Suites" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Test Runs" })).toBeVisible();
  });

  test("opens and closes the create suite dialog", async ({ page }) => {
    await page.getByRole("button", { name: "New Suite" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "New Test Suite" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();
  });

  test("creates and deletes a suite", async ({ page }) => {
    const name = `Suite ${Date.now()}`;

    await page.getByRole("button", { name: "New Suite" }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Save" }).click();

    const card = page
      .locator('[data-testid="suite-card"]')
      .filter({ hasText: name });
    await expect(card).toBeVisible({ timeout: 10_000 });

    await card.hover();
    await card.getByRole("button", { name: "Delete test suite" }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(
      page.locator('[data-testid="suite-card"]').filter({ hasText: name }),
    ).toHaveCount(0);
  });

  test("edits a suite name", async ({ page }) => {
    const name = `Suite Edit ${Date.now()}`;
    const updated = `${name} Updated`;

    await page.getByRole("button", { name: "New Suite" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page.locator("dialog[open]").getByLabel("Name").fill(name);
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Save" })
      .click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();
    await expect(
      page.locator('[data-testid="suite-card"]').filter({ hasText: name }),
    ).toBeVisible({ timeout: 10_000 });

    const card = page
      .locator('[data-testid="suite-card"]')
      .filter({ hasText: name });
    await card.hover();
    await card.getByRole("button", { name: "Edit test suite" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page.locator("dialog[open] #suite-name").fill(updated);
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Save" })
      .click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();

    await expect(
      page.locator('[data-testid="suite-card"]').filter({ hasText: updated }),
    ).toBeVisible({ timeout: 10_000 });

    const updatedCard = page
      .locator('[data-testid="suite-card"]')
      .filter({ hasText: updated });
    await updatedCard.hover();
    await updatedCard
      .getByRole("button", { name: "Delete test suite" })
      .click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
  });

  test("navigates to a suite on card click", async ({ page }) => {
    const name = `Suite Nav ${Date.now()}`;

    await page.getByRole("button", { name: "New Suite" }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Save" }).click();

    const card = page
      .locator('[data-testid="suite-card"]')
      .filter({ hasText: name });
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.getByRole("link", { name: "Open test suite" }).click();
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+$/);
    await expect(page.getByRole("heading", { name })).toBeVisible();
  });
});
