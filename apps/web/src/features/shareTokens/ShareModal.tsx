import { ClipboardIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useRef, useState } from "react";

import { FormInput } from "@/components/ui/form/FormInput";
import { Modal } from "@/components/ui/Modal";
import {
  useCreateShareToken,
  useRevokeShareToken,
  useShareTokens,
} from "@/features/shareTokens/hooks";
import { formatDate, todayLocalDate } from "@/lib/format";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  runId: string;
}

export const ShareModal = ({
  isOpen,
  onClose,
  projectId,
  runId,
}: ShareModalProps) => {
  const { data: tokens, isPending } = useShareTokens(projectId, runId);
  const createToken = useCreateShareToken(projectId, runId);
  const revokeToken = useRevokeShareToken(projectId, runId);
  const [expiresAt, setExpiresAt] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    createToken.mutate(
      { expires_at: expiresAt || undefined },
      {
        onSuccess: (token) => {
          setNewToken(token.token);
          setExpiresAt("");
        },
      },
    );
  };

  const shareUrl = newToken ? `${location.origin}/share/${newToken}` : null;

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      urlInputRef.current?.select();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Test Run">
      <div className="space-y-5">
        {newToken && shareUrl && (
          <div className="rounded-lg border border-success/30 bg-success/5 p-4">
            <p className="mb-2 text-sm font-semibold text-success">
              Share link created
            </p>
            <div className="flex gap-2">
              <input
                ref={urlInputRef}
                readOnly
                value={shareUrl}
                aria-label="Share link URL"
                onFocus={(event) => event.currentTarget.select()}
                className="input input-sm w-full text-xs"
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleCopy}
              >
                <ClipboardIcon className="size-4" aria-hidden="true" />
                {copied ? "Copied!" : "Copy"}
              </button>
              <span role="status" className="sr-only">
                {copied ? "Share link copied to clipboard" : ""}
              </span>
            </div>
            <p className="mt-2 text-xs text-fg-secondary">
              Anyone with this link can view the run results without logging in.
              Copy it now: it will not be shown again.
            </p>
          </div>
        )}

        <div>
          <p className="mb-3 text-xs font-semibold tracking-widest text-fg-secondary uppercase">
            Create Share Link
          </p>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="label-text label text-xs" htmlFor="expires-at">
                Expires (optional)
              </label>
              <FormInput
                id="expires-at"
                type="date"
                className="input-sm"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                min={todayLocalDate()}
              />
            </div>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleCreate}
              disabled={createToken.isPending}
              aria-busy={createToken.isPending}
            >
              {createToken.isPending && (
                <span
                  className="loading loading-xs loading-spinner"
                  aria-hidden="true"
                />
              )}
              Create Link
            </button>
          </div>
        </div>

        {!isPending && tokens && tokens.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold tracking-widest text-fg-secondary uppercase">
              Active Links
            </p>
            <ul className="space-y-2">
              {tokens.map((token) => (
                <li
                  key={token.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-base-200/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs text-fg-secondary">
                      Share link
                    </p>
                    <p className="text-xs text-fg-muted">
                      Created {formatDate(token.created_at)}
                      {token.expires_at &&
                        ` · expires ${formatDate(token.expires_at)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-danger-ghost"
                    onClick={() => revokeToken.mutate(token.id)}
                    aria-label={`Revoke share link created ${formatDate(token.created_at)}`}
                  >
                    <TrashIcon className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};
