const USER_AGENT = 'TestCraft-CI-Reporter/1.0';

export const authHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  'User-Agent': USER_AGENT,
});

export const assertOk = async (
  response: Response,
  errorContext: string,
): Promise<void> => {
  if (response.ok) {
    return;
  }

  const detail = await response.text();
  throw new Error(
    `${errorContext}: ${response.status} ${response.statusText}${detail ? `\n${detail}` : ''}`,
  );
};

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const fetchWithRetry = async (
  url: string | URL,
  init: RequestInit,
  errorContext: string,
): Promise<Response> => {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await fetch(url, init);
    } catch (error) {
      if (attempt === RETRY_ATTEMPTS) {
        const message = error instanceof Error ? error.message : String(error);
        const cause =
          error instanceof Error && error.cause
            ? ` (${String(error.cause)})`
            : '';
        throw new Error(`${errorContext}: ${message}${cause}`);
      }
      await sleep(RETRY_DELAY_MS * attempt);
    }
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
