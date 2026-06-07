import type { AllureResultItem, TestRun } from "@testcraft/types";

import client from "@/api/client";

const BASE = (projectId: string) => `projects/${projectId}/import`;

export const importsApi = {
  junit: (
    projectId: string,
    input: { xml: string; environment: string; name?: string },
  ) =>
    client
      .post<TestRun>(`${BASE(projectId)}/junit`, input)
      .then((response) => response.data),
  allure: (
    projectId: string,
    input: { results: AllureResultItem[]; environment: string; name?: string },
  ) =>
    client
      .post<TestRun>(`${BASE(projectId)}/allure`, input)
      .then((response) => response.data),
};
