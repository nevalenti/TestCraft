import { LinkIcon } from "@heroicons/react/24/solid";
import type { NotificationEvent } from "@testcraft/types";
import { useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { SettingsEntityList } from "@/components/ui/SettingsEntityList";
import { SettingsSectionCard } from "@/components/ui/SettingsSectionCard";
import {
  useCreateWebhook,
  useDeleteWebhook,
  useWebhooks,
} from "@/features/notifications/hooks";
import { WebhookForm } from "@/features/notifications/WebhookForm";
import { useDebounce } from "@/hooks/useDebounce";

export const WebhooksSection = ({ projectId }: { projectId: string }) => {
  const { data: webhooks, isError, error, refetch } = useWebhooks(projectId);
  const createWebhook = useCreateWebhook(projectId);
  const deleteWebhook = useDeleteWebhook(projectId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const handleCreate = (data: {
    url: string;
    secret: string;
    events: NotificationEvent[];
  }) => {
    createWebhook.mutate(
      { url: data.url, secret: data.secret || undefined, events: data.events },
      { onSuccess: () => setIsCreateOpen(false) },
    );
  };

  const visibleWebhooks = debouncedSearch
    ? (webhooks ?? []).filter((wh) =>
        wh.url.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : webhooks;

  return (
    <SettingsSectionCard
      action={
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => setIsCreateOpen(true)}
        >
          <LinkIcon className="size-4" aria-hidden="true" />
          New Webhook
        </button>
      }
      icon={LinkIcon}
      title="Webhooks"
      description="Send an HTTP request to your own endpoint on run events."
    >
      {(webhooks?.length ?? 0) > 0 || search ? (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search webhooks…"
          className="mb-4 w-full sm:max-w-sm"
        />
      ) : null}

      {isError ? (
        <ErrorState
          title="Failed to load webhooks"
          error={error}
          onRetry={refetch}
        />
      ) : (
        <SettingsEntityList
          items={visibleWebhooks ?? []}
          getKey={(wh) => wh.id}
          renderPrimary={(wh) => wh.url}
          renderSecondary={(wh) => wh.events.join(", ")}
          onRemove={(wh) => deleteWebhook.mutate(wh.id)}
          removeAriaLabel={(wh) => `Delete webhook ${wh.url}`}
          emptyTitle="No webhooks yet"
        />
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Webhook"
      >
        <WebhookForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          isLoading={createWebhook.isPending}
        />
      </Modal>
    </SettingsSectionCard>
  );
};
