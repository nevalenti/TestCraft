import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useCookieConsent } from "@/hooks/useCookieConsent";
import { useCookieConsentStore } from "@/stores/cookieConsent";

const clearConsentCookie = () => {
  document.cookie =
    "cookies-consent=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
  useCookieConsentStore.setState({ consent: null });
};

beforeEach(clearConsentCookie);
afterEach(clearConsentCookie);

describe("useCookieConsent", () => {
  describe("useCookieConsent — given no existing consent cookie — returns null consent", () => {
    it("consent is null", () => {
      const { result } = renderHook(() => useCookieConsent());

      expect(result.current.consent).toBeNull();
    });

    it("isShowing is true", () => {
      const { result } = renderHook(() => useCookieConsent());

      expect(result.current.isShowing).toBe(true);
    });
  });

  describe("useCookieConsent — when accept is called — grants consent", () => {
    it("sets consent to true", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => result.current.accept());
      expect(result.current.consent).toBe(true);
    });

    it("sets isShowing to false", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => result.current.accept());
      expect(result.current.isShowing).toBe(false);
    });

    it("persists the decision so a new hook instance reads true", () => {
      const { result: r1 } = renderHook(() => useCookieConsent());

      act(() => r1.current.accept());

      const { result: r2 } = renderHook(() => useCookieConsent());

      expect(r2.current.consent).toBe(true);
    });
  });

  describe("useCookieConsent — when decline is called — denies consent", () => {
    it("sets consent to false", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => result.current.decline());
      expect(result.current.consent).toBe(false);
    });

    it("sets isShowing to false", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => result.current.decline());
      expect(result.current.isShowing).toBe(false);
    });

    it("persists the decision so a new hook instance reads false", () => {
      const { result: r1 } = renderHook(() => useCookieConsent());

      act(() => r1.current.decline());

      const { result: r2 } = renderHook(() => useCookieConsent());

      expect(r2.current.consent).toBe(false);
    });
  });
});
