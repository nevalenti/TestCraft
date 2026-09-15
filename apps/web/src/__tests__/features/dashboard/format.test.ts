import { describe, expect, it } from 'vitest';

import { formatCiRunName } from '@/features/dashboard/format';

describe('formatCiRunName', () => {
  describe('given a CI-produced name — reduces it to "workflow · ref"', () => {
    it('formats a PR merge-queue ref as "PR #<number>"', () => {
      expect(formatCiRunName('#34390089026 api (191/merge)')).toBe(
        'api · PR #191',
      );
    });

    it('keeps a plain branch ref as-is', () => {
      expect(formatCiRunName('#12345678 web (main)')).toBe('web · main');
    });

    it('drops the raw run id entirely', () => {
      expect(formatCiRunName('#34390089026 api (191/merge)')).not.toContain(
        '34390089026',
      );
    });
  });

  describe('given a name that does not match the CI-produced shape', () => {
    it('returns it unchanged', () => {
      expect(formatCiRunName('Nightly regression')).toBe('Nightly regression');
    });

    it('returns an empty string unchanged', () => {
      expect(formatCiRunName('')).toBe('');
    });
  });
});
