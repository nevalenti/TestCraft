import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@/auth/keycloak", () => ({
  default: { tokenParsed: {}, logout: vi.fn() },
}));

vi.mock("@/hooks/useAccount", () => ({
  useAvatarUrl: vi.fn(() => ({ data: undefined })),
}));

import keycloak from "@/auth/keycloak";
import { useAvatarUrl } from "@/hooks/useAccount";
import { AccountMenu } from "@/layout/AccountMenu";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(keycloak).tokenParsed = {};
  vi.mocked(useAvatarUrl).mockReturnValue({ data: undefined } as any);
});

describe("AccountMenu", () => {
  describe("given a token with a full name", () => {
    it("shows the initials from both first and last name", () => {
      vi.mocked(keycloak).tokenParsed = { name: "Ada Lovelace" };
      render(<AccountMenu />);

      expect(screen.getAllByText("AL")[0]).toBeInTheDocument();
    });

    it("shows only the first name in the collapsed trigger", () => {
      vi.mocked(keycloak).tokenParsed = { name: "Ada Lovelace" };
      render(<AccountMenu />);

      expect(screen.getByText("Ada")).toBeInTheDocument();
    });

    it("shows the full name in the dropdown panel", () => {
      vi.mocked(keycloak).tokenParsed = { name: "Ada Lovelace" };
      render(<AccountMenu />);

      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });
  });

  describe("given a token with no name but a preferred_username", () => {
    it("falls back to the preferred_username as the display name", () => {
      vi.mocked(keycloak).tokenParsed = { preferred_username: "ada" };
      render(<AccountMenu />);

      expect(screen.getAllByText("ada")[0]).toBeInTheDocument();
    });
  });

  describe("given no name and no preferred_username", () => {
    it("renders no display name or account button", () => {
      vi.mocked(keycloak).tokenParsed = {};
      render(<AccountMenu />);

      expect(
        screen.queryByRole("button", { name: /ada/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("given an avatar url is available", () => {
    it("renders an avatar image instead of the initials fallback", () => {
      vi.mocked(keycloak).tokenParsed = { name: "Ada Lovelace" };
      vi.mocked(useAvatarUrl).mockReturnValue({
        data: { url: "https://cdn.example.com/a.png" },
      } as any);
      render(<AccountMenu />);

      const images = screen.getAllByAltText("Avatar");
      expect(images[0]).toHaveAttribute("src", "https://cdn.example.com/a.png");
    });
  });

  describe("when the profile row is clicked", () => {
    it("navigates to the account page", async () => {
      vi.mocked(keycloak).tokenParsed = { name: "Ada Lovelace" };
      render(<AccountMenu />);

      await userEvent.click(screen.getByText("Ada Lovelace"));

      expect(navigate).toHaveBeenCalledWith({ to: "/account" });
    });
  });

  describe("when Sign out is clicked", () => {
    it("calls keycloak.logout with a redirect to the origin", async () => {
      render(<AccountMenu />);

      await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

      expect(keycloak.logout).toHaveBeenCalledWith({
        redirectUri: `${location.origin}/`,
      });
    });
  });
});
