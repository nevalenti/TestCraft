import type { Options } from './args';
import { authenticate as fetchAuthToken } from './core/auth';
import * as log from './core/log';
import { ApiContext } from './core/testcraft';
import { fetchAuthority, findProjectId } from './core/util';

const resolveToken = async (opts: Options): Promise<string> => {
  let authority = opts.keycloakAuthority;
  if (!authority) {
    log.info('Fetching auth config…');
    authority = await fetchAuthority(opts.apiUrl);
  }
  log.info('Authenticating with Keycloak…');

  const credentials =
    opts.clientId && opts.clientSecret
      ? { clientId: opts.clientId, clientSecret: opts.clientSecret }
      : { username: opts.username, password: opts.password };

  return fetchAuthToken(authority, credentials);
};

export const buildContext = async (opts: Options): Promise<ApiContext> => {
  const token = await resolveToken(opts);
  log.info(`Resolving project "${opts.projectName}"…`);
  const projectId = await findProjectId(opts.apiUrl, token, opts.projectName);
  return { apiUrl: opts.apiUrl, projectId, token };
};
