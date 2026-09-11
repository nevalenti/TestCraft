import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

interface ListToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  children: React.ReactNode;
}

export const ListToolbar = ({
  search,
  onSearch,
  placeholder,
  children,
}: ListToolbarProps) => (
  // -top-5/-mt-5/pt-5 offset by .page-content's own padding-top (1.25rem)
  // so the sticky bar sits flush with the scroll container's edge instead
  // of leaving a gap the list can peek through while scrolling.
  <div className="sticky -top-5 z-10 -mt-5 mb-4 flex items-center gap-3 bg-base-100 pt-5 pb-2">
    <div className="relative w-full max-w-sm">
      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-base-content/60" />
      <input
        type="search"
        className="input-bordered input w-full bg-base-200/60 pl-8 text-sm"
        placeholder={placeholder}
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
    </div>
    <div className="ml-auto flex shrink-0 items-center gap-2">{children}</div>
  </div>
);
