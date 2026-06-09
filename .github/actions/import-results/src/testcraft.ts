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
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ xml, environment: "ci", name, source }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Import failed: ${response.status} ${response.statusText}\n${body}`,
    );
  }
};
