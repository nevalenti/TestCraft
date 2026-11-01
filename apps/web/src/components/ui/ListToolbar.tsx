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
    className="sticky -top-5 z-10 -mt-5 mb-4 flex flex-col gap-3 bg-base-300 pt-5 pb-2 sm:flex-row sm:items-center"
  >
    <SearchInput
      value={search}
      onChange={onSearch}
      placeholder={placeholder}
      className="w-full sm:max-w-sm"
    />
    {children && (
      <div className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto sm:shrink-0">
        {children}
      </div>
    )}
  </div>
);
