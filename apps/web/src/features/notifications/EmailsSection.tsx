import { EnvelopeIcon, PlusIcon } from "@heroicons/react/24/solid";
import type { NotificationEvent } from "@testcraft/types";
import { useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { SettingsEntityList } from "@/components/ui/SettingsEntityList";
import { SettingsSectionCard } from "@/components/ui/SettingsSectionCard";
import { EmailForm } from "@/features/notifications/EmailForm";
import {
  useCreateEmail,
  useDeleteEmail,
  useEmails,
} from "@/features/notifications/hooks";
import { useDebounce } from "@/hooks/useDebounce";

export const EmailsSection = ({ projectId }: { projectId: string }) => {
  const { data: emailSubs, isError, error, refetch } = useEmails(projectId);
  const createEmail = useCreateEmail(projectId);
  const deleteEmail = useDeleteEmail(projectId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const handleCreate = (data: {
    email: string;
    events: NotificationEvent[];
  }) => {
    createEmail.mutate(data, { onSuccess: () => setIsCreateOpen(false) });
  };

  const visibleSubs = debouncedSearch
    ? (emailSubs ?? []).filter((sub) =>
        sub.email.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : emailSubs;

  return (
    <SettingsSectionCard
      icon={EnvelopeIcon}
      title="Email Subscriptions"
      description="Send an email to an address on run events."
    >
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search email subscriptions…"
      >
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setIsCreateOpen(true)}
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          New Email
        </button>
      </ListToolbar>

      {isError ? (
        <ErrorState
          title="Failed to load email subscriptions"
          error={error}
          onRetry={refetch}
        />
      ) : (
        <SettingsEntityList
          items={visibleSubs ?? []}
          getKey={(sub) => sub.id}
          renderPrimary={(sub) => sub.email}
          renderSecondary={(sub) => sub.events.join(", ")}
          onRemove={(sub) => deleteEmail.mutate(sub.id)}
          removeAriaLabel={(sub) => `Delete email subscription ${sub.email}`}
          emptyTitle="No email subscriptions yet"
          emptyDescription="Add an email to get notified on run events."
        />
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Email Subscription"
      >
        <EmailForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          isLoading={createEmail.isPending}
        />
      </Modal>
    </SettingsSectionCard>
  );
};
