import { create } from 'zustand';

import { getCookie, setCookie } from '@/lib/cookie';

const CONSENT_KEY = 'cookies-consent';

const resolveConsent = (): boolean | null => {
  const stored = getCookie(CONSENT_KEY);

  if (!stored) return null;

  try {
    return JSON.parse(stored) === true;
  } catch {
    return null;
  }
};

interface CookieConsentState {
  consent: boolean | null;
  accept: () => void;
  decline: () => void;
}

export const useCookieConsentStore = create<CookieConsentState>((set) => ({
  consent: resolveConsent(),
  accept: () => {
    setCookie(CONSENT_KEY, 'true');
    set({ consent: true });
  },
  decline: () => {
    setCookie(CONSENT_KEY, 'false');
    set({ consent: false });
  },
}));
