import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useBreadcrumbs', () => ({ useBreadcrumbs: vi.fn() }));

import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { SettingsPage } from '@/pages/SettingsPage/SettingsPage';

describe('SettingsPage', () => {
  describe('given the route is rendered', () => {
    it('renders without crashing and produces no content', () => {
      const { container } = render(<SettingsPage />);
      expect(container).toBeEmptyDOMElement();
    });

    it('sets the Settings breadcrumb', () => {
      render(<SettingsPage />);
      expect(useBreadcrumbs).toHaveBeenCalledWith([
        { label: 'Settings', href: '/settings' },
      ]);
    });
  });
});
