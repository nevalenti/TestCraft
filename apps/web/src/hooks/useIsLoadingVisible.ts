import { useEffect, useRef, useState } from "react";

// eslint-disable-next-line unicorn/consistent-boolean-name
export const useIsLoadingVisible = (
  isLoading: boolean,
  delayMs = 150,
  minVisibleMs = 400,
): boolean => {
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      const showTimer = setTimeout(() => {
        shownAtRef.current = Date.now();
        setVisible(true);
      }, delayMs);
      return () => clearTimeout(showTimer);
    }

    const shownAt = shownAtRef.current;
    if (shownAt === null) return;

    const remaining = Math.max(minVisibleMs - (Date.now() - shownAt), 0);
    const hideTimer = setTimeout(() => {
      shownAtRef.current = null;
      setVisible(false);
    }, remaining);
    return () => clearTimeout(hideTimer);
  }, [isLoading, delayMs, minVisibleMs]);

  return visible;
};
