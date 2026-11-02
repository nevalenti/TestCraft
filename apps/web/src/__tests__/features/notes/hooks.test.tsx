import type { Note, NoteDetail, Paginated } from "@testcraft/types";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/notes/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/notes/api")>()),
  personalNotesApi: { update: vi.fn(), create: vi.fn() },
  projectNotesApi: { update: vi.fn(), create: vi.fn() },
}));

vi.mock("@/lib/notify", () => ({ notify: vi.fn() }));

import { createWrapper } from "@/__tests__/test-utils";
import { queryKeys } from "@/api/queryKeys";
import { personalNotesApi, projectNotesApi } from "@/features/notes/api";
import {
  useCreatePersonalNote,
  useCreateProjectNote,
  useIsNoteSaveSettled,
  useUpdatePersonalNote,
  useUpdateProjectNote,
} from "@/features/notes/hooks";

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: "note-1",
  version: 1,
  title: "Old title",
  language: "markdown",
  size_bytes: 3,
  excerpt: "old",
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  ...overrides,
});

const makeDetail = (overrides: Partial<NoteDetail> = {}): NoteDetail => ({
  ...makeNote(),
  content: "old",
  ...overrides,
});

const pageOf = (items: Note[]): Paginated<Note> => ({
  items,
  total: items.length,
  page: 1,
  page_size: 20,
});

const input = { title: "New title", language: "python", content: "new" };

const slowSave = () =>
  new Promise<Note>((resolve) => {
    setTimeout(
      () => resolve(makeNote({ title: "New title", language: "python" })),
      50,
    );
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useUpdatePersonalNote", () => {
  it("stores the saved note in the detail and list caches without refetching", async () => {
    const saved = makeNote({
      title: "New title",
      language: "python",
      updated_at: "2026-10-02T00:00:00Z",
    });
    vi.mocked(personalNotesApi.update).mockResolvedValue(saved);
    const { queryClient, wrapper } = createWrapper();
    const other = makeNote({ id: "note-2", title: "Other" });
    queryClient.setQueryData(
      queryKeys.notes.personal.detail("note-1"),
      makeDetail(),
    );
    queryClient.setQueryData(
      [...queryKeys.notes.personal.lists(), undefined],
      pageOf([makeNote(), other]),
    );
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdatePersonalNote(), { wrapper });
    await act(() =>
      result.current.mutateAsync({ id: "note-1", version: 4, ...input }),
    );

    expect(personalNotesApi.update).toHaveBeenCalledWith("note-1", input, 4);
    expect(
      queryClient.getQueryData(queryKeys.notes.personal.detail("note-1")),
    ).toEqual({ ...saved, content: "new" });
    expect(
      queryClient.getQueryData<Paginated<Note>>([
        ...queryKeys.notes.personal.lists(),
        undefined,
      ])?.items,
    ).toEqual([saved, other]);
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.notes.personal.lists(),
      refetchType: "none",
    });
  });

  it("keeps the saved content in the detail cache after the editor unmounts", async () => {
    vi.mocked(personalNotesApi.update).mockResolvedValue(makeNote());
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(
      queryKeys.notes.personal.detail("note-1"),
      makeDetail(),
    );

    const { result, unmount } = renderHook(() => useUpdatePersonalNote(), {
      wrapper,
    });
    const save = result.current.mutateAsync({
      id: "note-1",
      version: 1,
      title: "Old title",
      language: "markdown",
      content: "typed just before leaving",
    });
    unmount();
    await act(() => save);

    expect(
      queryClient.getQueryData<NoteDetail>(
        queryKeys.notes.personal.detail("note-1"),
      )?.content,
    ).toBe("typed just before leaving");
  });
});

describe("useIsNoteSaveSettled", () => {
  const saveKey = queryKeys.notes.personal.save();

  it("is settled at once when nothing is saving", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useIsNoteSaveSettled(saveKey, "note-1"),
      { wrapper },
    );

    expect(result.current).toBe(true);
  });

  it("holds the editor until a save left in flight lands in the cache", async () => {
    vi.mocked(personalNotesApi.update).mockImplementation(slowSave);
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(
      queryKeys.notes.personal.detail("note-1"),
      makeDetail(),
    );
    const leaving = renderHook(() => useUpdatePersonalNote(), { wrapper });
    const save = leaving.result.current.mutateAsync({
      id: "note-1",
      version: 1,
      ...input,
    });
    leaving.unmount();

    const { result } = renderHook(
      () => ({
        current: useIsNoteSaveSettled(saveKey, "note-1"),
        other: useIsNoteSaveSettled(saveKey, "note-2"),
      }),
      { wrapper },
    );

    expect(result.current).toEqual({ current: false, other: true });
    await act(() => save);
    await waitFor(() => expect(result.current.current).toBe(true));
    expect(
      queryClient.getQueryData<NoteDetail>(
        queryKeys.notes.personal.detail("note-1"),
      )?.content,
    ).toBe("new");
  });

  it("stays settled while the open editor autosaves", async () => {
    vi.mocked(personalNotesApi.update).mockImplementation(slowSave);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => ({
        isSettled: useIsNoteSaveSettled(saveKey, "note-1"),
        update: useUpdatePersonalNote(),
      }),
      { wrapper },
    );

    const save = result.current.update.mutateAsync({
      id: "note-1",
      version: 1,
      ...input,
    });

    expect(result.current.isSettled).toBe(true);
    await act(() => save);
    expect(result.current.isSettled).toBe(true);
  });
});

describe("useUpdateProjectNote", () => {
  it("stores the saved note under the project keys", async () => {
    const saved = makeNote({
      project_id: "p1",
      title: "New title",
      language: "python",
    });
    vi.mocked(projectNotesApi.update).mockResolvedValue(saved);
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(
      [...queryKeys.notes.project.lists("p1"), "search"],
      pageOf([makeNote({ project_id: "p1" })]),
    );

    const { result } = renderHook(() => useUpdateProjectNote("p1"), {
      wrapper,
    });
    await act(() =>
      result.current.mutateAsync({ id: "note-1", version: 4, ...input }),
    );

    expect(projectNotesApi.update).toHaveBeenCalledWith(
      "p1",
      "note-1",
      input,
      4,
    );
    expect(
      queryClient.getQueryData(queryKeys.notes.project.detail("p1", "note-1")),
    ).toEqual({ ...saved, content: "new" });
    expect(
      queryClient.getQueryData<Paginated<Note>>([
        ...queryKeys.notes.project.lists("p1"),
        "search",
      ])?.items,
    ).toEqual([saved]);
  });
});

describe("creating a note", () => {
  it("seeds the personal detail cache so the new note opens without a fetch", async () => {
    const created = makeNote({ id: "new", title: "Untitled note" });
    vi.mocked(personalNotesApi.create).mockResolvedValue(created);
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePersonalNote(), { wrapper });

    await act(() => result.current.mutateAsync({ title: "Untitled note" }));

    expect(
      queryClient.getQueryData(queryKeys.notes.personal.detail("new")),
    ).toEqual({ ...created, content: "" });
  });

  it("seeds the project detail cache with the submitted content", async () => {
    const created = makeNote({ id: "new", project_id: "p1" });
    vi.mocked(projectNotesApi.create).mockResolvedValue(created);
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateProjectNote("p1"), {
      wrapper,
    });

    await act(() =>
      result.current.mutateAsync({ title: "Note", content: "body" }),
    );

    expect(
      queryClient.getQueryData(queryKeys.notes.project.detail("p1", "new")),
    ).toEqual({ ...created, content: "body" });
  });
});
