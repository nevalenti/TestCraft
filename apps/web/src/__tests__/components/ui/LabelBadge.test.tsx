import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LabelBadge } from '@/components/ui/LabelBadge';

const makeLabel = (overrides = {}) => ({
  id: 'label-1',
  name: 'Bug',
  color: '#FF0000',
  projectId: 'proj-1',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('LabelBadge', () => {
  describe('given a label — renders the label name', () => {
    it('displays the label name as text', () => {
      render(<LabelBadge label={makeLabel({ name: 'Regression' })} />);
      expect(screen.getByText('Regression')).toBeInTheDocument();
    });
  });

  describe('given a label color — applies it as inline styles', () => {
    it('renders as a span element', () => {
      render(<LabelBadge label={makeLabel()} />);
      expect(screen.getByText('Bug').tagName).toBe('SPAN');
    });

    it('sets text color to the label color', () => {
      render(<LabelBadge label={makeLabel({ color: '#FF0000' })} />);
      const badge = screen.getByText('Bug');
      expect(badge).toHaveStyle({ color: '#FF0000' });
    });

    it('derives background color from label color', () => {
      render(<LabelBadge label={makeLabel({ color: '#FF0000' })} />);
      const badge = screen.getByText('Bug');
      expect(badge.style.backgroundColor).toMatch(/rgba?\(255,\s*0,\s*0/);
    });

    it('sets border style using the label color', () => {
      render(<LabelBadge label={makeLabel({ color: '#FF0000' })} />);
      const badge = screen.getByText('Bug');
      expect(badge.getAttribute('style')).toContain('border:');
    });
  });

  describe('given different label names — always renders the name', () => {
    it('renders a feature label', () => {
      render(
        <LabelBadge label={makeLabel({ name: 'Feature', color: '#0000FF' })} />,
      );
      expect(screen.getByText('Feature')).toBeInTheDocument();
    });
  });
});
