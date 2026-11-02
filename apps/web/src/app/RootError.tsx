import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";

import { reportError } from "@/lib/errorReporting";

export const RootError = ({ error }: Pick<ErrorComponentProps, "error">) => {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <p className="mb-2 font-semibold text-error">Something went wrong</p>
        <p className="mx-auto mb-4 max-w-sm text-sm text-fg-secondary">
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred"}
        </p>
        <button
          className="btn rounded-full btn-sm btn-primary"
          onClick={() => location.reload()}
        >
          <ArrowPathIcon className="size-4" aria-hidden="true" />
          Reload page
        </button>
      </div>
    </div>
  );
};
