import { test as base } from '@playwright/test';

import { AccountPage } from './pages/account.page';
import { AnalyticsPage } from './pages/analytics.page';
import { LabelsPage } from './pages/labels.page';
import { ProjectSettingsPage } from './pages/project-settings.page';
import { ProjectsPage } from './pages/projects.page';
import { SharePage } from './pages/share.page';
import { TestCasesPage } from './pages/test-cases.page';
import { TestPlansPage } from './pages/test-plans.page';
import { TestResultsPage } from './pages/test-results.page';
import { TestRunsPage } from './pages/test-runs.page';
import { TestStepsPage } from './pages/test-steps.page';
import { TestSuitesPage } from './pages/test-suites.page';

export { expect } from '@playwright/test';

type Fixtures = {
  projectsPage: ProjectsPage;
  suitesPage: TestSuitesPage;
  testCasesPage: TestCasesPage;
  testRunsPage: TestRunsPage;
  testStepsPage: TestStepsPage;
  testResultsPage: TestResultsPage;
  testPlansPage: TestPlansPage;
  analyticsPage: AnalyticsPage;
  labelsPage: LabelsPage;
  projectSettingsPage: ProjectSettingsPage;
  accountPage: AccountPage;
  sharePage: SharePage;
};

export const test = base.extend<Fixtures>({
  projectsPage: async ({ page }, use) => use(new ProjectsPage(page)),
  suitesPage: async ({ page }, use) => use(new TestSuitesPage(page)),
  testCasesPage: async ({ page }, use) => use(new TestCasesPage(page)),
  testRunsPage: async ({ page }, use) => use(new TestRunsPage(page)),
  testStepsPage: async ({ page }, use) => use(new TestStepsPage(page)),
  testResultsPage: async ({ page }, use) => use(new TestResultsPage(page)),
  testPlansPage: async ({ page }, use) => use(new TestPlansPage(page)),
  analyticsPage: async ({ page }, use) => use(new AnalyticsPage(page)),
  labelsPage: async ({ page }, use) => use(new LabelsPage(page)),
  projectSettingsPage: async ({ page }, use) =>
    use(new ProjectSettingsPage(page)),
  accountPage: async ({ page }, use) => use(new AccountPage(page)),
  sharePage: async ({ page }, use) => use(new SharePage(page)),
});
