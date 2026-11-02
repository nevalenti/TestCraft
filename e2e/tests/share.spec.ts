import { expect, test } from "../fixtures";
import { SharePage } from "../pages/share.page";

test("share link renders the run in a context that cannot access private projects", async ({
  page,
  browser,
  testRun,
}) => {
  await page.goto(testRun.path);
  await page.getByRole("button", { name: "Share this run" }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByRole("button", { name: "Create Link" }).click();
  const shareUrlInput = dialog.locator("input[readonly]");
  await expect(shareUrlInput).toBeVisible();
  const shareUrl = await shareUrlInput.inputValue();
  expect(shareUrl).toContain("/share/");

  const publicContext = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  try {
    const publicPage = await publicContext.newPage();
    await publicPage.goto("/projects");
    await expect(publicPage).toHaveURL(
      /\/realms\/testcraft\/protocol\/openid-connect\/auth/,
    );
    await expect(
      publicPage.getByRole("button", { name: /new project/i }),
    ).toHaveCount(0);
    const share = new SharePage(publicPage);
    await share.goto(shareUrl);
    await share.expectRunVisible(testRun.name);
  } finally {
    await publicContext.close();
  }
});
