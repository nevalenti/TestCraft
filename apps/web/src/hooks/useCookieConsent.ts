import { useCookieConsentStore } from "@/stores/cookieConsent";

export const useCookieConsent = () => {
  const consent = useCookieConsentStore((store) => store.consent);
  const accept = useCookieConsentStore((store) => store.accept);
  const decline = useCookieConsentStore((store) => store.decline);

  return { consent, isShowing: consent === null, accept, decline };
};
