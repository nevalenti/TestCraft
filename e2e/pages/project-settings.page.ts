import { expect, type Page } from '@playwright/test';

type Tab = 'API Tokens' | 'Notifications' | 'Members';

export class ProjectSettingsPage {
  constructor(private page: Page) {}

  get trigger() {
    return this.page.getByRole('button', { name: 'Project settings' });
  }

  get dialog() {
    return this.page.locator('dialog[open]');
  }

  async open() {
    await this.trigger.click();
    await expect(this.dialog).toBeVisible();
  }

  async goToTab(tab: Tab) {
    await this.dialog.getByRole('button', { name: tab, exact: true }).click();
  }

  async createToken(name: string) {
    await this.dialog.getByLabel('Token name').fill(name);
    await this.dialog.getByRole('button', { name: 'Create' }).click();
    await expect(
      this.dialog.getByText("Copy your token — it won't be shown again"),
    ).toBeVisible();
    await expect(this.getTokenRow(name)).toBeVisible({ timeout: 10_000 });
  }

  getTokenRow(name: string) {
    return this.dialog.locator('li').filter({ hasText: name });
  }

  async revokeToken(name: string) {
    await this.getTokenRow(name)
      .getByRole('button', { name: 'Revoke token' })
      .click();
    await expect(this.getTokenRow(name).getByText(/revoked/i)).toBeVisible();
  }

  async addWebhook(url: string) {
    await this.dialog.getByLabel('Webhook URL').fill(url);
    await this.dialog.getByRole('button', { name: 'Add Webhook' }).click();
    await expect(this.getWebhookRow(url)).toBeVisible({ timeout: 10_000 });
  }

  getWebhookRow(url: string) {
    return this.dialog.locator('li').filter({ hasText: url });
  }

  async deleteWebhook(url: string) {
    await this.getWebhookRow(url)
      .getByRole('button', { name: `Delete webhook ${url}` })
      .click();
    await expect(this.getWebhookRow(url)).toHaveCount(0);
  }

  async addEmail(email: string) {
    await this.dialog.getByPlaceholder('alerts@example.com').fill(email);
    await this.dialog.getByRole('button', { name: 'Add Email' }).click();
    await expect(this.getEmailRow(email)).toBeVisible({ timeout: 10_000 });
  }

  getEmailRow(email: string) {
    return this.dialog.locator('li').filter({ hasText: email });
  }

  async deleteEmail(email: string) {
    await this.getEmailRow(email)
      .getByRole('button', { name: `Delete email subscription ${email}` })
      .click();
    await expect(this.getEmailRow(email)).toHaveCount(0);
  }

  async addMember(email: string) {
    await this.dialog.getByLabel('Add member by email').fill(email);
    await this.dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(this.getMemberRow(email)).toBeVisible({ timeout: 10_000 });
  }

  getMemberRow(email: string) {
    return this.dialog.locator('li').filter({ hasText: email });
  }

  async removeMember(email: string) {
    await this.getMemberRow(email)
      .getByRole('button', { name: `Remove ${email}` })
      .click();
    await expect(this.getMemberRow(email)).toHaveCount(0);
  }
}
