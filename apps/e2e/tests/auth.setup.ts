import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test as setup } from "@playwright/test";

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json");

setup("authenticate via Keycloak", async ({ page }) => {
  await page.goto("/");

  await page.waitForURL(/\/realms\/testcraft\/protocol\/openid-connect\/auth/);

  await page.locator("#username").fill(process.env.E2E_USERNAME!);
  await page.locator("#password").fill(process.env.E2E_PASSWORD!);
  await page.locator("#kc-login").click();

  await page.waitForURL(process.env.E2E_BASE_URL!);
  await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

  await mkdir(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
