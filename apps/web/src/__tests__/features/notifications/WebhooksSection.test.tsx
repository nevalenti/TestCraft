import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/notifications/hooks', () => ({
  useWebhooks: vi.fn(),
  useCreateWebhook: vi.fn(),
  useDeleteWebhook: vi.fn(),
}));

import {
  useCreateWebhook,
  useDeleteWebhook,
  useWebhooks,
} from '@/features/notifications/hooks';
import { AVAILABLE_EVENTS } from '@/features/notifications/notificationEvents';
import { WebhooksSection } from '@/features/notifications/WebhooksSection';

const makeWebhook = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'wh1',
  url: 'https://hooks.example.com/testcraft',
  events: AVAILABLE_EVENTS,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useWebhooks).mockReturnValue({
    data: [],
    isError: false,
    error: null,
  } as never);
  vi.mocked(useCreateWebhook).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
  vi.mocked(useDeleteWebhook).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
});

describe('WebhooksSection', () => {
  describe('given an error loading webhooks — shows the error state', () => {
    it('renders the failure message', () => {
      vi.mocked(useWebhooks).mockReturnValue({
        data: undefined,
        isError: true,
        error: new Error('boom'),
      } as never);
      render(<WebhooksSection projectId="proj-1" />);
      expect(screen.getByText('Failed to load webhooks')).toBeInTheDocument();
    });
  });

  describe('given existing webhooks — lists them', () => {
    it('shows the webhook url and subscribed events', () => {
      vi.mocked(useWebhooks).mockReturnValue({
        data: [makeWebhook()],
        isError: false,
        error: null,
      } as never);
      render(<WebhooksSection projectId="proj-1" />);
      expect(
        screen.getByText('https://hooks.example.com/testcraft'),
      ).toBeInTheDocument();
    });
  });

  describe('given the Add Webhook button — is disabled until a url and event are set', () => {
    it('is disabled with no url entered', () => {
      render(<WebhooksSection projectId="proj-1" />);
      expect(
        screen.getByRole('button', { name: /add webhook/i }),
      ).toBeDisabled();
    });

    it('is disabled once all events are unchecked, even with a url', async () => {
      render(<WebhooksSection projectId="proj-1" />);
      await userEvent.type(
        screen.getByPlaceholderText('https://hooks.example.com/testcraft'),
        'https://example.com/hook',
      );
      for (const event of AVAILABLE_EVENTS) {
        await userEvent.click(screen.getByLabelText(event));
      }
      expect(
        screen.getByRole('button', { name: /add webhook/i }),
      ).toBeDisabled();
    });
  });

  describe('given a url and at least one event — Add Webhook creates it', () => {
    it('calls the mutation with the url, secret, and selected events', async () => {
      const mutate = vi.fn();
      vi.mocked(useCreateWebhook).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<WebhooksSection projectId="proj-1" />);

      await userEvent.type(
        screen.getByPlaceholderText('https://hooks.example.com/testcraft'),
        'https://example.com/hook',
      );
      await userEvent.type(
        screen.getByPlaceholderText('whsec_...'),
        'whsec_123',
      );
      await userEvent.click(
        screen.getByRole('button', { name: /add webhook/i }),
      );

      expect(mutate).toHaveBeenCalledWith(
        {
          url: 'https://example.com/hook',
          secret: 'whsec_123',
          events: AVAILABLE_EVENTS,
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  describe('given Delete is clicked on a webhook — removes it', () => {
    it('calls the mutation with the webhook id', async () => {
      const mutate = vi.fn();
      vi.mocked(useWebhooks).mockReturnValue({
        data: [makeWebhook({ id: 'wh1', url: 'https://a.example.com' })],
        isError: false,
        error: null,
      } as never);
      vi.mocked(useDeleteWebhook).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      render(<WebhooksSection projectId="proj-1" />);

      await userEvent.click(
        screen.getByRole('button', { name: /delete webhook/i }),
      );

      expect(mutate).toHaveBeenCalledWith('wh1');
    });
  });
});
