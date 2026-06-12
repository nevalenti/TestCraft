import path from "node:path";

import { expect, test } from "../fixtures";
import { ProjectsPage } from "../pages/projects.page";
import { SuitesPage } from "../pages/suites.page";

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json");

test.describe("Test Cases", () => {
  test.describe.configure({ mode: "serial" });

  const projectName = `E2E Cases ${Date.now()}`;
  let suitePath: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
    const ctx = await browser.newContext({ storageState: AUTH_FILE });
    const page = await ctx.newPage();

    const projects = new ProjectsPage(page);
    await projects.goto();
    await projects.create(projectName);
    await projects.open(projectName);
    await page.waitForURL(/\/projects\/[^/]+\/runs$/, { timeout: 15_000 });

    await page.getByRole("tab", { name: /Test Suites/i }).click();
    await page.waitForURL(/\/projects\/[^/]+\/suites$/, { timeout: 15_000 });

    const suites = new SuitesPage(page);
    await suites.create("E2E Cases Suite");
    await suites.open("E2E Cases Suite");
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

    const projects = new ProjectsPage(page);
    await projects.goto();
    if ((await projects.getCard(projectName).count()) === 0) {
      await ctx.close();
      return;
    }
    await projects.delete(projectName);

    await ctx.close();
  });

  test.beforeEach(async ({ testCasesPage }) => {
    await testCasesPage.goto(suitePath);
  });

  test("renders test cases page with search", async ({ testCasesPage }) => {
    await expect(testCasesPage.searchInput).toBeVisible();
    await expect(testCasesPage.createButton).toBeVisible();
  });

  test("creates and deletes a test case", async ({ testCasesPage }) => {
    const name = `E2E Case ${Date.now()}`;
    await testCasesPage.create(name);
    await testCasesPage.delete(name);
  });

  test("creates a test case with High priority", async ({ testCasesPage }) => {
    const name = `E2E Case Priority ${Date.now()}`;
    await testCasesPage.create(name, "High");
    await expect(testCasesPage.getCard(name).getByText("High")).toBeVisible();
    await testCasesPage.delete(name);
  });

  test("edits a test case name", async ({ testCasesPage }) => {
    const name = `E2E Case Edit ${Date.now()}`;
    await testCasesPage.create(name);
    await testCasesPage.edit(name, `${name} Updated`);
    await testCasesPage.delete(`${name} Updated`);
  });

  test("filters test cases by search", async ({ testCasesPage }) => {
    const name = `E2E Case Search ${Date.now()}`;

    await testCasesPage.create(name);

    await testCasesPage.search(name.slice(0, 12));
    await expect(testCasesPage.getCard(name)).toBeVisible();

    await testCasesPage.search("zzz-no-match-zzz");
    await expect(testCasesPage.getCard(name)).not.toBeVisible();

    await testCasesPage.clearSearch();
    await testCasesPage.delete(name);
  });

  test("navigates to a test case on card click", async ({
    testCasesPage,
    page,
  }) => {
    const name = `E2E Case Nav ${Date.now()}`;
    await testCasesPage.create(name);
    await testCasesPage.open(name);
    await page.waitForURL(/\/projects\/[^/]+\/suites\/[^/]+\/cases\/[^/]+$/);
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
  });
});
