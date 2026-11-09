import { SearchInput } from "@/components/ui/SearchInput";

interface ListToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  children?: React.ReactNode;
}

export const ListToolbar = ({
  search,
  onSearch,
  placeholder,
  children,
}: ListToolbarProps) => (
  <div
    data-list-toolbar
    className="mb-4 flex flex-col gap-3 pb-2 sm:grid sm:grid-cols-[1fr_minmax(0,24rem)_1fr] sm:items-center"
  >
    <SearchInput
      value={search}
      onChange={onSearch}
      placeholder={placeholder}
      className="w-full sm:col-start-2"
    />
    {children && (
      <div className="flex flex-wrap items-center justify-end gap-2 sm:col-start-3">
        {children}
      </div>
    )}
  </div>
);
