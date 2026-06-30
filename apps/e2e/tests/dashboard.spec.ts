import { expect, test } from "../fixtures";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("renders stat cards", async ({ page }) => {
    const section = page.locator("section");
    await expect(
      section.locator("p").filter({ hasText: /^Projects$/ }),
    ).toBeVisible();
    await expect(
      section.locator("p").filter({ hasText: /^Test Runs$/ }),
    ).toBeVisible();
    await expect(
      section.locator("p").filter({ hasText: /^Test Suites$/ }),
    ).toBeVisible();
  });

  test("My Projects button navigates to /projects", async ({ page }) => {
    await page.getByRole("link", { name: "Projects", exact: true }).click();
    await page.waitForURL("**/projects");
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("shows active runs section heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Active Runs" }),
    ).toBeVisible();
  });
});
