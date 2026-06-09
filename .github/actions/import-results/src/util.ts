export const fetchAuthority = async (apiUrl: string): Promise<string> => {
  const response = await fetch(`${apiUrl}/api/auth-config`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch auth config: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as { authority: string };

  return data.authority;
};

export const findProjectId = async (
  apiUrl: string,
  token: string,
  projectName: string,
): Promise<string> => {
  const url = new URL(`${apiUrl}/api/v1/projects`);
  url.searchParams.set("search", projectName);
  url.searchParams.set("pageSize", "500");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch projects: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    items: { id: string; name: string }[];
  };
  const project = data.items.find((p) => p.name === projectName);

  if (!project) {
    throw new Error(`Project "${projectName}" not found`);
  }

  return project.id;
};
