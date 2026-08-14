import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/notifications/hooks', () => ({
  useEmails: vi.fn(),
  useCreateEmail: vi.fn(),
  useDeleteEmail: vi.fn(),
}));

import { EmailsSection } from '@/features/notifications/EmailsSection';
import {
  useCreateEmail,
  useDeleteEmail,
  useEmails,
} from '@/features/notifications/hooks';
import { AVAILABLE_EVENTS } from '@/features/notifications/notificationEvents';

const makeSub = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'e1',
  email: 'alerts@example.com',
  events: AVAILABLE_EVENTS,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useEmails).mockReturnValue({
    data: [],
    isError: false,
    error: null,
  } as never);
  vi.mocked(useCreateEmail).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
  vi.mocked(useDeleteEmail).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
});

describe('EmailsSection', () => {
  describe('given an error loading subscriptions — shows the error state', () => {
    it('renders the failure message', () => {
      vi.mocked(useEmails).mockReturnValue({
        data: undefined,
        isError: true,
        error: new Error('boom'),
      } as never);
      render(<EmailsSection projectId="proj-1" />);
      expect(
        screen.getByText('Failed to load email subscriptions'),
      ).toBeInTheDocument();
    });
  });

  describe('given existing subscriptions — lists them', () => {
    it('shows the subscribed email address', () => {
      vi.mocked(useEmails).mockReturnValue({
        data: [makeSub()],
        isError: false,
        error: null,
      } as never);
      render(<EmailsSection projectId="proj-1" />);
      expect(screen.getByText('alerts@example.com')).toBeInTheDocument();
    });
  });

  describe('given the Add Email button — is disabled until an email and event are set', () => {
    it('is disabled with no email entered', () => {
      render(<EmailsSection projectId="proj-1" />);
      expect(screen.getByRole('button', { name: /add email/i })).toBeDisabled();
    });
  });

  describe('given an email and at least one event — Add Email creates it', () => {
    it('calls the mutation with the email and selected events', async () => {
      const mutate = vi.fn();
      vi.mocked(useCreateEmail).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<EmailsSection projectId="proj-1" />);

      await userEvent.type(
        screen.getByPlaceholderText('alerts@example.com'),
        'me@example.com',
      );
      await userEvent.click(screen.getByRole('button', { name: /add email/i }));

      expect(mutate).toHaveBeenCalledWith(
        { email: 'me@example.com', events: AVAILABLE_EVENTS },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  describe('given Delete is clicked on a subscription — removes it', () => {
    it('calls the mutation with the subscription id', async () => {
      const mutate = vi.fn();
      vi.mocked(useEmails).mockReturnValue({
        data: [makeSub({ id: 'e1', email: 'a@example.com' })],
        isError: false,
        error: null,
      } as never);
      vi.mocked(useDeleteEmail).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<EmailsSection projectId="proj-1" />);

      await userEvent.click(
        screen.getByRole('button', { name: /delete email subscription/i }),
      );

      expect(mutate).toHaveBeenCalledWith('e1');
    });
  });
});
