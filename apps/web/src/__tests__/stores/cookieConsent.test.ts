import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cookie", () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}));

import { getCookie, setCookie } from "@/lib/cookie";

describe("useCookieConsentStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("given no stored cookie — initial consent is null", () => {
    it("resolves consent to null", async () => {
      vi.mocked(getCookie).mockReturnValue(null);
      const { useCookieConsentStore } = await import("@/stores/cookieConsent");

      expect(useCookieConsentStore.getState().consent).toBeNull();
    });
  });

  describe("given a stored 'true' cookie — initial consent is true", () => {
    it("resolves consent to true", async () => {
      vi.mocked(getCookie).mockReturnValue("true");
      const { useCookieConsentStore } = await import("@/stores/cookieConsent");

      expect(useCookieConsentStore.getState().consent).toBe(true);
    });
  });

  describe("given a corrupted stored cookie — falls back to null", () => {
    it("resolves consent to null instead of throwing", async () => {
      vi.mocked(getCookie).mockReturnValue("{not-json");
      const { useCookieConsentStore } = await import("@/stores/cookieConsent");

      expect(useCookieConsentStore.getState().consent).toBeNull();
    });
  });

  describe("accept — sets the cookie and updates state to true", () => {
    it("persists true via setCookie and updates the store", async () => {
      vi.mocked(getCookie).mockReturnValue(null);
      const { useCookieConsentStore } = await import("@/stores/cookieConsent");

      useCookieConsentStore.getState().accept();

      expect(setCookie).toHaveBeenCalledWith("cookies-consent", "true");
      expect(useCookieConsentStore.getState().consent).toBe(true);
    });
  });

  describe("decline — sets the cookie and updates state to false", () => {
    it("persists false via setCookie and updates the store", async () => {
      vi.mocked(getCookie).mockReturnValue(null);
      const { useCookieConsentStore } = await import("@/stores/cookieConsent");

      useCookieConsentStore.getState().decline();

      expect(setCookie).toHaveBeenCalledWith("cookies-consent", "false");
      expect(useCookieConsentStore.getState().consent).toBe(false);
    });
  });
});
