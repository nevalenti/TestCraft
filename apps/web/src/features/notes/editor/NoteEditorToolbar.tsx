import {
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  ListBulletIcon,
  PencilIcon,
  TrashIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/solid";
import type {
  Dispatch,
  KeyboardEvent,
  ReactNode,
  RefObject,
  SetStateAction,
} from "react";

import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { DEFAULT_NOTE_TITLE } from "@/features/notes/constants";
import { NoteEditorStatus } from "@/features/notes/editor/NoteEditorStatus";
import {
  NOTE_LANGUAGES,
  noteFileName,
} from "@/features/notes/editor/noteLanguages";
import type { NoteEditorValue } from "@/features/notes/editor/useNoteAutosave";
import { useNotesWorkspace } from "@/features/notes/workspace/notesWorkspaceContext";
import { cn } from "@/lib/cn";
import { formatElapsed } from "@/lib/format";
import { notify } from "@/lib/notify";

export type ViewMode = "write" | "split" | "preview";

const countLines = (content: string) =>
  content === "" ? 0 : content.split("\n").length;

const countWords = (content: string) => {
  const trimmed = content.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
};

const SAVE_MODIFIER = /Mac|iPhone|iPad/.test(navigator.userAgent)
  ? "⌘"
  : "Ctrl";

interface NoteEditorToolbarProps {
  value: NoteEditorValue;
  setValue: Dispatch<SetStateAction<NoteEditorValue>>;
  titleRef: RefObject<HTMLInputElement | null>;
  onTitleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  readOnly: boolean;
  mode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onRetrySave: () => void;
  isSaving: boolean;
  saveInProgress: boolean;
  hasTitle: boolean;
  saveError: unknown;
  hasConflict: boolean;
  onResolveConflict: (keep: "mine" | "theirs") => void;
  isDirty: boolean;
  onDelete?: () => void;
  updatedAt?: string;
  leading?: ReactNode;
}

export const NoteEditorToolbar = ({
  value,
  setValue,
  titleRef,
  onTitleKeyDown,
  readOnly,
  mode,
  onViewModeChange,
  onRetrySave,
  isSaving,
  saveInProgress,
  hasTitle,
  saveError,
  hasConflict,
  onResolveConflict,
  isDirty,
  onDelete,
  updatedAt,
  leading,
}: NoteEditorToolbarProps) => {
  const workspace = useNotesWorkspace();
  const isMarkdown = value.language === "markdown";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value.content);
      notify("Copied to clipboard");
    } catch {
      notify("Could not copy to clipboard", "error");
    }
  };

  const handleDownload = () => {
    const url = URL.createObjectURL(
      new Blob([value.content], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = noteFileName(value.title, value.language);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const viewModeButton = (
    target: ViewMode,
    label: string,
    icon: ReactNode,
    className?: string,
  ) => (
    <button
      type="button"
      aria-pressed={mode === target}
      onClick={() => onViewModeChange(target)}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
        mode === target
          ? "bg-base-100 text-base-content shadow-sm"
          : "text-fg-muted hover:text-base-content",
        className,
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <header className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border px-3 py-2 lg:px-4">
      {leading}
      {workspace && (
        <button
          type="button"
          onClick={workspace.toggleSidebar}
          aria-label={
            workspace.isSidebarCollapsed ? "Show note list" : "Hide note list"
          }
          aria-pressed={!workspace.isSidebarCollapsed}
          title={`${workspace.isSidebarCollapsed ? "Show" : "Hide"} note list (${SAVE_MODIFIER}+B)`}
          className="btn hidden btn-square text-fg-muted btn-ghost btn-sm md:inline-flex"
        >
          <ListBulletIcon className="size-4" aria-hidden="true" />
        </button>
      )}

      <input
        ref={titleRef}
        value={value.title}
        onChange={(event) =>
          setValue((previous) => ({
            ...previous,
            title: event.target.value,
          }))
        }
        onKeyDown={onTitleKeyDown}
        readOnly={readOnly}
        maxLength={255}
        placeholder={DEFAULT_NOTE_TITLE}
        aria-label="Note title"
        className="min-w-48 flex-1 truncate rounded-lg bg-transparent px-2 py-1 font-display text-lg font-bold tracking-tight text-base-content transition-colors outline-none placeholder:text-fg-subtle hover:bg-base-200/40 read-only:hover:bg-transparent focus:bg-base-200/60"
      />

      <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2 text-xs">
        <div
          className="flex items-center whitespace-nowrap"
          aria-live="polite"
          title={
            readOnly
              ? undefined
              : `Autosaves as you type · ${SAVE_MODIFIER}+S to save now`
          }
        >
          <NoteEditorStatus
            readOnly={readOnly}
            isSaving={isSaving}
            saveInProgress={saveInProgress}
            hasTitle={hasTitle}
            saveError={saveError}
            hasConflict={hasConflict}
            onResolveConflict={onResolveConflict}
            isDirty={isDirty}
            onRetry={onRetrySave}
          />
        </div>

        <select
          className="select w-auto rounded-md border-transparent bg-base-200/60 select-xs pr-7 pl-2.5 font-medium hover:border-border disabled:border-transparent disabled:bg-base-200/60 disabled:text-fg-muted"
          disabled={readOnly}
          value={value.language}
          onChange={(event) =>
            setValue((previous) => ({
              ...previous,
              language: event.target.value,
            }))
          }
          aria-label="Note language"
        >
          {NOTE_LANGUAGES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {isMarkdown && (
          <div
            role="group"
            aria-label="View mode"
            className="flex items-center gap-0.5 rounded-lg bg-base-200/70 p-0.5"
          >
            {viewModeButton(
              "write",
              readOnly ? "Source" : "Write",
              <PencilIcon className="size-3" aria-hidden="true" />,
            )}
            {viewModeButton(
              "split",
              "Split",
              <ViewColumnsIcon className="size-3" aria-hidden="true" />,
              "hidden lg:flex",
            )}
            {viewModeButton(
              "preview",
              "Preview",
              <EyeIcon className="size-3" aria-hidden="true" />,
            )}
          </div>
        )}

        <DropdownMenu
          label="Note actions"
          trigger={
            <EllipsisHorizontalIcon className="size-5" aria-hidden="true" />
          }
          triggerClassName="btn btn-square text-fg-muted btn-ghost btn-sm"
          className="dropdown-end"
          menuClassName="menu z-20 mt-1 w-60 rounded-xl border border-border bg-base-100 p-1.5 text-sm shadow-2xl shadow-black/20"
        >
          <li>
            <button type="button" onClick={handleCopy}>
              <ClipboardDocumentIcon className="size-4" />
              Copy content
            </button>
          </li>
          <li>
            <button type="button" onClick={handleDownload}>
              <ArrowDownTrayIcon className="size-4" />
              Download file
            </button>
          </li>
          {onDelete && (
            <li>
              <button
                type="button"
                className="text-error hover:bg-error/10"
                onClick={onDelete}
              >
                <TrashIcon className="size-4" />
                Delete note
              </button>
            </li>
          )}
          <li className="my-1 h-px bg-border" aria-hidden="true" />
          <li className="pointer-events-none flex flex-col gap-0.5 px-3 py-1.5 text-xs text-fg-subtle tabular-nums">
            {updatedAt && <span>Edited {formatElapsed(updatedAt)} ago</span>}
            <span>
              {countLines(value.content).toLocaleString()} lines ·{" "}
              {countWords(value.content).toLocaleString()} words ·{" "}
              {value.content.length.toLocaleString()} chars
            </span>
          </li>
        </DropdownMenu>
      </div>
    </header>
  );
};
