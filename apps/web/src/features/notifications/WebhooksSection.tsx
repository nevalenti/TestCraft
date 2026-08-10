import { useState } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { SettingsEntityList } from '@/components/ui/SettingsEntityList';
import { EventCheckboxes } from '@/features/notifications/EventCheckboxes';
import {
  useCreateWebhook,
  useDeleteWebhook,
  useWebhooks,
} from '@/features/notifications/hooks';
import { AVAILABLE_EVENTS } from '@/features/notifications/notificationEvents';

export const WebhooksSection = ({ projectId }: { projectId: string }) => {
  const { data: webhooks, isError, error } = useWebhooks(projectId);
  const createWebhook = useCreateWebhook(projectId);
  const deleteWebhook = useDeleteWebhook(projectId);
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<string[]>(AVAILABLE_EVENTS);

  const handleCreate = () => {
    if (!url) return;
    createWebhook.mutate(
      { url, secret: secret || undefined, events },
      {
        onSuccess: () => {
          setUrl('');
          setSecret('');
          setEvents(AVAILABLE_EVENTS);
        },
      },
    );
  };

  return (
    <div>
      <p className="mb-3 text-xs font-semibold tracking-widest text-base-content/75 uppercase">
        Webhooks
      </p>
      <div className="mb-4 space-y-3">
        <div>
          <label htmlFor="webhook-url" className="label-text label text-xs">
            Webhook URL
          </label>
          <input
            id="webhook-url"
            className="input-bordered input input-sm w-full"
            placeholder="https://hooks.example.com/testcraft"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="webhook-secret" className="label-text label text-xs">
            Secret (optional)
          </label>
          <input
            id="webhook-secret"
            className="input-bordered input input-sm w-full"
            placeholder="whsec_..."
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
          />
          <p className="mt-1 text-xs text-base-content/70">
            Used to sign requests with HMAC-SHA256 so you can verify they came
            from TestCraft.
          </p>
        </div>
        <EventCheckboxes selected={events} onChange={setEvents} />
        <button
          className="btn btn-sm btn-primary"
          onClick={handleCreate}
          disabled={!url || events.length === 0 || createWebhook.isPending}
        >
          Add Webhook
        </button>
      </div>
      {isError ? (
        <ErrorState title="Failed to load webhooks" error={error} />
      ) : (
        <SettingsEntityList
          items={webhooks ?? []}
          getKey={(wh) => wh.id}
          renderPrimary={(wh) => wh.url}
          renderSecondary={(wh) => wh.events.join(', ')}
          onRemove={(wh) => deleteWebhook.mutate(wh.id)}
          removeAriaLabel={(wh) => `Delete webhook ${wh.url}`}
        />
      )}
    </div>
  );
};
