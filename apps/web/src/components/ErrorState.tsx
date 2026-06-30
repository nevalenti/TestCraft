import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { AxiosError } from "axios";

interface ApiProblem {
  title?: string;
  detail?: string;
}

interface Props {
  title?: string;
  error?: unknown;
  message?: string;
  onRetry?: () => void;
}

const extractMessage = (error: unknown): string | undefined => {
  const data = (error as AxiosError<ApiProblem>)?.response?.data;

  return data?.detail ?? data?.title;
};

export const ErrorState = ({
  title = "Failed to load",
  error,
  message,
  onRetry = () => location.reload(),
}: Props) => {
  const displayMessage =
    message ??
    extractMessage(error) ??
    "Please check your connection and try again.";

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-xs text-center">
        <p className="mb-1.5 text-sm font-semibold text-error">{title}</p>
        <p className="mb-5 text-sm text-base-content/65">{displayMessage}</p>
        <button
          className="btn border border-border btn-ghost btn-sm"
          onClick={onRetry}
        >
          <ArrowPathIcon className="size-4" />
          Retry
        </button>
      </div>
    </div>
  );
};
