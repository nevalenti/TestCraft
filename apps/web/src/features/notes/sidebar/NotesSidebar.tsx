import {
  DocumentTextIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import { Link, type LinkOptions } from "@tanstack/react-router";
import type { Note } from "@testcraft/types";
import { Fragment, type ReactNode, useEffect, useRef } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SearchInput } from "@/components/ui/SearchInput";
import { DEFAULT_NOTE_TITLE } from "@/features/notes/constants";
import {
  DEFAULT_NOTE_LANGUAGE,
  languageShortLabel,
} from "@/features/notes/editor/noteLanguages";
import {
  groupNotesByRecency,
  type NoteGroup,
} from "@/features/notes/noteDates";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

const groupNotes = (notes: Note[]): NoteGroup[] =>
  groupNotesByRecency(
    notes.toSorted((first, second) =>
      second.updated_at.localeCompare(first.updated_at),
    ),
  );

const highlight = (text: string, query: string): ReactNode => {
  const needle = query.trim().toLowerCase();
  if (!needle) return text;
  const index = text.toLowerCase().indexOf(needle);
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-primary/30 text-inherit">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  );
};

interface NotesSidebarProps {
  notes: Note[] | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  search: string;
  activeSearch: string;
  onSearchChange: (search: string) => void;
  activeNoteId?: string;
  getNoteLink: (note: Note) => LinkOptions;
  onCreate?: () => void;
  isCreating?: boolean;
  scope: "personal" | "project";
}

const SCOPE_COPY = {
  personal: {
    title: "My notes",
    hint: "Only you can see these",
    Icon: LockClosedIcon,
  },
  project: {
    title: "Project notes",
    hint: "Shared with project members",
    Icon: UserGroupIcon,
  },
} as const;

export const NotesSidebar = ({
  notes,
  isPending,
  isError,
  error,
  onRetry,
  search,
  activeSearch,
  onSearchChange,
  activeNoteId,
  getNoteLink,
  onCreate,
  isCreating,
  scope,
}: NotesSidebarProps) => {
  const { title, hint, Icon: ScopeIcon } = SCOPE_COPY[scope];
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    addEventListener("keydown", focusSearch);
    return () => removeEventListener("keydown", focusSearch);
  }, []);

  const noteNoun = notes?.length === 1 ? "note" : "notes";
  const countLabel = `${notes?.length ?? 0} ${noteNoun}`;

  const renderNote = (note: Note) => {
    const isActive = note.id === activeNoteId;

    return (
      <li key={note.id}>
        <Link
          {...getNoteLink(note)}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "flex min-w-0 flex-col gap-1 rounded-lg border px-3 py-2.5 transition-colors",
            isActive
              ? "border-base-content/10 bg-base-content/10"
              : "border-transparent hover:bg-base-content/5",
          )}
        >
          <span className="flex min-w-0 items-baseline gap-2">
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm font-semibold",
                isActive ? "text-base-content" : "text-fg-secondary",
              )}
              title={note.title}
            >
              {highlight(note.title || DEFAULT_NOTE_TITLE, activeSearch)}
            </span>
            <time
              dateTime={note.updated_at}
              className="shrink-0 text-[11px] text-fg-subtle tabular-nums"
            >
              {formatRelativeTime(note.updated_at)}
            </time>
          </span>
          {note.excerpt ? (
            <span className="line-clamp-2 text-xs leading-relaxed text-fg-subtle">
              {note.language !== DEFAULT_NOTE_LANGUAGE && (
                <span className="mr-1.5 rounded bg-base-content/8 px-1 py-px font-mono text-[10px] font-semibold text-fg-muted">
                  {languageShortLabel(note.language)}
                </span>
              )}
              {note.excerpt}
            </span>
          ) : (
            note.size_bytes === 0 && (
              <span className="text-xs text-fg-subtle italic">Empty note</span>
            )
          )}
        </Link>
      </li>
    );
  };

  const renderList = () => {
    if (isError)
      return (
        <ErrorState
          title="Failed to load notes"
          error={error}
          onRetry={onRetry}
        />
      );

    if (isPending && !notes)
      return (
        <ul aria-label="Loading notes" className="flex flex-col gap-1 px-2">
          {Array.from({ length: 5 }, (_, index) => (
            <li key={index} className="flex flex-col gap-2 p-3">
              <span className="h-3.5 w-2/3 animate-pulse rounded bg-base-content/10" />
              <span className="h-3 w-full animate-pulse rounded bg-base-content/6" />
            </li>
          ))}
        </ul>
      );

    if (!notes?.length)
      return activeSearch ? (
        <EmptyState
          icon={<MagnifyingGlassIcon className="size-5" />}
          title="No notes match"
          description={`Nothing titled "${activeSearch}".`}
          action={
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => onSearchChange("")}
            >
              Clear search
            </button>
          }
        />
      ) : (
        <EmptyState
          icon={<DocumentTextIcon className="size-5" />}
          title="No notes yet"
          description={
            onCreate
              ? "Runbooks, snippets, scratch thoughts — keep them here."
              : "Nobody has written a note here yet."
          }
        />
      );

    return (
      <div className="flex flex-col pt-2 pb-3">
        {groupNotes(notes).map((group) => (
          <Fragment key={group.label || "all"}>
            {group.label && (
              <h3 className="sticky top-0 z-1 bg-(--notes-list-bg) px-5 py-2 text-[11px] font-semibold tracking-wider text-fg-subtle uppercase">
                {group.label}
              </h3>
            )}
            <ul className="flex flex-col gap-0.5 px-2">
              {group.notes.map(renderNote)}
            </ul>
          </Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-4 border-b border-border px-4 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-base-content">
              {title}
              {notes && (
                <span
                  aria-label={countLabel}
                  className="rounded-full bg-base-content/10 px-2 py-px font-sans text-xs font-semibold text-fg-muted tabular-nums"
                >
                  {notes.length}
                </span>
              )}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-fg-subtle">
              <ScopeIcon className="size-3.5 shrink-0" aria-hidden="true" />
              {hint}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SearchInput
            inputRef={searchRef}
            value={search}
            onChange={onSearchChange}
            placeholder="Search titles…"
            label="Search notes"
            shortcut="/"
            className="flex-1"
          />
          {onCreate && (
            <button
              type="button"
              className="btn btn-square size-9 min-h-0 shrink-0 btn-primary"
              onClick={onCreate}
              disabled={isCreating}
              aria-label="New note"
              title="New note"
            >
              {isCreating ? (
                <span className="loading size-4 loading-spinner" />
              ) : (
                <PlusIcon className="size-4.5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>

      <nav aria-label="Note list" className="min-h-0 flex-1 overflow-y-auto">
        {renderList()}
      </nav>
    </div>
  );
};
