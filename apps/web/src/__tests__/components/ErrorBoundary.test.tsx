import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from '@/components/ErrorBoundary';

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  vi.restoreAllMocks();
});

let shouldThrow = false;

const Flaky = () => {
  if (shouldThrow) throw new Error('Something exploded');

  return <p>Child rendered successfully</p>;
};

describe('ErrorBoundary', () => {
  describe('ErrorBoundary — given a child that does not throw — renders children normally', () => {
    it('displays the child content', () => {
      shouldThrow = false;
      render(
        <ErrorBoundary>
          <Flaky />
        </ErrorBoundary>,
      );
      expect(
        screen.getByText('Child rendered successfully'),
      ).toBeInTheDocument();
    });
  });

  describe('ErrorBoundary — given a child that throws — renders the default error UI', () => {
    it('shows the "Something went wrong" heading', () => {
      shouldThrow = true;
      render(
        <ErrorBoundary>
          <Flaky />
        </ErrorBoundary>,
      );
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('displays the error message', () => {
      shouldThrow = true;
      render(
        <ErrorBoundary>
          <Flaky />
        </ErrorBoundary>,
      );
      expect(screen.getByText('Something exploded')).toBeInTheDocument();
    });

    it('shows the Try again button', () => {
      shouldThrow = true;
      render(
        <ErrorBoundary>
          <Flaky />
        </ErrorBoundary>,
      );
      expect(
        screen.getByRole('button', { name: /try again/i }),
      ).toBeInTheDocument();
    });
  });

  describe('ErrorBoundary — given a custom fallback prop — renders the fallback instead', () => {
    it('shows the custom fallback node', () => {
      shouldThrow = true;
      render(
        <ErrorBoundary fallback={<span>Custom fallback</span>}>
          <Flaky />
        </ErrorBoundary>,
      );
      expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    });
  });

  describe('ErrorBoundary — when Try again is clicked — resets and re-renders the child', () => {
    it('shows child content once the child stops throwing', async () => {
      shouldThrow = true;
      render(
        <ErrorBoundary>
          <Flaky />
        </ErrorBoundary>,
      );
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      shouldThrow = false;
      await userEvent.click(screen.getByRole('button', { name: /try again/i }));

      expect(
        screen.getByText('Child rendered successfully'),
      ).toBeInTheDocument();
    });
  });

  describe('ErrorBoundary — given an onError callback — calls it with the caught error', () => {
    it('invokes onError with the Error instance', () => {
      shouldThrow = true;
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <Flaky />
        </ErrorBoundary>,
      );
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Something exploded' }),
        expect.anything(),
      );
    });
  });
});
