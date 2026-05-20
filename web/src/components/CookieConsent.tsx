import { useCookieConsent } from "@/hooks/useCookieConsent";

export const CookieConsent = () => {
  const { isShowing, accept, decline } = useCookieConsent();

  if (!isShowing) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4">
      <div className="bg-base-200 border-border w-full max-w-2xl border shadow-2xl">
        <div className="p-5 flex items-center gap-6">
          <div className="flex gap-3 flex-1 min-w-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary size-5 shrink-0 mt-0.5"
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
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-sm font-semibold">We use cookies</p>
              <p className="text-xs text-base-content/75 leading-relaxed">
                We use cookies to enhance your browsing experience and analyse
                our traffic.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
