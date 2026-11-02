import type { Note } from "@testcraft/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { groupNotesByRecency, latestNote } from "@/features/notes/noteDates";
import { formatRelativeTime } from "@/lib/format";

const NOW = new Date(2026, 9, 16, 15, 0);

const noteAt = (id: string, date: Date): Note => ({
  id,
  version: 1,
  title: id,
  language: "markdown",
  size_bytes: 0,
  excerpt: "",
  created_at: date.toISOString(),
  updated_at: date.toISOString(),
});

describe("noteDates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("groups consecutive notes by how recently they were edited", () => {
    const groups = groupNotesByRecency(
      [
        noteAt("a", new Date(2026, 9, 16, 9)),
        noteAt("b", new Date(2026, 9, 15, 9)),
        noteAt("c", new Date(2026, 9, 12, 9)),
        noteAt("d", new Date(2026, 9, 1, 9)),
        noteAt("e", new Date(2026, 7, 3, 9)),
        noteAt("f", new Date(2025, 2, 3, 9)),
      ],
      NOW,
    );

    expect(groups.map((group) => [group.label, group.notes.length])).toEqual([
      ["Today", 1],
      ["Yesterday", 1],
      ["Previous 7 days", 1],
      ["Previous 30 days", 1],
      ["August", 1],
      ["2025", 1],
    ]);
  });

  it.each([
    [new Date(2026, 9, 16, 14, 59, 40), "Just now"],
    [new Date(2026, 9, 16, 14, 35), "25m ago"],
    [new Date(2026, 9, 16, 9, 5), "9:05 AM"],
    [new Date(2026, 9, 15, 9, 5), "Yesterday"],
    [new Date(2026, 9, 12, 9, 5), "Monday"],
    [new Date(2026, 4, 2, 9, 5), "May 2"],
    [new Date(2024, 4, 2, 9, 5), "May 2, 2024"],
  ])("formats %s as %s", (date, expected) => {
    expect(formatRelativeTime(date.toISOString(), NOW)).toBe(expected);
  });
});

describe("latestNote", () => {
  it("picks the most recently edited note", () => {
    const notes = [
      noteAt("old", new Date(2026, 9, 1)),
      noteAt("new", new Date(2026, 9, 15)),
      noteAt("mid", new Date(2026, 9, 10)),
    ];

    expect(latestNote(notes)?.id).toBe("new");
  });

  it("returns nothing for an empty list", () => {
    expect(latestNote([])).toBeUndefined();
  });
});
