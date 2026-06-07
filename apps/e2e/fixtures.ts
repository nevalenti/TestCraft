import { test as base } from "@playwright/test";

import { ProjectsPage } from "./pages/projects.page";
import { SuitesPage } from "./pages/suites.page";
import { TestCasesPage } from "./pages/test-cases.page";
import { TestResultsPage } from "./pages/test-results.page";
import { TestRunsPage } from "./pages/test-runs.page";
import { TestStepsPage } from "./pages/test-steps.page";

export { expect } from "@playwright/test";

type Fixtures = {
  projectsPage: ProjectsPage;
  suitesPage: SuitesPage;
  testCasesPage: TestCasesPage;
  testRunsPage: TestRunsPage;
  testStepsPage: TestStepsPage;
  testResultsPage: TestResultsPage;
};

export const test = base.extend<Fixtures>({
  projectsPage: async ({ page }, use) => use(new ProjectsPage(page)),
  suitesPage: async ({ page }, use) => use(new SuitesPage(page)),
  testCasesPage: async ({ page }, use) => use(new TestCasesPage(page)),
  testRunsPage: async ({ page }, use) => use(new TestRunsPage(page)),
  testStepsPage: async ({ page }, use) => use(new TestStepsPage(page)),
  testResultsPage: async ({ page }, use) => use(new TestResultsPage(page)),
});
