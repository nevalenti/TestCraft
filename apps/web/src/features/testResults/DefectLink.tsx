import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

export const DefectLink = ({ url }: { url: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
  >
    <ArrowTopRightOnSquareIcon className="size-3.5" aria-hidden="true" />
    Defect link
    <span className="sr-only">(opens in a new tab)</span>
  </a>
);
