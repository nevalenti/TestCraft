import { randomUUID } from "node:crypto";

const USER_AGENT = "TestCraft-CI-Reporter/1.0";
const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";

export const idempotencyKeyHeader = (): Record<string, string> => ({
  [IDEMPOTENCY_KEY_HEADER]: randomUUID(),
});

export const authHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  "User-Agent": USER_AGENT,
});

export const assertOk = async (
  response: Response,
  errorContext: string,
): Promise<void> => {
  if (response.ok) {
    return;
  }

  const detail = await response.text();
  const suffix = detail ? `\n${detail}` : "";
  throw new Error(
    `${errorContext}: ${response.status} ${response.statusText}${suffix}`,
  );
};

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const IN_PROGRESS_STATUS = 409;
const IN_PROGRESS_CODE = "IDEMPOTENT_REQUEST_IN_PROGRESS";

const isSafeToRepeat = (init: RequestInit): boolean =>
  (init.method ?? "GET").toUpperCase() === "GET" ||
  new Headers(init.headers).has(IDEMPOTENCY_KEY_HEADER);

const isStillInProgress = async (response: Response): Promise<boolean> => {
  if (response.status !== IN_PROGRESS_STATUS) {
    return false;
  }
  try {
    const problem = (await response.clone().json()) as { code?: unknown };

    return problem.code === IN_PROGRESS_CODE;
  } catch {
    return false;
  }
};

const isRetryable = async (response: Response): Promise<boolean> =>
  RETRYABLE_STATUSES.has(response.status) || isStillInProgress(response);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const fetchWithRetry = async (
  url: string | URL,
  init: RequestInit,
  errorContext: string,
): Promise<Response> => {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      if (attempt === RETRY_ATTEMPTS) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${errorContext}: ${message}`, { cause: error });
      }
      await sleep(RETRY_DELAY_MS * attempt);
      continue;
    }
    if (
      attempt === RETRY_ATTEMPTS ||
      !isSafeToRepeat(init) ||
      !(await isRetryable(response))
    ) {
      return response;
    }
    await sleep(RETRY_DELAY_MS * attempt);
  }
  throw new Error(errorContext);
};

export const fetchJson = async <T>(
  url: string | URL,
  init: RequestInit,
  errorContext: string,
): Promise<T> => {
  const response = await fetchWithRetry(url, init, errorContext);
  await assertOk(response, errorContext);

  return (await response.json()) as T;
};
