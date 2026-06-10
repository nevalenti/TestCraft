import { assertOk, authHeaders } from "./http";

export const importResults = async (
  apiUrl: string,
  projectId: string,
  token: string,
  name: string,
  xml: string,
  source?: string,
): Promise<void> => {
  const response = await fetch(
    `${apiUrl}/api/v1/projects/${projectId}/import/junit`,
    {
      method: "POST",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ xml, environment: "ci", name, source }),
    },
  );

  await assertOk(response, "Import failed");
};
