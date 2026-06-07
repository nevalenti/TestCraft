import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  message = "Please check your connection and try again.",
  onRetry = () => globalThis.location.reload(),
}: Props) => (
  <div className="flex flex-1 items-center justify-center p-8">
    <div className="text-center">
      <p className="mb-2 font-semibold text-error">Failed to load</p>
      <p className="mb-4 text-sm text-base-content/60">{message}</p>
      <button className="btn rounded-full btn-sm btn-primary" onClick={onRetry}>
        <ArrowPathIcon className="size-4" />
        Retry
      </button>
    </div>
  </div>
);
