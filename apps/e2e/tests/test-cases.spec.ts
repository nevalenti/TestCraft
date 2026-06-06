import path from "node:path";

import { expect, test } from "@playwright/test";

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json");

test.describe("Test Cases", () => {
  test.describe.configure({ mode: "serial" });

  const projectName = `E2E Cases ${Date.now()}`;
  let suitePath: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
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
    await page.waitForURL(/\/projects\/[^/]+\/suites$/, { timeout: 15_000 });

    await page.getByRole("button", { name: "New Suite" }).click();
    await page.getByLabel("Name").fill("E2E Cases Suite");
    await page.getByRole("button", { name: "Save" }).click();

    const suiteCard = page
      .locator('[data-testid="suite-card"]')
      .filter({ hasText: "E2E Cases Suite" });
    await expect(suiteCard).toBeVisible({ timeout: 15_000 });
    await suiteCard.getByRole("link", { name: "Open test suite" }).click();
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+$/, {
      timeout: 15_000,
    });
    suitePath = new URL(page.url()).pathname;

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!suitePath) return;
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
    await page.goto(suitePath);
    await expect(
      page.getByRole("button", { name: "New Test Case" }),
    ).toBeVisible();
  });

  test("renders test cases page with search", async ({ page }) => {
    await expect(page.getByPlaceholder("Search test cases…")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "New Test Case" }),
    ).toBeVisible();
  });

  test("creates and deletes a test case", async ({ page }) => {
    const name = `E2E Case ${Date.now()}`;

    await page.getByRole("button", { name: "New Test Case" }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Save" }).click();

    const card = page
      .locator('[data-testid="case-card"]')
      .filter({ hasText: name });
    await expect(card).toBeVisible({ timeout: 10_000 });

    await card.hover();
    await card.getByRole("button", { name: "Delete test case" }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(
      page.locator('[data-testid="case-card"]').filter({ hasText: name }),
    ).toHaveCount(0);
  });

  test("creates a test case with High priority", async ({ page }) => {
    const name = `E2E Case Priority ${Date.now()}`;

    await page.getByRole("button", { name: "New Test Case" }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Priority").selectOption("High");
    await page.getByRole("button", { name: "Save" }).click();

    const card = page
      .locator('[data-testid="case-card"]')
      .filter({ hasText: name });
    await expect(card).toBeVisible({ timeout: 10_000 });
    await expect(card.getByText("High")).toBeVisible();

    await card.hover();
    await card.getByRole("button", { name: "Delete test case" }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
  });

  test("edits a test case name", async ({ page }) => {
    const name = `E2E Case Edit ${Date.now()}`;
    const updated = `${name} Updated`;

    await page.getByRole("button", { name: "New Test Case" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page.locator("dialog[open]").getByLabel("Name").fill(name);
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Save" })
      .click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();
    await expect(
      page.locator('[data-testid="case-card"]').filter({ hasText: name }),
    ).toBeVisible({ timeout: 10_000 });

    const card = page
      .locator('[data-testid="case-card"]')
      .filter({ hasText: name });
    await card.hover();
    await card.getByRole("button", { name: "Edit test case" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page.locator("dialog[open] #case-name").fill(updated);
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Save" })
      .click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();

    await expect(
      page.locator('[data-testid="case-card"]').filter({ hasText: updated }),
    ).toBeVisible({ timeout: 10_000 });

    const updatedCard = page
      .locator('[data-testid="case-card"]')
      .filter({ hasText: updated });
    await updatedCard.hover();
    await updatedCard.getByRole("button", { name: "Delete test case" }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
  });

  test("filters test cases by search", async ({ page }) => {
    const name = `E2E Case Search ${Date.now()}`;

    await page.getByRole("button", { name: "New Test Case" }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.locator('[data-testid="case-card"]').filter({ hasText: name }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder("Search test cases…").fill(name.slice(0, 12));
    await expect(
      page.locator('[data-testid="case-card"]').filter({ hasText: name }),
    ).toBeVisible();

    await page.getByPlaceholder("Search test cases…").fill("zzz-no-match-zzz");
    await expect(
      page.locator('[data-testid="case-card"]').filter({ hasText: name }),
    ).not.toBeVisible();

    await page.getByPlaceholder("Search test cases…").clear();
    const card = page
      .locator('[data-testid="case-card"]')
      .filter({ hasText: name });
    await card.hover();
    await card.getByRole("button", { name: "Delete test case" }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
  });

  test("navigates to a test case on card click", async ({ page }) => {
    const name = `E2E Case Nav ${Date.now()}`;

    await page.getByRole("button", { name: "New Test Case" }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Save" }).click();

    const card = page
      .locator('[data-testid="case-card"]')
      .filter({ hasText: name });
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.getByRole("link", { name: "Open test case" }).click();
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+\/cases\/[^/]+$/);
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
  });
});
