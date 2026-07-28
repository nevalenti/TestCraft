import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebounce } from '@/hooks/useDebounce';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebounce', () => {
  describe('given an initial value — returns it immediately', () => {
    it('debounced value matches the initial value', () => {
      const { result } = renderHook(() => useDebounce('hello', 300));

      expect(result.current).toBe('hello');
    });
  });

  describe('given a value update before the delay elapses — does not update yet', () => {
    it('returns the previous value', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'hello' } },
      );

      rerender({ value: 'world' });
      act(() => vi.advanceTimersByTime(299));

      expect(result.current).toBe('hello');
    });
  });

  describe('given a value update after the delay elapses — updates the debounced value', () => {
    it('returns the new value', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'hello' } },
      );

      rerender({ value: 'world' });
      act(() => vi.advanceTimersByTime(300));

      expect(result.current).toBe('world');
    });
  });

  describe('given rapid successive updates — only applies the last value after the delay', () => {
    it('debounces intermediate values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'a' } },
      );

      rerender({ value: 'b' });
      act(() => vi.advanceTimersByTime(100));
      rerender({ value: 'c' });
      act(() => vi.advanceTimersByTime(100));
      rerender({ value: 'd' });
      act(() => vi.advanceTimersByTime(300));

      expect(result.current).toBe('d');
    });
  });

  describe('given a delay change — uses the new delay for subsequent updates', () => {
    it('respects the updated delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'hello', delay: 300 } },
      );

      rerender({ value: 'world', delay: 500 });
      act(() => vi.advanceTimersByTime(300));
      expect(result.current).toBe('hello');

      act(() => vi.advanceTimersByTime(200));
      expect(result.current).toBe('world');
    });
  });
});
