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
    <input
      type="search"
      className="input-bordered input w-full max-w-sm bg-base-200"
      placeholder={placeholder}
      value={search}
      onChange={(event) => onSearch(event.target.value)}
    />
    <div className="ml-auto flex shrink-0 items-center gap-2">{children}</div>
  </div>
);
