import { ClipboardIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import {
  useCreateShareToken,
  useRevokeShareToken,
  useShareTokens,
} from "@/hooks/useShareTokens";
import { formatDate } from "@/lib/format";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  runId: string;
}

export function ShareModal({
  isOpen,
  onClose,
  projectId,
  runId,
}: ShareModalProps) {
  const { data: tokens, isPending } = useShareTokens(projectId, runId);
  const createToken = useCreateShareToken(projectId, runId);
  const revokeToken = useRevokeShareToken(projectId, runId);
  const [expiresAt, setExpiresAt] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    createToken.mutate(
      { expiresAt: expiresAt || undefined },
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

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                readOnly
                value={shareUrl}
                className="input-bordered input input-sm w-full text-xs"
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                <ClipboardIcon className="size-4" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-base-content/60">
              Anyone with this link can view the run results without logging in.
            </p>
          </div>
        )}

        <div>
          <p className="mb-3 text-xs font-semibold tracking-widest text-base-content/60 uppercase">
            Create Share Link
          </p>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="label-text label text-xs" htmlFor="expires-at">
                Expires (optional)
              </label>
              <input
                id="expires-at"
                type="date"
                className="input-bordered input input-sm w-full"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T", 1)[0]}
              />
            </div>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleCreate}
              disabled={createToken.isPending}
            >
              {createToken.isPending ? (
                <span className="loading loading-xs loading-spinner" />
              ) : (
                "Create Link"
              )}
            </button>
          </div>
        </div>

        {!isPending && tokens && tokens.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold tracking-widest text-base-content/60 uppercase">
              Active Links
            </p>
            <ul className="space-y-2">
              {tokens.map((token) => (
                <li
                  key={token.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-base-200/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-base-content/70">
                      /share/{token.token.slice(0, 12)}…
                    </p>
                    <p className="text-xs text-base-content/50">
                      Created {formatDate(token.createdAt)}
                      {token.expiresAt &&
                        ` · expires ${formatDate(token.expiresAt)}`}
                    </p>
                  </div>
                  <button
                    className="btn text-error btn-ghost btn-xs"
                    onClick={() => revokeToken.mutate(token.id)}
                    aria-label="Revoke share link"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
