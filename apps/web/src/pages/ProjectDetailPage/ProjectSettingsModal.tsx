import { EyeIcon, TrashIcon } from "@heroicons/react/24/solid";
import type { CreateApiTokenResponse } from "@testcraft/types";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Modal } from "@/components/ui/Modal";
import {
  useApiTokens,
  useCreateApiToken,
  useRevokeApiToken,
} from "@/hooks/useApiTokens";
import {
  useCreateEmail,
  useCreateWebhook,
  useDeleteEmail,
  useDeleteWebhook,
  useEmails,
  useWebhooks,
} from "@/hooks/useNotifications";
import {
  useAddProjectMember,
  useProjectMembers,
  useRemoveProjectMember,
} from "@/hooks/useProjectMembers";
import { formatDate } from "@/lib/format";

const AVAILABLE_EVENTS = ["RunCompleted", "FailureThresholdExceeded"];

function EventCheckboxes({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (event: string) =>
    onChange(
      selected.includes(event)
        ? selected.filter((e) => e !== event)
        : [...selected, event],
    );

  return (
    <div className="flex flex-wrap gap-3">
      {AVAILABLE_EVENTS.map((ev) => (
        <label
          key={ev}
          className="flex cursor-pointer items-center gap-1.5 text-sm"
        >
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={selected.includes(ev)}
            onChange={() => toggle(ev)}
          />
          {ev}
        </label>
      ))}
    </div>
  );
}

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  isOwner: boolean;
}

type Tab = "tokens" | "notifications" | "members";

export function ProjectSettingsModal({
  isOpen,
  onClose,
  projectId,
  isOwner,
}: ProjectSettingsModalProps) {
  const [tab, setTab] = useState<Tab>("tokens");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Settings">
      <div className="mb-5 flex gap-1">
        <button
          className={`btn btn-sm ${tab === "tokens" ? "btn-neutral" : "btn-ghost"}`}
          onClick={() => setTab("tokens")}
        >
          API Tokens
        </button>
        <button
          className={`btn btn-sm ${tab === "notifications" ? "btn-neutral" : "btn-ghost"}`}
          onClick={() => setTab("notifications")}
        >
          Notifications
        </button>
        {isOwner && (
          <button
            className={`btn btn-sm ${tab === "members" ? "btn-neutral" : "btn-ghost"}`}
            onClick={() => setTab("members")}
          >
            Members
          </button>
        )}
      </div>

      {tab === "tokens" && <ApiTokensSection projectId={projectId} />}
      {tab === "notifications" && (
        <NotificationsSection projectId={projectId} />
      )}
      {tab === "members" && isOwner && <MembersSection projectId={projectId} />}
    </Modal>
  );
}

