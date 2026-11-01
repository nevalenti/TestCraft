import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../core/auth", () => ({ authenticate: vi.fn() }));
vi.mock("../core/util", () => ({
  fetchAuthority: vi.fn(),
  findProjectId: vi.fn(),
}));

import type { Options } from "../args";
import { buildContext } from "../context";
import { authenticate } from "../core/auth";
import { findProjectId } from "../core/util";

const options = (overrides: Partial<Options> = {}): Options => ({
  command: "import",
  apiUrl: "https://api.test",
  username: "",
  password: "",
  clientId: "",
  clientSecret: "",
  apiToken: "",
  projectId: "",
  projectName: "",
  runName: "CI",
  keycloakAuthority: "https://kc.test/realms/testcraft",
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildContext", () => {
  describe("given an API token and a project id — uses them directly", () => {
    it("neither signs in to Keycloak nor looks the project up", async () => {
      const context = await buildContext(
        options({ apiToken: "tc_secret", projectId: "p-1" }),
      );

      expect(context).toEqual({
        apiUrl: "https://api.test",
        projectId: "p-1",
        token: "tc_secret",
      });
      expect(authenticate).not.toHaveBeenCalled();
      expect(findProjectId).not.toHaveBeenCalled();
    });
  });

  describe("given Keycloak credentials and a project id — skips the project lookup", () => {
    it("signs in but uses the given project id", async () => {
      vi.mocked(authenticate).mockResolvedValue("jwt");

      const context = await buildContext(
        options({ clientId: "ci", clientSecret: "s", projectId: "p-2" }),
      );

      expect(context.projectId).toBe("p-2");
      expect(findProjectId).not.toHaveBeenCalled();
    });
  });

  describe("given Keycloak credentials and only a project name — looks the project up", () => {
    it("resolves the project id by name", async () => {
      vi.mocked(authenticate).mockResolvedValue("jwt");
      vi.mocked(findProjectId).mockResolvedValue("p-3");

      const context = await buildContext(
        options({ clientId: "ci", clientSecret: "s", projectName: "Web" }),
      );

      expect(context.projectId).toBe("p-3");
      expect(findProjectId).toHaveBeenCalledWith(
        "https://api.test",
        "jwt",
        "Web",
      );
    });
  });
});
