import { isAxiosError } from "axios";

export const retryQuery = (failureCount: number, error: unknown) => {
  if (failureCount >= 1) return false;
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return status === undefined || status >= 500;
};
