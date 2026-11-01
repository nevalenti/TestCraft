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

vi.mock("@/features/notifications/hooks", () => ({
  useEmails: vi.fn(),
  useCreateEmail: vi.fn(),
  useDeleteEmail: vi.fn(),
}));

import { EmailsSection } from "@/features/notifications/EmailsSection";
import {
  useCreateEmail,
  useDeleteEmail,
  useEmails,
} from "@/features/notifications/hooks";
import { AVAILABLE_EVENTS } from "@/features/notifications/notificationEvents";

const makeSub = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "e1",
  email: "alerts@example.com",
  events: AVAILABLE_EVENTS,
  ...overrides,
});

const openCreateModal = async () => {
  await userEvent.click(screen.getByRole("button", { name: /new email/i }));
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useEmails).mockReturnValue({
    data: [],
    isError: false,
    error: null,
  } as never);
  vi.mocked(useCreateEmail).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
  vi.mocked(useDeleteEmail).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
});

describe("EmailsSection", () => {
  describe("given an error loading subscriptions — shows the error state", () => {
    it("renders the failure message", () => {
      vi.mocked(useEmails).mockReturnValue({
        data: undefined,
        isError: true,
        error: new Error("boom"),
      } as never);
      render(<EmailsSection projectId="proj-1" />);
      expect(
        screen.getByText("Failed to load email subscriptions"),
      ).toBeInTheDocument();
    });
  });

  describe("given existing subscriptions — lists them", () => {
    it("shows the subscribed email address", () => {
      vi.mocked(useEmails).mockReturnValue({
        data: [makeSub()],
        isError: false,
        error: null,
      } as never);
      render(<EmailsSection projectId="proj-1" />);
      expect(screen.getByText("alerts@example.com")).toBeInTheDocument();
    });
  });

  describe("given the create modal is opened — Add Email requires an email", () => {
    it("shows a validation error when submitted with no email", async () => {
      render(<EmailsSection projectId="proj-1" />);
      await openCreateModal();

      await userEvent.click(screen.getByRole("button", { name: /add email/i }));

      expect(await screen.findByText("Email is required")).toBeInTheDocument();
    });
  });

  describe("given an email and at least one event — Add Email creates it", () => {
    it("calls the mutation with the email and selected events", async () => {
      const mutate = vi.fn();
      vi.mocked(useCreateEmail).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<EmailsSection projectId="proj-1" />);
      await openCreateModal();

      await userEvent.type(
        screen.getByPlaceholderText("alerts@example.com"),
        "me@example.com",
      );
      await userEvent.click(screen.getByRole("button", { name: /add email/i }));

      await waitFor(() =>
        expect(mutate).toHaveBeenCalledWith(
          { email: "me@example.com", events: AVAILABLE_EVENTS },
          expect.objectContaining({ onSuccess: expect.any(Function) }),
        ),
      );
    });
  });

  describe("given Delete is clicked on a subscription — removes it", () => {
    it("calls the mutation with the subscription id", async () => {
      const mutate = vi.fn();
      vi.mocked(useEmails).mockReturnValue({
        data: [makeSub({ id: "e1", email: "a@example.com" })],
        isError: false,
        error: null,
      } as never);
      vi.mocked(useDeleteEmail).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<EmailsSection projectId="proj-1" />);

      await userEvent.click(
        screen.getByRole("button", { name: /delete email subscription/i }),
      );

      expect(mutate).toHaveBeenCalledWith("e1");
    });
  });
});
