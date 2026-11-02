import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth/keycloak", () => ({
  keycloak: { init: vi.fn(), subject: "user-1" },
}));

vi.mock("@/lib/errorReporting", () => ({
  reportError: vi.fn(),
  setReportingUser: vi.fn(),
}));

import { AuthProvider } from "@/auth/AuthProvider";
import { keycloak } from "@/auth/keycloak";
import { reportError, setReportingUser } from "@/lib/errorReporting";

beforeEach(() => {
  vi.clearAllMocks();
  history.pushState({}, "", "/");
});

describe("AuthProvider", () => {
  describe("while keycloak is initializing", () => {
    it("shows a loading spinner instead of the children", () => {
      vi.mocked(keycloak.init).mockReturnValue(new Promise(() => {}));
      render(
        <AuthProvider>
          <p>Protected content</p>
        </AuthProvider>,
      );

      expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    });
  });

  describe("given a non-share route", () => {
    it("initializes keycloak with login-required", () => {
      vi.mocked(keycloak.init).mockReturnValue(new Promise(() => {}));
      render(
        <AuthProvider>
          <p>Protected content</p>
        </AuthProvider>,
      );

      expect(keycloak.init).toHaveBeenCalledWith(
        expect.objectContaining({ onLoad: "login-required" }),
      );
    });
  });

  describe("given a public share route", () => {
    it("initializes keycloak with check-sso instead of forcing a login", () => {
      history.pushState({}, "", "/share/abc123");
      vi.mocked(keycloak.init).mockReturnValue(new Promise(() => {}));
      render(
        <AuthProvider>
          <p>Protected content</p>
        </AuthProvider>,
      );

      expect(keycloak.init).toHaveBeenCalledWith(
        expect.objectContaining({ onLoad: "check-sso" }),
      );
    });
  });

  describe("once keycloak initializes successfully", () => {
    it("renders the children", async () => {
      vi.mocked(keycloak.init).mockResolvedValue(true);
      render(
        <AuthProvider>
          <p>Protected content</p>
        </AuthProvider>,
      );

      await waitFor(() =>
        expect(screen.getByText("Protected content")).toBeInTheDocument(),
      );
      expect(setReportingUser).toHaveBeenCalledWith("user-1");
    });
  });

  describe("when keycloak initialization fails", () => {
    it("shows a readable message when it rejects with a non-Error value", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(keycloak.init).mockRejectedValue({ error: "timeout" });
      render(
        <AuthProvider>
          <p>Protected content</p>
        </AuthProvider>,
      );

      expect(
        await screen.findByText("Could not reach the sign-in service."),
      ).toBeInTheDocument();
      expect(screen.queryByText("[object Object]")).not.toBeInTheDocument();
      expect(reportError).toHaveBeenCalledWith({ error: "timeout" });
    });

    it("shows an error message instead of the children", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(keycloak.init).mockRejectedValue(new Error("network down"));
      render(
        <AuthProvider>
          <p>Protected content</p>
        </AuthProvider>,
      );

      await waitFor(() =>
        expect(
          screen.getByText("Auth initialisation failed"),
        ).toBeInTheDocument(),
      );
      expect(screen.getByText("network down")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
      expect(reportError).toHaveBeenCalledWith(new Error("network down"));
      expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
      expect(consoleError).toHaveBeenCalledWith(
        "Keycloak init failed:",
        new Error("network down"),
      );
      consoleError.mockRestore();
    });
  });
});
