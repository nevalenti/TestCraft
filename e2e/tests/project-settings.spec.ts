import { randomUUID } from "node:crypto";

import { expect, test } from "../fixtures";

test.describe("Project Settings", () => {
  test.beforeEach(async ({ page, projectSettingsPage, testProject }) => {
    await page.goto(testProject.path);
    await projectSettingsPage.open();
  });

  test("renders the API Tokens tab by default", async ({
    page,
    projectSettingsPage,
  }) => {
    await expect(page).toHaveURL(/\/settings\/tokens$/);
    await expect(projectSettingsPage.tokensTab).toBeVisible();
    await expect(
      page.getByRole("button", { name: "New Token", exact: true }),
    ).toBeVisible();
  });

  test("creates and revokes an API token", async ({ projectSettingsPage }) => {
    const name = `E2E Token ${randomUUID()}`;
    await projectSettingsPage.createToken(name);
    await projectSettingsPage.revokeToken(name);
  });

  test("adds and deletes a webhook", async ({ projectSettingsPage }) => {
    await projectSettingsPage.goToTab("Notifications");
    const url = `https://example.com/hook-${randomUUID()}`;
    await projectSettingsPage.addWebhook(url);
    await projectSettingsPage.deleteWebhook(url);
  });

  test("adds and deletes an email subscription", async ({
    projectSettingsPage,
  }) => {
    await projectSettingsPage.goToTab("Notifications");
    const email = `alerts+${randomUUID()}@example.com`;
    await projectSettingsPage.addEmail(email);
    await projectSettingsPage.deleteEmail(email);
  });

  test("adds and removes a project member", async ({ projectSettingsPage }) => {
    await projectSettingsPage.goToTab("Members");
    const email = "e2e-member@testcraft.pro";
    await projectSettingsPage.addMember(email);
    await projectSettingsPage.removeMember(email);
  });
});
