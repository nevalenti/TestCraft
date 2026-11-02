import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/solid";
import { Link, type LinkOptions } from "@tanstack/react-router";
import type { Note } from "@testcraft/types";

import { DEFAULT_NOTE_TITLE } from "@/features/notes/constants";
import { formatRelativeTime } from "@/lib/format";

const RECENT_COUNT = 4;

interface NotesIndexPaneProps {
  notes: Note[] | undefined;
  getNoteLink: (note: Note) => LinkOptions;
  onCreate?: () => void;
  isCreating?: boolean;
}

export const NotesIndexPane = ({
  notes,
  getNoteLink,
  onCreate,
  isCreating,
}: NotesIndexPaneProps) => {
  const recent = (notes ?? [])
    .toSorted((first, second) =>
      second.updated_at.localeCompare(first.updated_at),
    )
    .slice(0, RECENT_COUNT);
  const hasNotes = recent.length > 0;
  const editableDescription = hasNotes
    ? "Open a recent note, or start something new. Everything autosaves as you type."
    : "Write runbooks, checklists and snippets in Markdown or code. Everything autosaves as you type.";
  const description = onCreate
    ? editableDescription
    : "Select a note from the list to read it.";

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-12">
      <div className="my-auto w-full max-w-2xl">
        <div className="flex flex-col items-center text-center">
          <span className="card-bg-primary mb-4 flex size-12 items-center justify-center rounded-2xl border text-primary">
            <PencilSquareIcon className="size-6" aria-hidden="true" />
          </span>
          <h2 className="font-display text-xl font-bold tracking-tight text-base-content">
            {hasNotes ? "Pick up where you left off" : "Start your first note"}
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-fg-muted">{description}</p>
          {onCreate && (
            <button
              type="button"
              className="btn mt-5 btn-primary"
              onClick={onCreate}
              disabled={isCreating}
            >
              {isCreating ? (
                <span className="loading size-4 loading-spinner" />
              ) : (
                <PlusIcon className="size-4" aria-hidden="true" />
              )}
              New note
            </button>
          )}
        </div>

        {hasNotes && (
          <section className="mt-10">
            <h3 className="mb-3 text-[11px] font-semibold tracking-wider text-fg-subtle uppercase">
              Recently edited
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {recent.map((note) => (
                <li key={note.id}>
                  <Link
                    {...getNoteLink(note)}
                    className="flex h-full flex-col gap-1.5 rounded-xl border border-border bg-base-200/40 p-4 transition-all hover:-translate-y-px hover:border-primary/40 hover:bg-base-200/70 hover:shadow-card"
                  >
                    <span className="truncate text-sm font-semibold text-base-content">
                      {note.title || DEFAULT_NOTE_TITLE}
                    </span>
                    <span className="line-clamp-2 min-h-[2lh] text-xs leading-relaxed text-fg-subtle">
                      {note.excerpt || (
                        <span className="italic opacity-70">
                          {note.size_bytes === 0 ? "Empty note" : "No preview"}
                        </span>
                      )}
                    </span>
                    <span className="mt-auto pt-1 text-[11px] text-fg-subtle">
                      {formatRelativeTime(note.updated_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};
