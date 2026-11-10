import { TestResultStatus } from "@testcraft/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UpdateResultForm } from "@/features/testResults/UpdateResultForm";

const setup = (status: TestResultStatus, defectUrl = "") => {
  const onSubmit = vi.fn();
  render(
    <UpdateResultForm
      defaultValues={{ status, notes: "", defectUrl }}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
      isLoading={false}
    />,
  );
  return onSubmit;
};

describe("UpdateResultForm defect link", () => {
  it("submits the link for a failed result", async () => {
    const onSubmit = setup(TestResultStatus.Failed);

    await userEvent.type(
      screen.getByLabelText(/Defect Link/),
      "https://github.com/acme/shop/issues/482",
    );
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        defect_url: "https://github.com/acme/shop/issues/482",
      }),
    );
  });

  it("rejects a link that is not http or https", async () => {
    const onSubmit = setup(TestResultStatus.Failed);

    await userEvent.type(
      screen.getByLabelText(/Defect Link/),
      "javascript:alert(1)",
    );
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(
      await screen.findByText(/starting with http:\/\/ or https:\/\//),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("hides the field unless the result failed", () => {
    setup(TestResultStatus.Passed);

    expect(screen.queryByLabelText(/Defect Link/)).toBeNull();
  });
});
