import { useState } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { SettingsEntityList } from '@/components/ui/SettingsEntityList';
import { EventCheckboxes } from '@/features/notifications/EventCheckboxes';
import {
  useCreateEmail,
  useDeleteEmail,
  useEmails,
} from '@/features/notifications/hooks';
import { AVAILABLE_EVENTS } from '@/features/notifications/notificationEvents';

export const EmailsSection = ({ projectId }: { projectId: string }) => {
  const { data: emailSubs, isError, error, refetch } = useEmails(projectId);
  const createEmail = useCreateEmail(projectId);
  const deleteEmail = useDeleteEmail(projectId);
  const [email, setEmail] = useState('');
  const [events, setEvents] = useState<string[]>(AVAILABLE_EVENTS);

  const handleCreate = () => {
    if (!email) return;
    createEmail.mutate(
      { email, events },
      {
        onSuccess: () => {
          setEmail('');
          setEvents(AVAILABLE_EVENTS);
        },
      },
    );
  };

  return (
    <div>
      <p className="mb-3 text-xs font-semibold tracking-widest text-base-content/75 uppercase">
        Email Subscriptions
      </p>
      <div className="mb-4 space-y-3">
        <input
          type="email"
          className="input-bordered input input-sm w-full"
          placeholder="alerts@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <EventCheckboxes selected={events} onChange={setEvents} />
        <button
          className="btn btn-sm btn-primary"
          onClick={handleCreate}
          disabled={!email || events.length === 0 || createEmail.isPending}
        >
          Add Email
        </button>
      </div>
      {isError ? (
        <ErrorState
          title="Failed to load email subscriptions"
          error={error}
          onRetry={refetch}
        />
      ) : (
        <SettingsEntityList
          items={emailSubs ?? []}
          getKey={(sub) => sub.id}
          renderPrimary={(sub) => sub.email}
          renderSecondary={(sub) => sub.events.join(', ')}
          onRemove={(sub) => deleteEmail.mutate(sub.id)}
          removeAriaLabel={(sub) => `Delete email subscription ${sub.email}`}
        />
      )}
    </div>
  );
};
