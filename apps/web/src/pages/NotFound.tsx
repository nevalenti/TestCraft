import { ArrowLeftIcon, HomeIcon } from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";

import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";

export const NotFound = () => {
  useBreadcrumbs([]);

  return (
    <div className="flex h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="relative mb-8">
          <h1 className="text-[160px] leading-none font-black text-base-content/30 select-none">
            404
          </h1>
        </div>
        <h2 className="mb-4 text-4xl font-bold text-base-content">
          Page Not Found
        </h2>
        <p className="mx-auto mb-8 max-w-md text-lg text-base-content/90">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link to="/" className="btn gap-1.5 btn-ghost btn-sm">
            <HomeIcon className="size-4" aria-hidden="true" />
            Go Home
          </Link>
          <button
            onClick={() => history.back()}
            className="btn gap-1.5 btn-ghost btn-sm"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
