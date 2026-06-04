import { ArrowPathIcon } from "@heroicons/react/24/outline";

export const RootError = ({ error }: { error: Error }) => (
  <div className="flex flex-1 items-center justify-center p-8">
    <div className="text-center">
      <p className="text-error font-semibold mb-2">Something went wrong</p>
      <p className="text-base-content/65 text-sm mb-4 max-w-sm mx-auto">
        {error.message}
      </p>
      <button
        className="btn btn-primary btn-sm rounded-full"
        onClick={() => window.location.reload()}
      >
        <ArrowPathIcon className="w-4 h-4" />
        Reload page
      </button>
    </div>
  </div>
);
