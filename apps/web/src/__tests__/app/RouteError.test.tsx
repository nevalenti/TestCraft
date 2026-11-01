import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/errorReporting", () => ({ reportError: vi.fn() }));

import { RouteError } from "@/app/RouteError";
import { reportError } from "@/lib/errorReporting";

const apiError = (status: number, data: unknown = {}) =>
  new AxiosError(
    `Request failed with status code ${status}`,
    undefined,
    undefined,
    undefined,
    {
      status,
      statusText: "",
      data,
      headers: {},
      config: { headers: new AxiosHeaders() },
    },
  );

const renderRoutes = (loader: () => Promise<unknown>) => {
  const rootRoute = createRootRoute({ component: Outlet });
  const failingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    loader,
    component: () => <p>Loaded</p>,
  });
  const otherRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/other",
    component: () => <p>Other page</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([failingRoute, otherRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    defaultErrorComponent: RouteError,
  });
  render(<RouterProvider router={router} />);
  return router;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RouteError", () => {
  it("renders the not-found page when a loader gets a 404", async () => {
    renderRoutes(() => Promise.reject(apiError(404)));

    expect(await screen.findByText("Page not found")).toBeInTheDocument();
  });

  it("shows the problem detail when a loader gets a server error", async () => {
    renderRoutes(() =>
      Promise.reject(apiError(500, { detail: "Database unavailable" })),
    );

    expect(await screen.findByText("Database unavailable")).toBeInTheDocument();
    expect(reportError).not.toHaveBeenCalled();
  });

  it("reports errors that did not come from the API", async () => {
    const error = new Error("Loader bug");
    renderRoutes(() => Promise.reject(error));

    expect(await screen.findByText("Loader bug")).toBeInTheDocument();
    expect(reportError).toHaveBeenCalledWith(error);
  });

  it("runs the loader again when Retry is clicked", async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(apiError(503))
      .mockResolvedValueOnce(null);
    renderRoutes(loader);
    await screen.findByText("Something went wrong");

    await userEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText("Loaded")).toBeInTheDocument();
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("clears the error after navigating to another route", async () => {
    const router = renderRoutes(() => Promise.reject(apiError(500)));
    await screen.findByText("Something went wrong");

    await act(() => router.navigate({ href: "/other" }));

    expect(await screen.findByText("Other page")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });
});
