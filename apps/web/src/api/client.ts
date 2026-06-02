import axios from "axios";

import keycloak from "@/auth/keycloak";
import { useNotificationsStore } from "@/stores/notifications";

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ""}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30);
    } catch {
      keycloak.login();
    }
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.method !== "get") {
      const message =
        error.response?.data?.detail ??
        error.response?.data?.title ??
        error.message ??
        "An unexpected error occurred.";

      useNotificationsStore
        .getState()
        .add({ type: "error", message, timeout: 10000 });
    }

    return Promise.reject(error);
  },
);

export default client;
