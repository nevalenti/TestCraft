import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth/keycloak", () => ({
  keycloak: {
    authenticated: false,
    login: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("@/layout/AppLayout", () => ({ AppLayout: () => null }));

import { keycloak } from "@/auth/keycloak";
import { Route } from "@/routes/_app";

const beforeLoad = () =>
  (Route.options.beforeLoad as unknown as () => Promise<void>)();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/_app route", () => {
  it("lets an authenticated user through", async () => {
    vi.mocked(keycloak).authenticated = true;

    await expect(beforeLoad()).resolves.toBeUndefined();
    expect(keycloak.login).not.toHaveBeenCalled();
  });

  it("sends an anonymous visitor (e.g. from a share link) to login", async () => {
    vi.mocked(keycloak).authenticated = false;

    void beforeLoad();
    await vi.waitFor(() => expect(keycloak.login).toHaveBeenCalledOnce());
  });
});
