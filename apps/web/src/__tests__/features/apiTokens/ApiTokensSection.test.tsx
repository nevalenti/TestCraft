import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

vi.mock("@/features/apiTokens/hooks", () => ({
  useApiTokens: vi.fn(),
  useCreateApiToken: vi.fn(),
  useRevokeApiToken: vi.fn(),
}));

import { ApiTokensSection } from "@/features/apiTokens/ApiTokensSection";
import {
  useApiTokens,
  useCreateApiToken,
  useRevokeApiToken,
} from "@/features/apiTokens/hooks";

const makeToken = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "t1",
  name: "CI pipeline",
  created_at: "2026-01-10T00:00:00Z",
  last_used_at: null,
  expires_at: null,
  is_revoked: false,
  scopes: ["runs_write"],
  ...overrides,
});

const openCreateModal = async () => {
  await userEvent.click(screen.getByRole("button", { name: /new token/i }));
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
  vi.mocked(useApiTokens).mockReturnValue({
    data: [],
    isError: false,
    error: null,
  } as never);
  vi.mocked(useCreateApiToken).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
  vi.mocked(useRevokeApiToken).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
});

describe("ApiTokensSection", () => {
  describe("given an error loading tokens — shows the error state", () => {
    it("renders the failure message", () => {
      vi.mocked(useApiTokens).mockReturnValue({
        data: undefined,
        isError: true,
        error: new Error("boom"),
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);
      expect(screen.getByText("Failed to load API tokens")).toBeInTheDocument();
    });
  });

  describe("given existing tokens — lists them", () => {
    it("shows the token name and creation date", () => {
      vi.mocked(useApiTokens).mockReturnValue({
        data: [makeToken({ name: "CI pipeline" })],
        isError: false,
        error: null,
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);
      expect(screen.getByText("CI pipeline")).toBeInTheDocument();
      expect(screen.getByText(/Created/)).toBeInTheDocument();
    });

    it("shows an Active status pill for a live token", () => {
      vi.mocked(useApiTokens).mockReturnValue({
        data: [makeToken()],
        isError: false,
        error: null,
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("hides the revoke button and shows a Revoked pill for an already-revoked token", () => {
      vi.mocked(useApiTokens).mockReturnValue({
        data: [makeToken({ is_revoked: true })],
        isError: false,
        error: null,
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);
      expect(
        screen.queryByRole("button", { name: /revoke token/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Revoked")).toBeInTheDocument();
    });
  });

  describe("given the create form is submitted — creates a token", () => {
    it("calls the mutation with the name and expiry", async () => {
      const mutate = vi.fn();
      vi.mocked(useCreateApiToken).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);

      await openCreateModal();
      await userEvent.type(
        screen.getByPlaceholderText("e.g. CI pipeline"),
        "CI pipeline",
      );
      await userEvent.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() =>
        expect(mutate).toHaveBeenCalledWith(
          {
            name: "CI pipeline",
            expires_at: undefined,
            scopes: ["runs_write", "results_write", "imports_write"],
          },
          expect.objectContaining({ onSuccess: expect.any(Function) }),
        ),
      );
    });

    it("sends the access chosen for each area as scopes", async () => {
      const mutate = vi.fn();
      vi.mocked(useCreateApiToken).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);

      await openCreateModal();
      await userEvent.type(
        screen.getByPlaceholderText("e.g. CI pipeline"),
        "Dashboard reader",
      );
      await userEvent.selectOptions(
        screen.getByLabelText("Test runs access"),
        "read",
      );
      await userEvent.selectOptions(
        screen.getByLabelText("Test results access"),
        "none",
      );
      await userEvent.selectOptions(
        screen.getByLabelText("Imports access"),
        "none",
      );
      await userEvent.selectOptions(
        screen.getByLabelText("Analytics access"),
        "read",
      );
      await userEvent.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() =>
        expect(mutate).toHaveBeenCalledWith(
          expect.objectContaining({ scopes: ["runs_read", "analytics_read"] }),
          expect.anything(),
        ),
      );
    });

    it("refuses a token with no access at all", async () => {
      const mutate = vi.fn();
      vi.mocked(useCreateApiToken).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);

      await openCreateModal();
      await userEvent.type(
        screen.getByPlaceholderText("e.g. CI pipeline"),
        "Useless",
      );
      for (const area of ["Test runs", "Test results", "Imports"])
        await userEvent.selectOptions(
          screen.getByLabelText(`${area} access`),
          "none",
        );
      await userEvent.click(screen.getByRole("button", { name: /^create$/i }));

      expect(
        await screen.findByText("Give the token access to at least one area"),
      ).toBeInTheDocument();
      expect(mutate).not.toHaveBeenCalled();
    });

    it("reveals the new token and copies it to the clipboard", async () => {
      const mutate = vi.fn((_input, opts) =>
        opts.onSuccess({ id: "t1", name: "CI pipeline", token: "secret-abc" }),
      );
      vi.mocked(useCreateApiToken).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);

      await openCreateModal();
      await userEvent.type(
        screen.getByPlaceholderText("e.g. CI pipeline"),
        "CI pipeline",
      );
      await userEvent.click(screen.getByRole("button", { name: /^create$/i }));

      const tokenInput = await screen.findByDisplayValue("secret-abc");
      expect(tokenInput).toHaveAttribute("type", "password");

      const copyButton = screen.getByRole("button", { name: /^copy$/i });
      await userEvent.click(
        screen.getByRole("button", { name: /reveal token/i }),
      );
      expect(tokenInput).toHaveAttribute("type", "text");

      await userEvent.click(copyButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("secret-abc");
    });
  });

  describe("given Revoke is clicked — revokes the token", () => {
    it("calls the mutation with the token id", async () => {
      const mutate = vi.fn();
      vi.mocked(useApiTokens).mockReturnValue({
        data: [makeToken({ id: "t1" })],
        isError: false,
        error: null,
      } as never);
      vi.mocked(useRevokeApiToken).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<ApiTokensSection projectId="proj-1" />);

      await userEvent.click(
        screen.getByRole("button", { name: /revoke token/i }),
      );

      expect(mutate).toHaveBeenCalledWith("t1");
    });
  });
});
