import { randomUUID } from "node:crypto";

import { expect, test } from "../fixtures";
import { waitForEmail } from "../helpers/mailpit";

test("delivers a completion email with a link to the run", async ({
  page,
  request,
  projectsPage,
  projectSettingsPage,
  testRunsPage,
}) => {
  test.setTimeout(90_000);
  const suffix = randomUUID();
  const projectName = `E2E Email ${suffix}`;
  const runName = `Notification <run> ${suffix}`;
  const recipient = `e2e+${suffix}@example.com`;

  await projectsPage.goto();
  await projectsPage.create(projectName);
  await projectsPage.open(projectName);
  await page.waitForURL(/\/projects\/[^/]+\/runs$/);
  const projectPath = new URL(page.url()).pathname;
  await projectSettingsPage.open();
  await projectSettingsPage.goToTab("Notifications");
  await projectSettingsPage.addEmail(recipient);

  await testRunsPage.goto(projectPath);
  await testRunsPage.create(runName, "email-e2e");
  const card = testRunsPage.getCard(runName);
  await card.hover();
  await card.getByRole("button", { name: "Edit test run" }).click();
  await testRunsPage.dialog.getByRole("combobox").selectOption("completed");
  await testRunsPage.dialog.getByRole("button", { name: "Save" }).click();
  await expect(testRunsPage.dialog).not.toBeVisible();
  await testRunsPage.open(runName);
  await page.waitForURL(/\/projects\/[^/]+\/runs\/[^/]+$/);
  const runPath = new URL(page.url()).pathname;

  const email = await waitForEmail(request, recipient);
  expect(email.Subject).toBe(`[TestCraft] ${runName} — run.completed`);
  expect(email.html).toContain("Notification &lt;run&gt;");
  expect(email.html).toContain("has completed.");
  await page.setContent(email.html);
  const link = page.getByRole("link", { name: "View test run" });
  expect(await link.getAttribute("href")).toBe(
    new URL(runPath, process.env.WEB_BASE_URL ?? "http://localhost:4173").href,
  );
  const destinationPromise = page.waitForEvent("popup");
  await link.click();
  const destination = await destinationPromise;
  await expect(destination).toHaveURL(new RegExp(`${runPath}$`));
  await expect(
    destination
      .getByRole("navigation", { name: "Breadcrumb" })
      .getByText(runName, { exact: true }),
  ).toBeVisible();
  await destination.close();
});
