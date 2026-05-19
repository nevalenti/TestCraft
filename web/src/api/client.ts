import axios from "axios";

import { useNotificationsStore } from "@/stores/notifications";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ??
      error.response?.data?.title ??
      error.message ??
      "An unexpected error occurred.";

    useNotificationsStore
      .getState()
      .add({ type: "error", message, timeout: 5000 });

    return Promise.reject(error);
  },
);

export default client;
