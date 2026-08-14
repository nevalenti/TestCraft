import { expect, type Page } from '@playwright/test';

export class SharePage {
  constructor(private page: Page) {}

  async goto(shareUrl: string) {
    await this.page.goto(shareUrl);
  }

  get heading() {
    return this.page.getByText('Shared Test Run');
  }

  get notFoundHeading() {
    return this.page.getByRole('heading', { name: 'Link not found' });
  }

  get resultsTable() {
    return this.page.locator('table');
  }

  async expectRunVisible(runName: string) {
    await expect(this.heading).toBeVisible();
    await expect(
      this.page.getByRole('heading', { name: runName }),
    ).toBeVisible();
  }
}
