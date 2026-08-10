import { EyeIcon } from '@heroicons/react/24/solid';
import type { CreateApiTokenResponse } from '@testcraft/types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ErrorState } from '@/components/ErrorState';
import { SettingsEntityList } from '@/components/ui/SettingsEntityList';
import {
  useApiTokens,
  useCreateApiToken,
  useRevokeApiToken,
} from '@/features/apiTokens/hooks';
import { formatDate, todayLocalDate } from '@/lib/format';

export const ApiTokensSection = ({ projectId }: { projectId: string }) => {
  const { data: tokens, isError, error } = useApiTokens(projectId);
  const createToken = useCreateApiToken(projectId);
  const revokeToken = useRevokeApiToken(projectId);
  const { register, handleSubmit, reset } = useForm<{
    name: string;
    expiresAt: string;
  }>({
    defaultValues: { name: '', expiresAt: '' },
  });
  const [newToken, setNewToken] = useState<CreateApiTokenResponse | null>(null);
  const [revealed, setRevealed] = useState(false);

  const onSubmit = (data: { name: string; expiresAt: string }) => {
    createToken.mutate(
      { name: data.name, expiresAt: data.expiresAt || undefined },
      {
        onSuccess: (response) => {
          setNewToken(response);
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
              type={revealed ? 'text' : 'password'}
              value={newToken.token}
              className="input-bordered input input-sm w-full font-mono text-xs"
            />
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setRevealed((previous) => !previous)}
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
            {...register('name', { required: true })}
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
            min={todayLocalDate()}
            {...register('expiresAt')}
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
            'Create'
          )}
        </button>
      </form>

      {isError ? (
        <ErrorState title="Failed to load API tokens" error={error} />
      ) : (
        <SettingsEntityList
          items={tokens ?? []}
          getKey={(t) => t.id}
          renderPrimary={(t) => t.name}
          renderSecondary={(t) => (
            <>
              Created {formatDate(t.createdAt)}
              {t.lastUsedAt && ` · last used ${formatDate(t.lastUsedAt)}`}
              {t.expiresAt && ` · expires ${formatDate(t.expiresAt)}`}
              {t.isRevoked && ' · revoked'}
            </>
          )}
          onRemove={(t) => revokeToken.mutate(t.id)}
          removeAriaLabel={() => 'Revoke token'}
          removeLabel="Revoke"
          isRemoveHidden={(t) => t.isRevoked}
        />
      )}
    </div>
  );
};
