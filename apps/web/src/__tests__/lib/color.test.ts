import { describe, expect, it } from "vitest";

import { contrastRatio, readableOnSurface } from "@/lib/color";

const SURFACE: [number, number, number] = [40, 42, 54];
const rgbOf = (hex: string): [number, number, number] => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

describe("readableOnSurface", () => {
  it("keeps colors that already meet 4.5:1", () => {
    expect(readableOnSurface("#22c55e")).toBe("#22c55e");
  });

  it.each(["#000000", "#1e3a8a", "#ff0000", "#64748b"])(
    "lightens %s until it reaches 4.5:1",
    (color) => {
      const result = readableOnSurface(color);

      expect(result).not.toBe(color);
      expect(contrastRatio(rgbOf(result), SURFACE)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("returns non-hex input unchanged", () => {
    expect(readableOnSurface("red")).toBe("red");
  });
});
