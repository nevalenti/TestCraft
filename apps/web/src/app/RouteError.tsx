import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { useEffect } from "react";

import { NotFound } from "@/app/NotFound";
import { ErrorState } from "@/components/ui/ErrorState";
import { reportError } from "@/lib/errorReporting";

export const RouteError = ({ error, reset }: ErrorComponentProps) => {
  const router = useRouter();
  const isApiError = isAxiosError(error);

  useEffect(() => {
    if (!isApiError) reportError(error);
  }, [error, isApiError]);

  if (isApiError && error.response?.status === 404) return <NotFound />;

  return (
    <ErrorState
      title="Something went wrong"
      error={error}
      message={
        !isApiError && error instanceof Error ? error.message : undefined
      }
      onRetry={() => {
        reset();
        return router.invalidate();
      }}
    />
  );
};
