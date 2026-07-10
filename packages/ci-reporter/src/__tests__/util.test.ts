import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchAuthority, findProjectId, slugify } from "../core/util";

describe("slugify", () => {
  describe("slugify — given a human-readable name — lowercases and hyphenates it", () => {
    it("converts spaces to hyphens", () => {
      expect(slugify("Login works")).toBe("login-works");
    });

    it("collapses runs of non-alphanumeric characters into a single hyphen", () => {
      expect(slugify("Checkout -- flow!!  works")).toBe("checkout-flow-works");
    });

    it("strips leading and trailing hyphens", () => {
      expect(slugify("  --Weird Name--  ")).toBe("weird-name");
    });

    it("returns an empty string for input with no alphanumeric characters", () => {
      expect(slugify("***")).toBe("");
    });
  });
});

describe("fetchAuthority / findProjectId", () => {
  const fetchMock = vi.fn();

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  describe("fetchAuthority — given the API responds with an authority — returns it", () => {
    it("fetches from /api/auth-config", async () => {
      vi.stubGlobal("fetch", fetchMock);
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ authority: "https://kc.example.com" }), {
          status: 200,
        }),
      );

      const authority = await fetchAuthority("https://api.example.com");

      expect(authority).toBe("https://kc.example.com");
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/auth-config",
        {},
      );
    });
  });

  describe("findProjectId — given a project matching the exact name exists — returns its id", () => {
    it("matches by exact name among the returned items", async () => {
      vi.stubGlobal("fetch", fetchMock);
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [
              { id: "1", name: "Other Project" },
              { id: "2", name: "My Project" },
            ],
          }),
          { status: 200 },
        ),
      );

      const id = await findProjectId(
        "https://api.example.com",
        "token-123",
        "My Project",
      );

      expect(id).toBe("2");
    });
  });

  describe("findProjectId — given no project matches the exact name — throws", () => {
    it("rejects with a descriptive error", async () => {
      vi.stubGlobal("fetch", fetchMock);
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ items: [] }), { status: 200 }),
      );

      await expect(
        findProjectId("https://api.example.com", "token-123", "Ghost"),
      ).rejects.toThrow('Project "Ghost" not found');
    });
  });
});
