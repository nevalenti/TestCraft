import path from "node:path";

import { expect, test } from "../fixtures";
import { ProjectsPage } from "../pages/projects.page";

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json");

test.describe("Test Runs tab", () => {
  test.describe.configure({ mode: "serial" });

  const projectName = `E2E Runs ${Date.now()}`;
  let projectPath: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
    const ctx = await browser.newContext({ storageState: AUTH_FILE });
    const page = await ctx.newPage();

    const projects = new ProjectsPage(page);
    await projects.goto();
    await projects.create(projectName);
    await projects.open(projectName);
    await page.waitForURL(/\/projects\/[^/]+\/suites$/, { timeout: 15_000 });
    projectPath = new URL(page.url()).pathname;

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

  test.beforeEach(async ({ testRunsPage }) => {
    await testRunsPage.goto(projectPath);
  });

  test("renders runs tab", async ({ page }) => {
    await expect(page.getByRole("button", { name: "New Run" })).toBeVisible();
  });

  test("opens and closes the create run dialog", async ({
    testRunsPage,
    page,
  }) => {
    await testRunsPage.createButton.click();
    await expect(testRunsPage.dialog).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "New Test Run" }),
    ).toBeVisible();

    await testRunsPage.confirmDialog.cancel();
    await expect(testRunsPage.dialog).not.toBeVisible();
  });

  test("creates and deletes a run", async ({ testRunsPage }) => {
    const name = `E2E Run ${Date.now()}`;
    await testRunsPage.create(name, "staging");
    await expect(testRunsPage.getCard(name).getByText("staging")).toBeVisible();
    await testRunsPage.delete(name);
  });

  test("edits a run", async ({ testRunsPage }) => {
    const name = `E2E Run Edit ${Date.now()}`;
    await testRunsPage.create(name, "staging");
    await testRunsPage.edit(name, `${name} Updated`);
    await testRunsPage.delete(`${name} Updated`);
  });

  test("navigates into a run on card click", async ({ testRunsPage, page }) => {
    const name = `E2E Run Nav ${Date.now()}`;
    await testRunsPage.create(name, "production");
    await testRunsPage.open(name);
    await page.waitForURL(/\/projects\/[^/]+\/runs\/[^/]+$/);
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Result" }),
    ).toBeVisible();
  });
});
