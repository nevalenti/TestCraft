import { useState } from "react";

import { getCookie, setCookie } from "@/services/cookie";

const CONSENT_KEY = "cookies-consent";

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<boolean | null>(() => {
    const stored = getCookie(CONSENT_KEY);
    return stored ? (JSON.parse(stored) as boolean) : null;
  });

  const accept = () => {
    setCookie(CONSENT_KEY, "true");
    setConsent(true);
  };

  const decline = () => {
    setCookie(CONSENT_KEY, "false");
    setConsent(false);
  };

  return { consent, isShowing: consent === null, accept, decline };
};
