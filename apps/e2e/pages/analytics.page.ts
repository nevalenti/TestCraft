import { expect, type Page } from "@playwright/test";

export class AnalyticsPage {
  constructor(private page: Page) {}

  async goto(analyticsPath: string) {
    await this.page.goto(analyticsPath);
    await expect(this.trendTab).toBeVisible();
  }

  get trendTab() {
    return this.page.getByRole("tab", { name: /Trend/ });
  }

  get flakyTab() {
    return this.page.getByRole("tab", { name: /Flaky Tests/ });
  }

  get suiteTab() {
    return this.page.getByRole("tab", { name: /Suite Breakdown/ });
  }

  get comparisonTab() {
    return this.page.getByRole("tab", { name: /Run Comparison/ });
  }
}
