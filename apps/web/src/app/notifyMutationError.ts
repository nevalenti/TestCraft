import { isAxiosError } from "axios";

import type { ProblemDetails } from "@/api/generated/types.gen";
import { useNotificationsStore } from "@/stores/notifications";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: { silentErrors?: boolean };
  }
}

export const notifyMutationError = (error: unknown, isSilent = false) => {
  if (isSilent || !isAxiosError<Partial<ProblemDetails>>(error)) return;

  const problem = error.response?.data;
  const message =
    problem?.detail ??
    problem?.title ??
    error.message ??
    "An unexpected error occurred.";
  const requestId = error.response?.headers?.["x-request-id"];

  useNotificationsStore.getState().add({
    type: "error",
    message: requestId ? `${message} (ref: ${requestId})` : message,
    timeout: 10_000,
  });
};
