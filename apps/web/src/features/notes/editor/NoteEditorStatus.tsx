import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";

interface NoteEditorStatusProps {
  readOnly: boolean;
  isSaving: boolean;
  saveInProgress: boolean;
  hasTitle: boolean;
  saveError: unknown;
  hasConflict: boolean;
  onResolveConflict: (keep: "mine" | "theirs") => void;
  isDirty: boolean;
  onRetry: () => void;
}

export const NoteEditorStatus = ({
  readOnly,
  isSaving,
  saveInProgress,
  hasTitle,
  saveError,
  hasConflict,
  onResolveConflict,
  isDirty,
  onRetry,
}: NoteEditorStatusProps) => {
  if (readOnly)
    return (
      <span className="flex items-center gap-1.5 text-fg-muted">
        <LockClosedIcon className="size-3.5" aria-hidden="true" />
        View only
      </span>
    );
  if (isSaving || saveInProgress)
    return (
      <span className="flex items-center gap-1.5 text-fg-muted">
        <span className="loading size-3 loading-spinner" />
        Saving…
      </span>
    );
  if (!hasTitle)
    return (
      <span className="flex items-center gap-1.5 text-warning">
        <ExclamationCircleIcon className="size-3.5" aria-hidden="true" />
        Add a title to save
      </span>
    );
  if (hasConflict)
    return (
      <span className="flex items-center gap-1.5 text-warning" role="alert">
        <ExclamationCircleIcon className="size-3.5" aria-hidden="true" />
        Changed elsewhere:
        <button
          type="button"
          className="hover:underline"
          onClick={() => onResolveConflict("mine")}
        >
          Keep mine
        </button>
        ·
        <button
          type="button"
          className="hover:underline"
          onClick={() => onResolveConflict("theirs")}
        >
          Load theirs
        </button>
      </span>
    );
  if (saveError)
    return (
      <button
        type="button"
        className="flex items-center gap-1.5 text-error hover:underline"
        onClick={onRetry}
      >
        <ExclamationCircleIcon className="size-3.5" aria-hidden="true" />
        Save failed. Retry
      </button>
    );
  if (isDirty)
    return (
      <span className="flex items-center gap-1.5 text-fg-muted">
        <span className="size-1.5 rounded-full bg-warning" />
        Unsaved changes
      </span>
    );

  return (
    <span className="flex items-center gap-1.5 text-fg-muted">
      <CheckCircleIcon className="size-3.5 text-success" aria-hidden="true" />
      Saved
    </span>
  );
};
