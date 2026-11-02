import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useModal } from "@/hooks/useModal";

describe("useModal", () => {
  describe("initial state — modal is closed", () => {
    it("starts with type closed", () => {
      const { result } = renderHook(() => useModal<{ id: string }>());
      expect(result.current.modal).toEqual({ type: "closed" });
    });
  });

  describe("openCreate — sets modal to create state", () => {
    it("sets type to create", () => {
      const { result } = renderHook(() => useModal<{ id: string }>());
      act(() => result.current.openCreate());
      expect(result.current.modal).toEqual({ type: "create" });
    });
  });

  describe("openImport — sets modal to import state", () => {
    it("sets type to import", () => {
      const { result } = renderHook(() => useModal<{ id: string }>());
      act(() => result.current.openImport());
      expect(result.current.modal).toEqual({ type: "import" });
    });
  });

  describe("openEdit — sets modal to edit state with the item", () => {
    it("sets type to edit and stores the item", () => {
      const item = { id: "item-1" };
      const { result } = renderHook(() => useModal<{ id: string }>());
      act(() => result.current.openEdit(item));
      expect(result.current.modal).toEqual({ type: "edit", item });
    });
  });

  describe("openDelete — sets modal to delete state with the item", () => {
    it("sets type to delete and stores the item", () => {
      const item = { id: "item-1" };
      const { result } = renderHook(() => useModal<{ id: string }>());
      act(() => result.current.openDelete(item));
      expect(result.current.modal).toEqual({ type: "delete", item });
    });
  });

  describe("close — resets modal to closed", () => {
    it("closes after openCreate", () => {
      const { result } = renderHook(() => useModal<{ id: string }>());
      act(() => result.current.openCreate());
      act(() => result.current.close());
      expect(result.current.modal).toEqual({ type: "closed" });
    });

    it("closes after openEdit", () => {
      const item = { id: "item-1" };
      const { result } = renderHook(() => useModal<{ id: string }>());
      act(() => result.current.openEdit(item));
      act(() => result.current.close());
      expect(result.current.modal).toEqual({ type: "closed" });
    });
  });
});
