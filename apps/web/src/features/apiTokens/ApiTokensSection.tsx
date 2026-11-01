import {
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import type { CreateApiTokenResponse } from "@testcraft/types";
import { useRef, useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { SettingsEntityList } from "@/components/ui/SettingsEntityList";
import { SettingsSectionCard } from "@/components/ui/SettingsSectionCard";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  useApiTokens,
  useCreateApiToken,
  useRevokeApiToken,
} from "@/features/apiTokens/hooks";
import { type TokenAccess, toScopes } from "@/features/apiTokens/scopes";
import { TokenForm } from "@/features/apiTokens/TokenForm";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/format";
import { notify } from "@/lib/notify";

const tokenStatus = (token: {
  is_revoked: boolean;
  expires_at?: string | null;
}) => {
  if (token.is_revoked)
    return {
      label: "Revoked",
      className: "border-border text-fg-muted",
    };
  if (token.expires_at && new Date(token.expires_at) < new Date())
    return { label: "Expired", className: "border-warning/30 text-warning" };
  return { label: "Active", className: "border-success/30 text-success" };
};

export const ApiTokensSection = ({ projectId }: { projectId: string }) => {
  const { data: tokens, isError, error, refetch } = useApiTokens(projectId);
  const createToken = useCreateApiToken(projectId);
  const revokeToken = useRevokeApiToken(projectId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [newToken, setNewToken] = useState<CreateApiTokenResponse | null>(null);
  const [revealed, setRevealed] = useState(false);
  const tokenInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = (data: {
    name: string;
    expiresAt: string;
    access: TokenAccess;
  }) => {
    createToken.mutate(
      {
        name: data.name,
        expires_at: data.expiresAt || undefined,
        scopes: toScopes(data.access),
      },
      {
        onSuccess: (response) => {
          setNewToken(response);
          setRevealed(false);
          setIsCreateOpen(false);
        },
      },
    );
  };

  const handleReveal = () => {
    setRevealed((previous) => !previous);
    requestAnimationFrame(() => tokenInputRef.current?.select());
  };

  const handleCopy = () => {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken.token);
    notify("Token copied to clipboard");
  };

  const visibleTokens = debouncedSearch
    ? (tokens ?? []).filter((token) =>
        token.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : tokens;

  return (
    <SettingsSectionCard
      icon={KeyIcon}
      title="API Tokens"
      description="Authenticate CI pipelines and scripts against the TestCraft API."
    >
      <div className="space-y-4">
        {newToken && (
          <div className="card-bg-warning rounded-xl border p-4">
            <p className="mb-2 text-sm font-semibold text-warning">
              Copy your token — it won{"'"}t be shown again
            </p>
            <div className="flex gap-2">
              <input
                ref={tokenInputRef}
                readOnly
                type={revealed ? "text" : "password"}
                value={newToken.token}
                className="input-bordered input input-sm w-full font-mono text-xs"
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleReveal}
                aria-label={revealed ? "Hide token" : "Reveal token"}
              >
                {revealed ? (
                  <EyeSlashIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleCopy}
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <ListToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search tokens…"
        >
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setIsCreateOpen(true)}
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            New Token
          </button>
        </ListToolbar>

        {isError ? (
          <ErrorState
            title="Failed to load API tokens"
            error={error}
            onRetry={refetch}
          />
        ) : (
          <SettingsEntityList
            items={visibleTokens ?? []}
            getKey={(t) => t.id}
            renderPrimary={(t) => (
              <span className="inline-flex items-center gap-2">
                <span>{t.name}</span>
                <StatusPill {...tokenStatus(t)} />
              </span>
            )}
            renderSecondary={(t) => (
              <>
                Created {formatDate(t.created_at)}
                {t.last_used_at && ` · last used ${formatDate(t.last_used_at)}`}
                {t.expires_at && ` · expires ${formatDate(t.expires_at)}`}
                {` · ${t.scopes.join(", ")}`}
              </>
            )}
            onRemove={(t) => revokeToken.mutate(t.id)}
            removeAriaLabel={() => "Revoke token"}
            removeLabel="Revoke"
            isRemoveHidden={(t) => t.is_revoked}
            emptyTitle="No API tokens yet"
            emptyDescription="Create a token to authenticate CI pipelines and scripts."
          />
        )}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New API Token"
        size="lg"
      >
        <TokenForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          isLoading={createToken.isPending}
        />
      </Modal>
    </SettingsSectionCard>
  );
};
