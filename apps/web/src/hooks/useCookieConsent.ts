import { useState } from "react";

import { getCookie, setCookie } from "@/lib/cookie";

const CONSENT_KEY = "cookies-consent";

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<boolean | null>(() => {
    const stored = getCookie(CONSENT_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) === true;
    } catch {
      return null;
    }
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
