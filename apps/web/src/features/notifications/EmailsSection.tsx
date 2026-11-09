import { EnvelopeIcon } from "@heroicons/react/24/solid";
import type { NotificationEvent } from "@testcraft/types";
import { useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
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
      action={
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => setIsCreateOpen(true)}
        >
          <EnvelopeIcon className="size-4" aria-hidden="true" />
          New Email
        </button>
      }
      icon={EnvelopeIcon}
      title="Email Subscriptions"
      description="Send an email to an address on run events."
    >
      {(emailSubs?.length ?? 0) > 0 || search ? (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search email subscriptions…"
          className="mb-4 w-full sm:max-w-sm"
        />
      ) : null}

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
