import { Link } from "react-router";

export const NotFound = () => {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="text-center">
        <div className="relative mb-8">
          <h1 className="text-base-content/10 text-[160px] leading-none font-black select-none">
            404
          </h1>
        </div>
        <h2 className="text-base-content mb-4 text-4xl font-bold">
          Page Not Found
        </h2>
        <p className="text-base-content/70 mx-auto mb-8 max-w-md text-lg">
          Oops! The page you&apos;re looking for seems to have wandered off into
          the digital void.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link to="/" className="btn btn-ghost gap-2">
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn btn-ghost gap-2"
          >
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0  0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
