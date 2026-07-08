import { readFileSync } from "node:fs";
import { assertOk, authHeaders, fetchJson, fetchWithRetry } from "./http";

interface ImportJobResponse {
  id: string;
  projectId: string;
  status: string;
  testRunId?: string;
  error?: string;
}

interface TestResultSummary {
  id: string;
  testCaseName: string;
  status: string;
}

export interface ApiContext {
  apiUrl: string;
  projectId: string;
  token: string;
}

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 30;

export const createRun = async (
  ctx: ApiContext,
  name: string,
  environment: string,
  source?: string,
): Promise<{ id: string }> => {
  const { apiUrl, projectId, token } = ctx;
  const response = await fetchWithRetry(
    `${apiUrl}/api/v1/projects/${projectId}/runs`,
    {
      method: "POST",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ name, environment, source }),
    },
    "Failed to create run",
  );
  await assertOk(response, "Failed to create run");
  return (await response.json()) as { id: string };
};

export const appendLogs = async (
  ctx: ApiContext,
  runId: string,
  lines: string[],
): Promise<void> => {
  const { apiUrl, projectId, token } = ctx;
  const response = await fetchWithRetry(
    `${apiUrl}/api/v1/projects/${projectId}/runs/${runId}/logs`,
    {
      method: "POST",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
    },
    "Failed to append logs",
  );
  await assertOk(response, "Failed to append logs");
};

export const importResults = async (
  ctx: ApiContext,
  name: string,
  xml: string,
  source?: string,
  runId?: string,
): Promise<ImportJobResponse> => {
  const { apiUrl, projectId, token } = ctx;
  const response = await fetchWithRetry(
    `${apiUrl}/api/v1/projects/${projectId}/import/junit`,
    {
      method: "POST",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ xml, environment: "ci", name, source, runId }),
    },
    "Import failed",
  );
  await assertOk(response, "Import failed");
  return (await response.json()) as ImportJobResponse;
};

export const pollJob = async (
  ctx: ApiContext,
  jobId: string,
): Promise<string | null> => {
  const { apiUrl, projectId, token } = ctx;
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const job = await fetchJson<ImportJobResponse>(
      `${apiUrl}/api/v1/projects/${projectId}/import/${jobId}`,
      { headers: authHeaders(token) },
      "Failed to poll import job",
    );
    if (job.status === "Completed") return job.testRunId ?? null;
    if (job.status === "Failed")
      throw new Error(`Import job failed: ${job.error}`);
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(
    `Import job timed out after ${(POLL_MAX_ATTEMPTS * POLL_INTERVAL_MS) / 1000} s`,
  );
};

export const fetchAllResults = async (
  ctx: ApiContext,
  runId: string,
): Promise<TestResultSummary[]> => {
  const { apiUrl, projectId, token } = ctx;
  const url = new URL(
    `${apiUrl}/api/v1/projects/${projectId}/runs/${runId}/results`,
  );
  url.searchParams.set("pageSize", "500");
  const data = await fetchJson<{ items: TestResultSummary[] }>(
    url,
    { headers: authHeaders(token) },
    "Failed to fetch test results",
  );
  return data.items;
};

export const uploadAttachment = async (
  ctx: ApiContext,
  runId: string,
  resultId: string,
  filePath: string,
  fileName: string,
): Promise<void> => {
  const { apiUrl, projectId, token } = ctx;
  const content = readFileSync(filePath);
  const form = new FormData();
  form.append("file", new Blob([content], { type: "image/png" }), fileName);
  const response = await fetchWithRetry(
    `${apiUrl}/api/v1/projects/${projectId}/runs/${runId}/results/${resultId}/attachments`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: form,
    },
    `Failed to upload ${fileName}`,
  );
  await assertOk(response, `Failed to upload ${fileName}`);
};
