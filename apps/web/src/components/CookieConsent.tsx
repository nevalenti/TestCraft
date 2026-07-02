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
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 sm:pb-12 md:pb-20"
    >
      <div className="w-full max-w-2xl rounded-lg border border-border bg-base-200 shadow-2xl">
        <div className="flex items-center gap-6 p-5">
          <div className="flex min-w-0 flex-1 gap-3">
            <ShieldCheckIcon
              className="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-sm font-semibold">We use cookies</p>
              <p className="text-xs leading-relaxed text-base-content/90">
                We use cookies to enhance your browsing experience and analyse
                our traffic.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={decline} className="btn btn-ghost btn-sm">
              Decline
            </button>
            <button onClick={accept} className="btn btn-sm btn-primary">
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
