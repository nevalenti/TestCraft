import { LinkIcon, PlusIcon } from "@heroicons/react/24/solid";
import type { NotificationEvent } from "@testcraft/types";
import { useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
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
      icon={LinkIcon}
      title="Webhooks"
      description="Send an HTTP request to your own endpoint on run events."
    >
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search webhooks…"
      >
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setIsCreateOpen(true)}
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          New Webhook
        </button>
      </ListToolbar>

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
          emptyDescription="Add a webhook to get notified on run events."
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
