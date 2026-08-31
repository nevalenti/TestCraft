import { useEffect, useRef, useState } from 'react';

// eslint-disable-next-line unicorn/consistent-boolean-name
export const useIsLoadingVisible = (
  isLoading: boolean,
  delayMs = 150,
  minVisibleMs = 400,
): boolean => {
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef(0);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    if (isLoading) {
      showTimer = setTimeout(() => {
        shownAtRef.current = Date.now();
        setVisible(true);
      }, delayMs);
    } else {
      setVisible((wasVisible) => {
        if (!wasVisible) return false;

        const remaining = minVisibleMs - (Date.now() - shownAtRef.current);
        if (remaining > 0) {
          hideTimer = setTimeout(() => setVisible(false), remaining);
          return true;
        }
        return false;
      });
    }

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isLoading, delayMs, minVisibleMs]);

  return visible;
};
