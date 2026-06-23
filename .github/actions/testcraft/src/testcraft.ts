import { readFileSync } from "node:fs";
import { assertOk, authHeaders, fetchJson } from "./http";

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

export const createRun = async (
  apiUrl: string,
  projectId: string,
  token: string,
  name: string,
  environment: string,
  source?: string,
): Promise<{ id: string }> => {
  const response = await fetch(`${apiUrl}/api/v1/projects/${projectId}/runs`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ name, environment, source }),
  });
  await assertOk(response, "Failed to create run");
  return (await response.json()) as { id: string };
};

export const importResults = async (
  apiUrl: string,
  projectId: string,
  token: string,
  name: string,
  xml: string,
  source?: string,
  runId?: string,
): Promise<ImportJobResponse> => {
  const response = await fetch(
    `${apiUrl}/api/v1/projects/${projectId}/import/junit`,
    {
      method: "POST",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ xml, environment: "ci", name, source, runId }),
    },
  );
  await assertOk(response, "Import failed");
  return (await response.json()) as ImportJobResponse;
};

export const pollJob = async (
  apiUrl: string,
  projectId: string,
  jobId: string,
  token: string,
): Promise<string | null> => {
  for (let i = 0; i < 30; i++) {
    const job = await fetchJson<ImportJobResponse>(
      `${apiUrl}/api/v1/projects/${projectId}/import/${jobId}`,
      { headers: authHeaders(token) },
      "Failed to poll import job",
    );
    if (job.status === "Completed") return job.testRunId ?? null;
    if (job.status === "Failed")
      throw new Error(`Import job failed: ${job.error}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Import job timed out after 60 s");
};

export const fetchAllResults = async (
  apiUrl: string,
  projectId: string,
  runId: string,
  token: string,
): Promise<TestResultSummary[]> => {
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
  apiUrl: string,
  projectId: string,
  runId: string,
  resultId: string,
  token: string,
  filePath: string,
  fileName: string,
): Promise<void> => {
  const content = readFileSync(filePath);
  const form = new FormData();
  form.append("file", new Blob([content], { type: "image/png" }), fileName);
  const response = await fetch(
    `${apiUrl}/api/v1/projects/${projectId}/runs/${runId}/results/${resultId}/attachments`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: form,
    },
  );
  await assertOk(response, `Failed to upload ${fileName}`);
};
