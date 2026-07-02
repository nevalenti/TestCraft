import { ArrowPathIcon } from "@heroicons/react/24/outline";

export const RootError = ({ error }: { error: Error }) => (
  <div className="flex flex-1 items-center justify-center p-8">
    <div className="text-center">
      <p className="mb-2 font-semibold text-error">Something went wrong</p>
      <p className="mx-auto mb-4 max-w-sm text-sm text-base-content/80">
        {error.message}
      </p>
      <button
        className="btn rounded-full btn-sm btn-primary"
        onClick={() => location.reload()}
      >
        <ArrowPathIcon className="size-4" />
        Reload page
      </button>
    </div>
  </div>
);
