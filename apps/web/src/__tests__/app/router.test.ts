import { describe, expect, it } from "vitest";

import { RouteError } from "@/app/RouteError";
import { router } from "@/app/router";

describe("file route layout boundaries", () => {
  it.each([
    "/projects/p/runs/r",
    "/projects/p/plans/plan",
    "/projects/p/suites/s",
    "/projects/p/suites/s/cases/c",
  ])("keeps %s outside the project tabs layout", (url) => {
    const matches = router.matchRoutes(url);
    expect(matches).toHaveLength(3);
    expect(matches[1].routeId).toBe("/_app");
    expect(matches.at(-1)?.pathname).toBe(url);
  });

  it("keeps analytics nested inside the project and analytics layouts", () => {
    const matches = router.matchRoutes("/projects/p/analytics/flaky");
    expect(matches.map((match) => match.routeId)).toEqual([
      "__root__",
      "/_app",
      "/_app/projects/$projectId",
      "/_app/projects/$projectId/analytics",
      "/_app/projects/$projectId/analytics/flaky",
    ]);
  });

  it("renders unknown paths inside the authenticated app layout", () => {
    expect(
      router.matchRoutes("/does-not-exist").map((match) => match.routeId),
    ).toContain("/_app");
  });

  it("opens project notes inside the project notes tab", () => {
    expect(
      router.matchRoutes("/projects/p/notes/n").map((match) => match.routeId),
    ).toEqual([
      "__root__",
      "/_app",
      "/_app/projects/$projectId",
      "/_app/projects/$projectId/notes",
      "/_app/projects/$projectId/notes/$noteId",
    ]);
  });

  it("keeps shared runs outside the authenticated app layout", () => {
    expect(
      router.matchRoutes("/share/token").map((match) => match.routeId),
    ).toEqual(["__root__", "/share/$token"]);
  });
});

describe("router defaults", () => {
  it("renders route errors with RouteError so the app shell stays usable", () => {
    expect(router.options.defaultErrorComponent).toBe(RouteError);
  });
});
