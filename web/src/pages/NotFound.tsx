import { ArrowLeftIcon, HomeIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router";

export const NotFound = () => {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="text-center">
        <div className="relative mb-8">
          <h1 className="text-base-content/15 text-[160px] leading-none font-black select-none">
            404
          </h1>
        </div>
        <h2 className="text-base-content mb-4 text-4xl font-bold">
          Page Not Found
        </h2>
        <p className="text-base-content/80 mx-auto mb-8 max-w-md text-lg">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link to="/" className="btn btn-ghost btn-sm gap-2">
            <HomeIcon className="size-5" aria-hidden="true" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn btn-ghost btn-sm gap-2"
          >
            <ArrowLeftIcon className="size-5" aria-hidden="true" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
