import axios from "axios";

import { keycloak } from "@/auth/keycloak";
import { env } from "@/lib/env";
import { reportApiError } from "@/lib/errorReporting";
import { pageId } from "@/lib/pageId";

export const apiClient = axios.create({
  baseURL: `${env.VITE_API_URL}/api/v1`,
  headers: {
    "X-Page-Id": pageId,
  },
});

class AuthRedirectError extends Error {}

const loginRedirect = { isStarted: false };

// eslint-disable-next-line unicorn/no-top-level-side-effects
apiClient.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30);
    } catch {
      if (!loginRedirect.isStarted) {
        loginRedirect.isStarted = true;
        keycloak.login();
      }
      throw new AuthRedirectError("Session expired — redirecting to login");
    }
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }

  return config;
});

// eslint-disable-next-line unicorn/no-top-level-side-effects
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status;
    if (status !== undefined && status >= 500) {
      reportApiError(error, {
        status,
        method: error.config?.method,
        url: error.config?.url,
        requestId: error.response?.headers?.["x-request-id"],
      });
    }

    return Promise.reject(error);
  },
);
