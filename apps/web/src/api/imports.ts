import type { AllureResultItem, TestRun } from '@testcraft/types';

import client from '@/api/client';

const BASE = (projectId: string) => `projects/${projectId}/import`;

export const importsApi = {
  junit: async (
    projectId: string,
    input: { xml: string; environment: string; name?: string },
  ) => {
    const { data } = await client.post<TestRun>(
      `${BASE(projectId)}/junit`,
      input,
    );
    return data;
  },
  allure: async (
    projectId: string,
    input: { results: AllureResultItem[]; environment: string; name?: string },
  ) => {
    const { data } = await client.post<TestRun>(
      `${BASE(projectId)}/allure`,
      input,
    );
    return data;
  },
};
