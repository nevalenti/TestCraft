import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface TablePagerProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const DEFAULT_CLASS =
  'flex items-center justify-between border-t border-border px-4 py-2';

export const TablePager = ({
  page,
  pageCount,
  onPageChange,
  className,
}: TablePagerProps) => {
  if (pageCount <= 1) return null;

  return (
    <div className={className ?? DEFAULT_CLASS}>
      <span className="text-xs text-base-content/55">
        Page{' '}
        <span className="font-semibold text-base-content/80">{page + 1}</span>{' '}
        of {pageCount}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          className="btn btn-square btn-ghost btn-xs"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="size-3.5" />
        </button>
        <button
          type="button"
          className="btn btn-square btn-ghost btn-xs"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount - 1}
          aria-label="Next page"
        >
          <ChevronRightIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
};
