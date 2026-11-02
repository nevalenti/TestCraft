import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

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
  if (!axios.isAxiosError<ApiProblem>(error)) return undefined;

  const data = error.response?.data;

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
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex max-w-sm flex-col items-center text-center">
        <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-error/12 text-error">
          <ExclamationTriangleIcon className="size-5" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-fg-secondary">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-fg-muted">
          {displayMessage}
        </p>
        <button className="btn mt-4 btn-outline btn-sm" onClick={onRetry}>
          <ArrowPathIcon className="size-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    </div>
  );
};