function ApiTokensSection({ projectId }: { projectId: string }) {
  const { data: tokens } = useApiTokens(projectId);
  const createToken = useCreateApiToken(projectId);
  const revokeToken = useRevokeApiToken(projectId);
  const { register, handleSubmit, reset } = useForm<{
    name: string;
    expiresAt: string;
  }>({
    defaultValues: { name: "", expiresAt: "" },
  });
  const [newToken, setNewToken] = useState<CreateApiTokenResponse | null>(null);
  const [revealed, setRevealed] = useState(false);

  const onSubmit = (data: { name: string; expiresAt: string }) => {
    createToken.mutate(
      { name: data.name, expiresAt: data.expiresAt || undefined },
      {
        onSuccess: (res) => {
          setNewToken(res);
          setRevealed(false);
          reset();
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      {newToken && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <p className="mb-1 text-sm font-semibold text-warning">
            Copy your token — it won{"'"}t be shown again
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              type={revealed ? "text" : "password"}
              value={newToken.token}
              className="input-bordered input input-sm w-full font-mono text-xs"
            />
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setRevealed((r) => !r)}
            >
              <EyeIcon className="size-4" />
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigator.clipboard.writeText(newToken.token)}
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="token-name" className="label-text label text-xs">
            Token name
          </label>
          <input
            id="token-name"
            className="input-bordered input input-sm w-full"
            placeholder="e.g. CI pipeline"
            {...register("name", { required: true })}
          />
        </div>
        <div className="w-36">
          <label htmlFor="token-expires" className="label-text label text-xs">
            Expires (optional)
          </label>
          <input
            id="token-expires"
            type="date"
            className="input-bordered input input-sm w-full"
            min={new Date().toISOString().split("T", 1)[0]}
            {...register("expiresAt")}
          />
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-primary"
          disabled={createToken.isPending}
        >
          {createToken.isPending ? (
            <span className="loading loading-xs loading-spinner" />
          ) : (
            "Create"
          )}
        </button>
      </form>

      {tokens && tokens.length > 0 && (
        <ul className="space-y-2">
          {tokens.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-base-200/40 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-base-content/65">
                  Created {formatDate(t.createdAt)}
                  {t.lastUsedAt && ` · last used ${formatDate(t.lastUsedAt)}`}
                  {t.expiresAt && ` · expires ${formatDate(t.expiresAt)}`}
                  {t.isRevoked && " · revoked"}
                </p>
              </div>
              {!t.isRevoked && (
                <button
                  className="btn text-error btn-ghost btn-xs"
                  onClick={() => revokeToken.mutate(t.id)}
                  aria-label="Revoke token"
                >
                  <TrashIcon className="size-3.5" />
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MembersSection({ projectId }: { projectId: string }) {
  const { data: members } = useProjectMembers(projectId);
  const addMember = useAddProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);
  const [email, setEmail] = useState("");

  const handleAdd = () => {
    if (!email) return;
    addMember.mutate(
      { email },
      {
        onSuccess: () => setEmail(""),
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="member-email" className="label-text label text-xs">
            Add member by email
          </label>
          <input
            id="member-email"
            type="email"
            className="input-bordered input input-sm w-full"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          className="btn btn-sm btn-primary"
          onClick={handleAdd}
          disabled={!email || addMember.isPending}
        >
          {addMember.isPending ? (
            <span className="loading loading-xs loading-spinner" />
          ) : (
            "Add"
          )}
        </button>
      </div>

      {members && members.length > 0 && (
        <ul className="space-y-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-base-200/40 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {member.displayName ?? member.email}
                </p>
                <p className="truncate text-xs text-base-content/65">
                  {member.email} · added {formatDate(member.createdAt)}
                </p>
              </div>
              <button
                className="btn text-error btn-ghost btn-xs"
                onClick={() => removeMember.mutate(member.id)}
                aria-label={`Remove ${member.email}`}
              >
                <TrashIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationsSection({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-8">
      <WebhooksSection projectId={projectId} />
      <EmailsSection projectId={projectId} />
    </div>
  );
}

function WebhooksSection({ projectId }: { projectId: string }) {
  const { data: webhooks } = useWebhooks(projectId);
  const createWebhook = useCreateWebhook(projectId);
  const deleteWebhook = useDeleteWebhook(projectId);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState<string[]>(AVAILABLE_EVENTS);

  const handleCreate = () => {
    if (!url) return;
    createWebhook.mutate(
      { url, secret: secret || undefined, events },
      {
        onSuccess: () => {
          setUrl("");
          setSecret("");
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
        <input
          className="input-bordered input input-sm w-full"
          placeholder="https://hooks.example.com/testcraft"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="input-bordered input input-sm w-full"
          placeholder="Secret (optional, for HMAC verification)"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <EventCheckboxes selected={events} onChange={setEvents} />
        <button
          className="btn btn-sm btn-primary"
          onClick={handleCreate}
          disabled={!url || events.length === 0 || createWebhook.isPending}
        >
          Add Webhook
        </button>
      </div>
      {webhooks && webhooks.length > 0 && (
        <ul className="space-y-2">
          {webhooks.map((wh) => (
            <li
              key={wh.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-base-200/40 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{wh.url}</p>
                <p className="text-xs text-base-content/65">
                  {wh.events.join(", ")}
                </p>
              </div>
              <button
                className="btn text-error btn-ghost btn-xs"
                onClick={() => deleteWebhook.mutate(wh.id)}
              >
                <TrashIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmailsSection({ projectId }: { projectId: string }) {
  const { data: emailSubs } = useEmails(projectId);
  const createEmail = useCreateEmail(projectId);
  const deleteEmail = useDeleteEmail(projectId);
  const [email, setEmail] = useState("");
  const [events, setEvents] = useState<string[]>(AVAILABLE_EVENTS);

  const handleCreate = () => {
    if (!email) return;
    createEmail.mutate(
      { email, events },
      {
        onSuccess: () => {
          setEmail("");
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
          onChange={(e) => setEmail(e.target.value)}
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
      {emailSubs && emailSubs.length > 0 && (
        <ul className="space-y-2">
          {emailSubs.map((sub) => (
            <li
              key={sub.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-base-200/40 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{sub.email}</p>
                <p className="text-xs text-base-content/65">
                  {sub.events.join(", ")}
                </p>
              </div>
              <button
                className="btn text-error btn-ghost btn-xs"
                onClick={() => deleteEmail.mutate(sub.id)}
              >
                <TrashIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
