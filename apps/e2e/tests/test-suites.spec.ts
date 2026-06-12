import path from "node:path";

import { expect, test } from "../fixtures";
import { ProjectsPage } from "../pages/projects.page";

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json");

test.describe("Test Suites tab", () => {
  test.describe.configure({ mode: "serial" });

  const projectName = `E2E Suites ${Date.now()}`;
  let projectPath: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
    const ctx = await browser.newContext({ storageState: AUTH_FILE });
    const page = await ctx.newPage();

    const projects = new ProjectsPage(page);
    await projects.goto();
    await projects.create(projectName);
    await projects.open(projectName);
    await page.waitForURL(/\/projects\/[^/]+\/runs$/, { timeout: 15_000 });
    projectPath = new URL(page.url()).pathname.replace(/\/runs$/, "/suites");

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

  test.beforeEach(async ({ suitesPage }) => {
    await suitesPage.goto(projectPath);
  });

  test("renders suites tab by default", async ({ page }) => {
    await expect(page.getByRole("button", { name: "New Suite" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Test Suites/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Test Runs/i })).toBeVisible();
  });

  test("opens and closes the create suite dialog", async ({
    suitesPage,
    page,
  }) => {
    await suitesPage.openCreateDialog();
    await expect(suitesPage.dialog).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "New Test Suite" }),
    ).toBeVisible();

    await suitesPage.confirmDialog.cancel();
    await expect(suitesPage.dialog).not.toBeVisible();
  });

  test("creates and deletes a suite", async ({ suitesPage }) => {
    const name = `E2E Suite ${Date.now()}`;
    await suitesPage.create(name);
    await suitesPage.delete(name);
  });

  test("edits a suite name", async ({ suitesPage }) => {
    const name = `E2E Suite Edit ${Date.now()}`;
    await suitesPage.create(name);
    await suitesPage.edit(name, `${name} Updated`);
    await suitesPage.delete(`${name} Updated`);
  });

  test("navigates to a suite on card click", async ({ suitesPage, page }) => {
    const name = `E2E Suite Nav ${Date.now()}`;
    await suitesPage.create(name);
    await suitesPage.open(name);
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+$/);
    await expect(page.getByRole("heading", { name })).toBeVisible();
  });
});
