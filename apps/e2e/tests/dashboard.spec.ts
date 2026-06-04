import { expect, test } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  });

  test("renders stat cards", async ({ page }) => {
    await expect(
      page.locator("span").filter({ hasText: /^Projects$/ }),
    ).toBeVisible();
    await expect(
      page.locator("span").filter({ hasText: /^Active Runs$/ }),
    ).toBeVisible();
    await expect(
      page.locator("span").filter({ hasText: /^Test Suites$/ }),
    ).toBeVisible();
  });

  test("My Projects button navigates to /projects", async ({ page }) => {
    await page.getByRole("link", { name: "Projects" }).click();
    await page.waitForURL("**/projects");
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("shows active runs section heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Active Runs" }),
    ).toBeVisible();
  });
});
