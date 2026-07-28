import { authHeaders, fetchJson } from './http';

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const fetchAuthority = async (apiUrl: string): Promise<string> => {
  const data = await fetchJson<{ authority: string }>(
    `${apiUrl}/api/auth-config`,
    {},
    'Failed to fetch auth config',
  );

  return data.authority;
};

export const findProjectId = async (
  apiUrl: string,
  token: string,
  projectName: string,
): Promise<string> => {
  const url = new URL(`${apiUrl}/api/v1/projects`);
  url.searchParams.set('search', projectName);
  url.searchParams.set('pageSize', '500');

  const data = await fetchJson<{ items: { id: string; name: string }[] }>(
    url,
    { headers: authHeaders(token) },
    'Failed to fetch projects',
  );
  const project = data.items.find((item) => item.name === projectName);

  if (!project) {
    throw new Error(`Project "${projectName}" not found`);
  }

  return project.id;
};
