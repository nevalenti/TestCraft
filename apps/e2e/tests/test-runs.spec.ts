import path from "node:path";

import { expect, test } from "@playwright/test";

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json");

test.describe("Test Runs tab", () => {
  test.describe.configure({ mode: "serial" });

  const projectName = `E2E Runs ${Date.now()}`;
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
    await page.waitForURL(/\/projects\/[^/]+\/suites$/, { timeout: 15_000 });
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
    await page.getByRole("link", { name: /Test Runs/i }).click();
    await expect(page.getByRole("button", { name: "New Run" })).toBeVisible();
  });

  test("renders runs tab", async ({ page }) => {
    await expect(page.getByRole("button", { name: "New Run" })).toBeVisible();
  });

  test("opens and closes the create run dialog", async ({ page }) => {
    await page.getByRole("button", { name: "New Run" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "New Test Run" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();
  });

  test("creates and deletes a run", async ({ page }) => {
    const name = `E2E Run ${Date.now()}`;

    await page.getByRole("button", { name: "New Run" }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Environment").fill("staging");
    await page.getByRole("button", { name: "Save" }).click();

    const card = page
      .locator('[data-testid="run-card"]')
      .filter({ hasText: name });
    await expect(card).toBeVisible({ timeout: 10_000 });
    await expect(card.getByText("staging")).toBeVisible();

    await card.hover();
    await card.getByRole("button", { name: "Delete test run" }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(
      page.locator('[data-testid="run-card"]').filter({ hasText: name }),
    ).toHaveCount(0);
  });

  test("edits a run", async ({ page }) => {
    const name = `E2E Run Edit ${Date.now()}`;
    const updated = `${name} Updated`;

    await page.getByRole("button", { name: "New Run" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page.locator("dialog[open]").getByLabel("Name").fill(name);
    await page
      .locator("dialog[open]")
      .getByLabel("Environment")
      .fill("staging");
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Save" })
      .click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();
    await expect(
      page.locator('[data-testid="run-card"]').filter({ hasText: name }),
    ).toBeVisible({ timeout: 10_000 });

    const card = page
      .locator('[data-testid="run-card"]')
      .filter({ hasText: name });
    await card.hover();
    await card.getByRole("button", { name: "Edit test run" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page.locator("dialog[open] #run-name").fill(updated);
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Save" })
      .click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();

    await expect(
      page.locator('[data-testid="run-card"]').filter({ hasText: updated }),
    ).toBeVisible({ timeout: 10_000 });

    const updatedCard = page
      .locator('[data-testid="run-card"]')
      .filter({ hasText: updated });
    await updatedCard.hover();
    await updatedCard.getByRole("button", { name: "Delete test run" }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
  });

  test("navigates into a run on card click", async ({ page }) => {
    const name = `E2E Run Nav ${Date.now()}`;

    await page.getByRole("button", { name: "New Run" }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Environment").fill("production");
    await page.getByRole("button", { name: "Save" }).click();

    const card = page
      .locator('[data-testid="run-card"]')
      .filter({ hasText: name });
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.getByRole("link", { name: "Open test run" }).click();
    await page.waitForURL(/\/projects\/[^/]+\/runs\/[^/]+$/);
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Result" }),
    ).toBeVisible();
  });
});
