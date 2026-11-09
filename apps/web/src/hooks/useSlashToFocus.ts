import { type RefObject, useEffect } from "react";

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export const useSlashToFocus = (ref: RefObject<HTMLInputElement | null>) => {
  useEffect(() => {
    const focusInput = (event: KeyboardEvent) => {
      const input = ref.current;
      if (!input || event.key !== "/" || event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const openDialog = document.querySelector("dialog[open]");
      if (openDialog && !openDialog.contains(input)) return;
      event.preventDefault();
      input.focus();
    };
    addEventListener("keydown", focusInput);
    return () => removeEventListener("keydown", focusInput);
  }, [ref]);
};
