import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    title,
  }: {
    children?: React.ReactNode;
    to: string;
    title?: string;
  }) => (
    <a href={to} title={title}>
      {children}
    </a>
  ),
}));

vi.mock('@/layout/AccountMenu', () => ({
  AccountMenu: () => <div data-testid="account-menu" />,
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

import { BreadcrumbBar } from '@/layout/BreadcrumbBar';
import { useBreadcrumbsStore } from '@/stores/breadcrumbs';

beforeEach(() => {
  useBreadcrumbsStore.setState({ items: null });
});

describe('BreadcrumbBar', () => {
  describe('given no breadcrumb items are set', () => {
    it('renders no breadcrumb nav', () => {
      render(<BreadcrumbBar />);

      expect(screen.queryByLabelText('Breadcrumb')).not.toBeInTheDocument();
    });
  });

  describe('given an empty breadcrumb list', () => {
    it('renders no breadcrumb nav', () => {
      useBreadcrumbsStore.setState({ items: [] });
      render(<BreadcrumbBar />);

      expect(screen.queryByLabelText('Breadcrumb')).not.toBeInTheDocument();
    });
  });

  describe('given breadcrumb items with and without hrefs', () => {
    it('renders items with an href as links', () => {
      useBreadcrumbsStore.setState({
        items: [
          { label: 'Projects', href: '/projects' },
          { label: 'Checkout Suite' },
        ],
      });
      render(<BreadcrumbBar />);

      const link = screen.getByText('Projects');
      expect(link.closest('a')).toHaveAttribute('href', '/projects');
    });

    it('renders items without an href as plain text, not a link', () => {
      useBreadcrumbsStore.setState({
        items: [
          { label: 'Projects', href: '/projects' },
          { label: 'Checkout Suite' },
        ],
      });
      render(<BreadcrumbBar />);

      const lastCrumb = screen.getByText('Checkout Suite');
      expect(lastCrumb.closest('a')).toBeNull();
      expect(lastCrumb).toHaveAttribute('aria-current', 'page');
    });

    it('does not mark a non-final plain item as the current page', () => {
      useBreadcrumbsStore.setState({
        items: [{ label: 'Projects' }, { label: 'Checkout Suite' }],
      });
      render(<BreadcrumbBar />);

      const firstCrumb = screen.getByText('Projects');
      expect(firstCrumb).not.toHaveAttribute('aria-current');
    });
  });

  it('always renders the account menu and theme toggle', () => {
    render(<BreadcrumbBar />);

    expect(screen.getByTestId('account-menu')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });
});
