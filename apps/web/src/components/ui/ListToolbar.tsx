import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

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
  <div className="mb-4 flex items-center gap-3">
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
