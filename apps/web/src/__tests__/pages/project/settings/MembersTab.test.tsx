import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getRouteApi: () => ({ useParams: () => ({ projectId: "proj-1" }) }),
}));

vi.mock("@/features/projectMembers/MembersSection", () => ({
  MembersSection: vi.fn(() => <div data-testid="members-section" />),
}));

import { MembersTab } from "@/pages/project/settings/MembersTab";

describe("MembersTab", () => {
  it("renders the members section (the settings layout checks the role)", () => {
    render(<MembersTab />);

    expect(screen.getByTestId("members-section")).toBeInTheDocument();
  });
});
