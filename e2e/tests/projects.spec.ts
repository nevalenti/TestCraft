import { randomUUID } from "node:crypto";

import { expect, test } from "../fixtures";

test.describe("Projects page", () => {
  test.beforeEach(async ({ projectsPage }) => {
    await projectsPage.goto();
  });

  test("renders page chrome", async ({ projectsPage }) => {
    await expect(projectsPage.searchInput).toBeVisible();
    await expect(projectsPage.createButton).toBeVisible();
  });

  test("opens and closes the create dialog", async ({ projectsPage, page }) => {
    await projectsPage.openCreateDialog();
    await expect(projectsPage.dialog).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "New Project" }),
    ).toBeVisible();

    await projectsPage.confirmDialog.cancel();
    await expect(projectsPage.dialog).not.toBeVisible();
  });

  test("creates and then deletes a project", async ({ projectsPage }) => {
    const name = `E2E Project ${randomUUID()}`;
    await projectsPage.create(name);
    await projectsPage.delete(name);
  });

  test("filters projects by search", async ({ projectsPage }) => {
    const name = `E2E SearchTarget ${randomUUID()}`;

    await projectsPage.create(name);

    const control = `E2E Control ${randomUUID()}`;
    await projectsPage.create(control);
    await projectsPage.search(name);
    await expect(projectsPage.getCard(name)).toBeVisible();
    await expect(projectsPage.getCard(control)).toHaveCount(0);

    await projectsPage.search("zzz-no-match-zzz");
    await expect(projectsPage.getCard(name)).toHaveCount(0);

    await projectsPage.clearSearch();
    await expect(projectsPage.getCard(name)).toBeVisible();
    await expect(projectsPage.getCard(control)).toBeVisible();
    await projectsPage.delete(name);
    await projectsPage.delete(control);
  });
});
