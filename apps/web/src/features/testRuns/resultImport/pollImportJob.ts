import type { ImportJobResponse } from "@testcraft/types";

import { importsApi } from "@/features/testRuns/resultImport/api";

const IMPORT_POLL_INTERVAL_MS = 1500;
const IMPORT_POLL_MAX_ATTEMPTS = 20;

export const pollImportJob = async (
  projectId: string,
  job: ImportJobResponse,
): Promise<ImportJobResponse> => {
  let current = job;
  for (let attempt = 0; attempt < IMPORT_POLL_MAX_ATTEMPTS; attempt++) {
    if (current.status === "completed") return current;
    if (current.status === "failed")
      throw new Error(current.error ?? "Test run import failed");
    await new Promise((resolve) =>
      setTimeout(resolve, IMPORT_POLL_INTERVAL_MS),
    );
    try {
      current = await importsApi.getJob(projectId, current.id);
    } catch {
      throw new Error(
        "Could not check the import status. Refresh the runs list in a moment.",
      );
    }
  }
  throw new Error("Test run import timed out");
};
