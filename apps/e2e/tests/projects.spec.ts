import { expect, test } from "@playwright/test";

test.describe("Projects page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("renders page chrome", async ({ page }) => {
    await expect(page.getByPlaceholder("Search projects…")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /new project/i }),
    ).toBeVisible();
  });

  test("opens and closes the create dialog", async ({ page }) => {
    await page.getByRole("button", { name: /new project/i }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "New Project" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator("dialog[open]")).not.toBeVisible();
  });

  test("creates and then deletes a project", async ({ page }) => {
    const name = `E2E Project ${Date.now()}`;

    await page.getByRole("button", { name: /new project/i }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

    const card = page
      .locator('[data-testid="project-card"]')
      .filter({ hasText: name });
    await card.hover();
    await card.getByRole("button", { name: "Delete project" }).click();

    await expect(page.locator("dialog[open]")).toBeVisible();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(
      page.locator('[data-testid="project-card"]').filter({ hasText: name }),
    ).toHaveCount(0);
  });

  test("filters projects by search", async ({ page }) => {
    const name = `E2E SearchTarget ${Date.now()}`;

    await page.getByRole("button", { name: /new project/i }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder("Search projects…").fill(name.slice(0, 12));
    await expect(page.getByText(name)).toBeVisible();

    await page.getByPlaceholder("Search projects…").fill("zzz-no-match-zzz");
    await expect(page.getByText(name)).not.toBeVisible();

    await page.getByPlaceholder("Search projects…").clear();
    const card = page
      .locator('[data-testid="project-card"]')
      .filter({ hasText: name });
    await card.hover();
    await card.getByRole("button", { name: "Delete project" }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
  });
});
