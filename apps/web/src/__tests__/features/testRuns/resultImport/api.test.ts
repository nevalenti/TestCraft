import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  importJunit: vi.fn(),
  importAllure: vi.fn(),
  getImportJob: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { importsApi } from "@/features/testRuns/resultImport/api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("importsApi", () => {
  it("junit posts the report to the junit endpoint", async () => {
    vi.mocked(sdk.importJunit).mockResolvedValue({
      data: { id: "run1" },
    } as never);
    const input = { xml: "<xml/>", environment: "ci" };

    await importsApi.junit("p1", input);

    expect(sdk.importJunit).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      body: input,
    });
  });

  it("allure posts the results to the allure endpoint", async () => {
    vi.mocked(sdk.importAllure).mockResolvedValue({
      data: { id: "run2" },
    } as never);
    const input = { results: [], environment: "ci" };

    await importsApi.allure("p1", input);

    expect(sdk.importAllure).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      body: input,
    });
  });

  it("getJob fetches the import job by id", async () => {
    vi.mocked(sdk.getImportJob).mockResolvedValue({
      data: { id: "job1", status: "completed" },
    } as never);

    await importsApi.getJob("p1", "job1");

    expect(sdk.getImportJob).toHaveBeenCalledWith({
      path: { project_id: "p1", job_id: "job1" },
    });
  });
});
