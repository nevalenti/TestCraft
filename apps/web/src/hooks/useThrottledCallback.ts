import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export const useThrottledCallback = (
  callback: () => void,
  intervalMs: number,
) => {
  const callbackRef = useRef(callback);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastRunAt = useRef(-Infinity);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(() => {
    if (timer.current !== undefined) return;
    const wait = Math.max(0, lastRunAt.current + intervalMs - Date.now());
    timer.current = setTimeout(() => {
      timer.current = undefined;
      lastRunAt.current = Date.now();
      callbackRef.current();
    }, wait);
  }, [intervalMs]);
};
