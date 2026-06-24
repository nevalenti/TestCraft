import path from "node:path";

import { expect, test } from "../fixtures";
import { ProjectsPage } from "../pages/projects.page";

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json");

test.describe("Test Plans", () => {
  test.describe.configure({ mode: "serial" });

  const projectName = `E2E Plans ${Date.now()}`;
  let plansPath: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
    const ctx = await browser.newContext({ storageState: AUTH_FILE });
    const page = await ctx.newPage();

    const projects = new ProjectsPage(page);
    await projects.goto();
    await projects.create(projectName);
    await projects.open(projectName);
    await page.waitForURL(/\/projects\/[^/]+\/runs$/, { timeout: 15_000 });
    plansPath = new URL(page.url()).pathname.replace("/runs", "/plans");

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!plansPath) return;
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

  test.beforeEach(async ({ testPlansPage }) => {
    await testPlansPage.goto(plansPath);
  });

  test("renders test plans page", async ({ testPlansPage }) => {
    await expect(testPlansPage.createButton).toBeVisible();
  });

  test("opens and closes the create plan dialog", async ({
    testPlansPage,
    page,
  }) => {
    await testPlansPage.createButton.click();
    await expect(testPlansPage.dialog).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "New Test Plan" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(testPlansPage.dialog).not.toBeVisible();
  });

  test("creates and deletes a plan", async ({ testPlansPage }) => {
    const name = `E2E Plan ${Date.now()}`;
    await testPlansPage.create(name);
    await testPlansPage.delete(name);
  });

  test("edits a plan", async ({ testPlansPage }) => {
    const name = `E2E Plan Edit ${Date.now()}`;
    await testPlansPage.create(name);
    await testPlansPage.edit(name, `${name} Updated`);
    await testPlansPage.delete(`${name} Updated`);
  });
});
