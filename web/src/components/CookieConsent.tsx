import { ShieldCheckIcon } from "@heroicons/react/24/solid";

import { useCookieConsent } from "@/hooks/useCookieConsent";

export const CookieConsent = () => {
  const { isShowing, accept, decline } = useCookieConsent();

  if (!isShowing) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 md:pb-20 sm:pb-12"
    >
      <div className="bg-base-200 border-border w-full max-w-2xl border rounded-lg shadow-2xl">
        <div className="p-5 flex items-center gap-6">
          <div className="flex gap-3 flex-1 min-w-0">
            <ShieldCheckIcon
              className="text-primary size-5 shrink-0 mt-0.5"
              aria-hidden="true"
            />
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
