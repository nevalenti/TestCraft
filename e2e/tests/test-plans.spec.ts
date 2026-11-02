import { randomUUID } from "node:crypto";

import { expect, test } from "../fixtures";

test.describe("Test Plans", () => {
  test.beforeEach(async ({ testPlansPage, testProject }) => {
    await testPlansPage.goto(testProject.path.replace("/runs", "/plans"));
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
    const name = `E2E Plan ${randomUUID()}`;
    await testPlansPage.create(name);
    await testPlansPage.delete(name);
  });

  test("edits a plan", async ({ testPlansPage }) => {
    const name = `E2E Plan Edit ${randomUUID()}`;
    await testPlansPage.create(name);
    await testPlansPage.edit(name, `${name} Updated`);
    await testPlansPage.delete(`${name} Updated`);
  });
});
