import { act, renderHook } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNoteAutosave } from "@/features/notes/editor/useNoteAutosave";

const initial = { title: "Note", language: "markdown", content: "original" };
const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};
const conflict = () =>
  new AxiosError("Precondition Failed", undefined, undefined, undefined, {
    status: 412,
  } as AxiosResponse);
const advanceDebounce = () => act(() => vi.advanceTimersByTimeAsync(800));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useNoteAutosave", () => {
  it("saves against the loaded version, then against each saved version", async () => {
    const onSave = vi
      .fn()
      .mockResolvedValueOnce({ version: 4 })
      .mockResolvedValueOnce({ version: 5 });
    const { result } = renderHook(() =>
      useNoteAutosave(initial, onSave, false, 3),
    );
    act(() => result.current.setValue({ ...initial, content: "first" }));
    await advanceDebounce();
    act(() => result.current.setValue({ ...initial, content: "second" }));
    await advanceDebounce();
    expect(onSave.mock.calls.map(([, version]) => version)).toEqual([3, 4]);
  });

  it("serializes overlapping writes and saves only the latest queued edit", async () => {
    const pending = deferred();
    const onSave = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(undefined);
    const { result } = renderHook(() => useNoteAutosave(initial, onSave));
    act(() => result.current.setValue({ ...initial, content: "first" }));
    await advanceDebounce();
    act(() => result.current.setValue({ ...initial, content: "second" }));
    await advanceDebounce();
    act(() => result.current.setValue({ ...initial, content: "latest" }));
    await advanceDebounce();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(result.current.saveInProgress).toBe(true);
    await act(async () => pending.resolve());
    expect(onSave.mock.calls.map(([value]) => value.content)).toEqual([
      "first",
      "latest",
    ]);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.saveInProgress).toBe(false);
  });

  it("persists a revert made while a previous edit is being saved", async () => {
    const pending = deferred();
    const onSave = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(undefined);
    const { result } = renderHook(() => useNoteAutosave(initial, onSave));
    act(() => result.current.setValue({ ...initial, content: "temporary" }));
    await advanceDebounce();
    act(() => result.current.setValue(initial));
    await advanceDebounce();
    await act(async () => pending.resolve());
    expect(onSave).toHaveBeenLastCalledWith(initial, undefined);
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(result.current.isDirty).toBe(false);
  });

  it("retains the newest edit after failure and retries that value", async () => {
    const pending = deferred();
    const onSave = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(undefined);
    const { result } = renderHook(() => useNoteAutosave(initial, onSave));
    act(() => result.current.setValue({ ...initial, content: "first" }));
    await advanceDebounce();
    const latest = { ...initial, content: "latest" };
    act(() => result.current.setValue(latest));
    await advanceDebounce();
    await act(async () => pending.reject(new Error("offline")));
    expect(result.current.saveError).toBe(true);
    expect(result.current.isDirty).toBe(true);
    await act(async () => result.current.save(result.current.value));
    expect(onSave).toHaveBeenLastCalledWith(latest, undefined);
    expect(result.current.saveError).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it("flushes the latest pending edit when unmounted during a save", async () => {
    const pending = deferred();
    const onSave = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() =>
      useNoteAutosave(initial, onSave),
    );
    act(() => result.current.setValue({ ...initial, content: "first" }));
    await advanceDebounce();
    const latest = { ...initial, content: "unscheduled edit" };
    act(() => result.current.setValue(latest));
    unmount();
    await act(async () => pending.resolve());
    expect(onSave).toHaveBeenLastCalledWith(latest, undefined);
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it("saves immediately on Ctrl+S and prompts before unload only while dirty", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useNoteAutosave(initial, onSave));
    const changed = { ...initial, content: "changed" };
    act(() => result.current.setValue(changed));
    const dirtyUnload = new Event("beforeunload", { cancelable: true });
    dispatchEvent(dirtyUnload);
    expect(dirtyUnload.defaultPrevented).toBe(true);
    const key = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      cancelable: true,
    });
    await act(async () => {
      dispatchEvent(key);
    });
    expect(key.defaultPrevented).toBe(true);
    expect(onSave).toHaveBeenCalledWith(changed, undefined);
    const cleanUnload = new Event("beforeunload", { cancelable: true });
    dispatchEvent(cleanUnload);
    expect(cleanUnload.defaultPrevented).toBe(false);
  });

  it("does not save or intercept shortcuts in read-only mode", async () => {
    const onSave = vi.fn();
    const { result, unmount } = renderHook(() =>
      useNoteAutosave(initial, onSave, true),
    );
    act(() => result.current.setValue({ ...initial, content: "changed" }));
    await advanceDebounce();
    act(() => result.current.save(result.current.value));
    const key = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      cancelable: true,
    });
    dispatchEvent(key);
    expect(key.defaultPrevented).toBe(false);
    unmount();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("does not write a queued edit after permissions become read-only", async () => {
    const pending = deferred();
    const onSave = vi.fn().mockReturnValue(pending.promise);
    const { result, rerender } = renderHook(
      ({ isReadOnly }) => useNoteAutosave(initial, onSave, isReadOnly),
      {
        initialProps: { isReadOnly: false },
      },
    );
    act(() => result.current.setValue({ ...initial, content: "first" }));
    await advanceDebounce();
    act(() => result.current.setValue({ ...initial, content: "queued" }));
    await advanceDebounce();
    rerender({ isReadOnly: true });
    await act(async () => pending.resolve());
    expect(onSave).toHaveBeenCalledTimes(1);
  });
  it.each([
    { keep: "mine" as const, saves: [3, 7], content: "mine" },
    { keep: "theirs" as const, saves: [3], content: "theirs" },
  ])(
    "pauses saving after a conflict until the user keeps $keep",
    async ({ keep, saves, content }) => {
      const onSave = vi
        .fn()
        .mockRejectedValueOnce(conflict())
        .mockResolvedValue({ version: 8 });
      const { result, rerender } = renderHook(
        ({ server, version }) =>
          useNoteAutosave(server, onSave, false, version),
        { initialProps: { server: initial, version: 3 } },
      );
      act(() => result.current.setValue({ ...initial, content: "mine" }));
      await advanceDebounce();
      expect(result.current.hasConflict).toBe(true);
      expect(result.current.saveError).toBe(false);

      await act(async () => result.current.save(result.current.value));
      rerender({ server: { ...initial, content: "theirs" }, version: 7 });
      await act(async () => result.current.resolveConflict(keep));

      expect(onSave.mock.calls.map(([, version]) => version)).toEqual(saves);
      expect(result.current.hasConflict).toBe(false);
      expect(result.current.value.content).toBe(content);
      expect(result.current.isDirty).toBe(false);
    },
  );
});
