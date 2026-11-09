import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { LoadingFallback } from "@/layout/LoadingFallback";

it("is announced as a labelled status", () => {
  render(<LoadingFallback />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading…");
});
