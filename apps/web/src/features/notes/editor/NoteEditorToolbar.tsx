import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
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

const pluralize = (count: number, noun: string) =>
  `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;

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
        "flex h-7 items-center gap-1.5 rounded-lg px-2.5 font-medium transition-colors",
        mode === target
          ? "bg-primary/12 font-semibold text-primary"
          : "text-fg-muted hover:text-base-content",
        className,
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <header className="flex flex-col gap-2 border-b border-border px-3 pt-3 pb-2.5 lg:px-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-[18px]"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M9.5 4v16" strokeDasharray="2 2.4" />
            </svg>
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
          className="min-w-48 flex-1 truncate rounded-lg bg-transparent px-2 py-1 font-display text-2xl font-extrabold tracking-tight text-base-content transition-colors outline-none placeholder:text-fg-subtle hover:bg-base-200/40 read-only:hover:bg-transparent focus:bg-base-200/60"
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

          {isMarkdown && (
            <div
              role="group"
              aria-label="View mode"
              className="flex items-center gap-0.5 rounded-xl border border-border bg-base-300/60 p-0.5"
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
            menuClassName="menu z-20 mt-1 w-60 rounded-xl border border-border bg-base-100 p-1.5 text-sm shadow-popover"
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
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-2 text-xs text-fg-subtle lg:pl-2">
        <div className="relative inline-flex items-center">
          <select
            className="h-6 cursor-pointer appearance-none rounded-lg border border-secondary/40 bg-secondary/12 pr-6 pl-2.5 text-xs font-semibold text-secondary outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 disabled:cursor-default disabled:opacity-100"
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
              <option
                key={option.value}
                value={option.value}
                className="bg-base-100 text-base-content"
              >
                {option.label}
              </option>
            ))}
          </select>
          {!readOnly && (
            <ChevronDownIcon
              className="pointer-events-none absolute right-2 size-3 text-secondary"
              aria-hidden="true"
            />
          )}
        </div>

        {updatedAt && (
          <>
            <span aria-hidden="true">·</span>
            <span>Edited {formatElapsed(updatedAt)} ago</span>
          </>
        )}
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">
          {pluralize(countLines(value.content), "line")} ·{" "}
          {pluralize(countWords(value.content), "word")} ·{" "}
          {value.content.length.toLocaleString()} chars
        </span>
      </div>
    </header>
  );
};
