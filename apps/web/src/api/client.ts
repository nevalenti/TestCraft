import axios from 'axios';

import keycloak from '@/auth/keycloak';
import { env } from '@/lib/env';
import { useNotificationsStore } from '@/stores/notifications';

const pageId = crypto.randomUUID();

const client = axios.create({
  baseURL: `${env.VITE_API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'X-Page-Id': pageId,
  },
});

class AuthRedirectError extends Error {}

// eslint-disable-next-line unicorn/no-top-level-side-effects
client.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30);
    } catch {
      keycloak.login();
      throw new AuthRedirectError('Session expired — redirecting to login');
    }
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }

  return config;
});

// eslint-disable-next-line unicorn/no-top-level-side-effects
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error instanceof AuthRedirectError) {
      return Promise.reject(error);
    }

    if (error.config?.method !== 'get') {
      const message =
        error.response?.data?.detail ??
        error.response?.data?.title ??
        error.message ??
        'An unexpected error occurred.';

      const requestId = error.response?.headers?.['x-request-id'];
      const displayMessage = requestId
        ? `${message} (ref: ${requestId})`
        : message;

      useNotificationsStore
        .getState()
        .add({ type: 'error', message: displayMessage, timeout: 10_000 });
    }

    return Promise.reject(error);
  },
);

export default client;
