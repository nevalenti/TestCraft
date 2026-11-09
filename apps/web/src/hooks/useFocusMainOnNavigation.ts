import { useRouter } from "@tanstack/react-router";
import { type RefObject, useEffect } from "react";

export const useFocusMainOnNavigation = (
  mainRef: RefObject<HTMLElement | null>,
) => {
  const router = useRouter();

  useEffect(
    () =>
      router.subscribe("onResolved", ({ pathChanged }) => {
        if (pathChanged) mainRef.current?.focus({ preventScroll: true });
      }),
    [router, mainRef],
  );
};
