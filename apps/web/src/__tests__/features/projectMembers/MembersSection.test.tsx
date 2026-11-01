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

vi.mock("@/features/projects/permissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/projects/permissions")>()),
  useProjectPermissions: vi.fn().mockReturnValue({
    role: "owner",
    canEdit: true,
    canManage: true,
    isOwner: true,
  }),
}));

vi.mock("@/features/projectMembers/hooks", () => ({
  useProjectMembers: vi.fn(),
  useAddProjectMember: vi.fn(),
  useRemoveProjectMember: vi.fn(),
  useUpdateProjectMemberRole: vi.fn(),
}));

import {
  useAddProjectMember,
  useProjectMembers,
  useRemoveProjectMember,
  useUpdateProjectMemberRole,
} from "@/features/projectMembers/hooks";
import { MembersSection } from "@/features/projectMembers/MembersSection";
import { useProjectPermissions } from "@/features/projects/permissions";

const makeMember = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "m1",
  email: "teammate@example.com",
  display_name: null,
  role: "editor",
  created_at: "2026-01-10T00:00:00Z",
  ...overrides,
});

const openCreateModal = async () => {
  await userEvent.click(screen.getByRole("button", { name: /add member/i }));
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useProjectMembers).mockReturnValue({
    data: [],
    isError: false,
    error: null,
  } as never);
  vi.mocked(useAddProjectMember).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
  vi.mocked(useRemoveProjectMember).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
  vi.mocked(useUpdateProjectMemberRole).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
  asRole("owner");
});

const asRole = (role: "admin" | "owner") =>
  vi.mocked(useProjectPermissions).mockReturnValue({
    role,
    canEdit: true,
    canManage: true,
    isOwner: role === "owner",
  });

describe("MembersSection", () => {
  describe("given an error loading members — shows the error state", () => {
    it("renders the failure message", () => {
      vi.mocked(useProjectMembers).mockReturnValue({
        data: undefined,
        isError: true,
        error: new Error("boom"),
      } as never);
      render(<MembersSection projectId="proj-1" />);
      expect(screen.getByText("Failed to load members")).toBeInTheDocument();
    });
  });

  describe("given existing members — lists them", () => {
    it("shows the display name when set", () => {
      vi.mocked(useProjectMembers).mockReturnValue({
        data: [makeMember({ display_name: "Ada Lovelace" })],
        isError: false,
        error: null,
      } as never);
      render(<MembersSection projectId="proj-1" />);
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });

    it("shows initials in an avatar for each member", () => {
      vi.mocked(useProjectMembers).mockReturnValue({
        data: [makeMember({ display_name: "Ada Lovelace" })],
        isError: false,
        error: null,
      } as never);
      render(<MembersSection projectId="proj-1" />);
      expect(screen.getByText("AL")).toBeInTheDocument();
    });

    it("falls back to the email when no display name is set", () => {
      vi.mocked(useProjectMembers).mockReturnValue({
        data: [makeMember({ display_name: null, email: "ada@example.com" })],
        isError: false,
        error: null,
      } as never);
      render(<MembersSection projectId="proj-1" />);
      expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    });
  });

  describe("given the create modal is opened — Add requires an email", () => {
    it("shows a validation error when submitted with no email", async () => {
      render(<MembersSection projectId="proj-1" />);
      await openCreateModal();

      await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

      expect(await screen.findByText("Email is required")).toBeInTheDocument();
    });
  });

  describe("given an email is entered — Add invites the member", () => {
    it("calls the mutation with the email", async () => {
      const mutate = vi.fn();
      vi.mocked(useAddProjectMember).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<MembersSection projectId="proj-1" />);
      await openCreateModal();

      await userEvent.type(
        screen.getByPlaceholderText("teammate@example.com"),
        "new@example.com",
      );
      await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

      await waitFor(() =>
        expect(mutate).toHaveBeenCalledWith(
          { email: "new@example.com", role: "editor" },
          expect.objectContaining({ onSuccess: expect.any(Function) }),
        ),
      );
    });
  });

  describe("given Remove is clicked on a member — removes them", () => {
    it("calls the mutation with the member id", async () => {
      const mutate = vi.fn();
      vi.mocked(useProjectMembers).mockReturnValue({
        data: [makeMember({ id: "m1", email: "a@example.com" })],
        isError: false,
        error: null,
      } as never);
      vi.mocked(useRemoveProjectMember).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<MembersSection projectId="proj-1" />);

      await userEvent.click(
        screen.getByRole("button", { name: /remove a@example.com/i }),
      );

      expect(mutate).toHaveBeenCalledWith("m1");
    });
  });

  describe("given the owner changes a member role — updates it", () => {
    it("calls the update mutation with the new role", async () => {
      const mutate = vi.fn();
      vi.mocked(useUpdateProjectMemberRole).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      vi.mocked(useProjectMembers).mockReturnValue({
        data: [makeMember({ id: "m1", email: "a@example.com" })],
        isError: false,
        error: null,
      } as never);
      render(<MembersSection projectId="proj-1" />);

      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: /role of a@example.com/i }),
        "admin",
      );

      expect(mutate).toHaveBeenCalledWith({ id: "m1", role: "admin" });
    });
  });

  describe("given the current user is an admin — cannot touch admins", () => {
    beforeEach(() => {
      asRole("admin");
      vi.mocked(useProjectMembers).mockReturnValue({
        data: [
          makeMember({ id: "m1", email: "ed@example.com", role: "editor" }),
          makeMember({ id: "m2", email: "ad@example.com", role: "admin" }),
        ],
        isError: false,
        error: null,
      } as never);
    });

    it("offers only viewer and editor when changing a role", () => {
      render(<MembersSection projectId="proj-1" />);

      const select = screen.getByRole("combobox", {
        name: /role of ed@example.com/i,
      });
      const options = [...select.querySelectorAll("option")].map(
        (option) => option.value,
      );
      expect(options).toEqual(["viewer", "editor"]);
    });

    it("shows other admins read-only, without a remove button", () => {
      render(<MembersSection projectId="proj-1" />);

      expect(
        screen.queryByRole("combobox", { name: /role of ad@example.com/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /remove ad@example.com/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /remove ed@example.com/i }),
      ).toBeInTheDocument();
    });

    it("does not offer admin when adding a member", async () => {
      render(<MembersSection projectId="proj-1" />);
      await openCreateModal();

      const options = [
        ...screen.getByLabelText("Role").querySelectorAll("option"),
      ].map((option) => option.value);
      expect(options).toEqual(["viewer", "editor"]);
    });
  });
});
