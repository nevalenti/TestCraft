import { DocumentPlusIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
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
  const emptyTitle = hasNotes
    ? "Pick up where you left off"
    : "Start your first note";
  const title = onCreate ? emptyTitle : "Select a note to read it";

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-12">
      <div className="my-auto w-full max-w-2xl">
        <div className="flex flex-col items-center text-center">
          <span className="icon-tile mb-4">
            <PencilSquareIcon className="size-6" aria-hidden="true" />
          </span>
          <h2 className="font-display text-xl font-bold tracking-tight text-base-content">
            {title}
          </h2>
          {onCreate && (
            <button
              type="button"
              className="btn mt-5 gap-2 btn-sm btn-primary"
              onClick={onCreate}
              disabled={isCreating}
            >
              {isCreating ? (
                <span className="loading size-4 loading-spinner" />
              ) : (
                <DocumentPlusIcon className="size-4" aria-hidden="true" />
              )}
              New note
            </button>
          )}
        </div>

        {hasNotes && (
          <section className="mt-10">
            <h3 className="mb-3 text-2xs font-semibold tracking-wider text-fg-subtle uppercase">
              Recently edited
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {recent.map((note) => (
                <li key={note.id}>
                  <Link
                    {...getNoteLink(note)}
                    className="flex h-full flex-col gap-1.5 rounded-xl border border-border bg-base-200/40 p-4 transition-all hover:-translate-y-px hover:border-[color-mix(in_oklab,var(--color-secondary)_40%,var(--color-base-100))] hover:bg-base-200/70 hover:shadow-card"
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
                    <span className="mt-auto pt-1 text-2xs text-fg-subtle">
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
