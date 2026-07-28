import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn(),
}));

import { useParams } from '@tanstack/react-router';

import { useRequiredParam } from '@/hooks/useRequiredParam';

describe('useRequiredParam', () => {
  describe('given the param exists in the route — returns its value', () => {
    it('returns the string value', () => {
      vi.mocked(useParams).mockReturnValue({ projectId: 'proj-1' });
      const { result } = renderHook(() => useRequiredParam('projectId'));

      expect(result.current).toBe('proj-1');
    });
  });

  describe('given the param is missing — throws an error', () => {
    it('throws with a descriptive message', () => {
      vi.mocked(useParams).mockReturnValue({});
      expect(() => renderHook(() => useRequiredParam('projectId'))).toThrow(
        'Missing required route param: projectId',
      );
    });
  });

  describe('given multiple params — returns only the requested one', () => {
    it('returns suiteId when requested', () => {
      vi.mocked(useParams).mockReturnValue({
        projectId: 'proj-1',
        suiteId: 'suite-2',
      });
      const { result } = renderHook(() => useRequiredParam('suiteId'));

      expect(result.current).toBe('suite-2');
    });
  });
});
