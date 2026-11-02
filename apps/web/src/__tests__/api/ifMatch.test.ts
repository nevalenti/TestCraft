import { describe, expect, it } from "vitest";

import { ifMatch } from "@/api/ifMatch";

describe("ifMatch", () => {
  it("quotes the version as a strong ETag header", () => {
    expect(ifMatch(3)).toEqual({ "if-match": '"3"' });
  });
});
