import { MapIcon } from "@heroicons/react/24/outline";
import { ArrowLeftIcon, HomeIcon } from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";

import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";

export const NotFound = () => {
  useBreadcrumbs([{ label: "Not found" }]);

  return (
    <div className="flex min-h-[60vh] w-full flex-1 items-center justify-center px-6 py-16">
      <div className="flex max-w-sm flex-col items-center text-center">
        <span className="card-bg-primary mb-4 flex size-12 items-center justify-center rounded-2xl border text-primary">
          <MapIcon className="size-6" aria-hidden="true" />
        </span>
        <p className="text-xs font-semibold tracking-wider text-fg-subtle uppercase">
          Error 404
        </p>
        <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-base-content">
          Page not found
        </h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/" className="btn btn-sm btn-primary">
            <HomeIcon className="size-4" aria-hidden="true" />
            Go to dashboard
          </Link>
          <button
            type="button"
            onClick={() => history.back()}
            className="btn btn-ghost btn-sm"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
};
