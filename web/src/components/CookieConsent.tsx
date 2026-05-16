import { useCookieConsent } from "@/hooks/useCookieConsent";

export const CookieConsent = () => {
  const { isShowing, accept, decline } = useCookieConsent();

  if (!isShowing) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div className="bg-base-200 border-base-content/10 w-full max-w-360 rounded-2xl border shadow-2xl">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary size-6 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>
            <div className="text-sm">
              <p className="font-semibold">We use cookies</p>
              <p className="text-base-content/60 mt-0.5">
                We use cookies to enhance your browsing experience and analyze
                our traffic.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 self-end sm:self-auto">
            <button onClick={decline} className="btn btn-ghost btn-sm">
              Decline
            </button>
            <button onClick={accept} className="btn btn-primary btn-sm">
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
