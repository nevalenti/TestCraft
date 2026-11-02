import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Link, type LinkOptions } from "@tanstack/react-router";

export const NoteBackLink = (link: LinkOptions) => (
  <Link
    {...link}
    aria-label="All notes"
    className="btn btn-square text-fg-muted btn-ghost btn-sm md:hidden"
  >
    <ArrowLeftIcon className="size-4" aria-hidden="true" />
  </Link>
);
