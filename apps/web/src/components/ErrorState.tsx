import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  message = "Please check your connection and try again.",
  onRetry = () => window.location.reload(),
}: Props) => (
  <div className="flex flex-1 items-center justify-center p-8">
    <div className="text-center">
      <p className="text-error font-semibold mb-2">Failed to load</p>
      <p className="text-base-content/60 text-sm mb-4">{message}</p>
      <button className="btn btn-primary btn-sm rounded-full" onClick={onRetry}>
        <ArrowPathIcon className="w-4 h-4" />
        Retry
      </button>
    </div>
  </div>
);
