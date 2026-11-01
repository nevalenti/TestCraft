import { describe, expect, it, vi } from "vitest";

import { fetchAllPages } from "@/api/fetchAllPages";

describe("fetchAllPages", () => {
  it("includes records after the first server page in the original order", async () => {
    const fetchPage = vi.fn(async (page: number) => ({
      items: page === 1 ? ["first", "second"] : ["third"],
      total: 3,
      page,
      page_size: 2,
    }));

    const result = await fetchAllPages(fetchPage);

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2);
    expect(result.items).toEqual(["first", "second", "third"]);
  });
});
