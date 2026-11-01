import type { AllureResultItem } from "@testcraft/types";

import * as sdk from "@/api/sdk";

export const importsApi = {
  junit: async (
    projectId: string,
    input: { xml: string; environment: string; name?: string },
  ) => {
    const { data } = await sdk.importJunit({
      path: { project_id: projectId },
      body: input,
    });
    return data;
  },
  allure: async (
    projectId: string,
    input: { results: AllureResultItem[]; environment: string; name?: string },
  ) => {
    const { data } = await sdk.importAllure({
      path: { project_id: projectId },
      body: input,
    });
    return data;
  },
  getJob: async (projectId: string, jobId: string) => {
    const { data } = await sdk.getImportJob({
      path: { project_id: projectId, job_id: jobId },
    });
    return data;
  },
};
