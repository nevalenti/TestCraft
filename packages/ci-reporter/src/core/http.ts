const USER_AGENT = "TestCraft-CI-Reporter/1.0";

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
  throw new Error(
    `${errorContext}: ${response.status} ${response.statusText}${detail ? `\n${detail}` : ""}`,
  );
};

export const fetchJson = async <T>(
  url: string | URL,
  init: RequestInit,
  errorContext: string,
): Promise<T> => {
  const response = await fetch(url, init);
  await assertOk(response, errorContext);

  return (await response.json()) as T;
};
