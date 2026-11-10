import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useRef } from "react";

import { useSlashToFocus } from "@/hooks/useSlashToFocus";
import { cn } from "@/lib/cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  label,
  size = "md",
  className,
}: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useSlashToFocus(inputRef);

  return (
    <label className={cn("relative block min-w-0", className)}>
      <MagnifyingGlassIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 z-10 size-3.5 -translate-y-1/2 text-fg-subtle"
      />
      <input
        ref={inputRef}
        type="search"
        aria-label={label ?? placeholder.replace(/…$/, "")}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (!(event.key === "Escape" && value)) {
            return;
          }

          event.stopPropagation();
          onChange("");
        }}
        className={cn(
          "input w-full border-border bg-base-100 pl-8 text-sm",
          size === "sm" ? "input-sm" : "h-9",
          "pr-8 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear input"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute top-1/2 right-1.5 z-10 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-fg-subtle transition-colors hover-surface hover:text-base-content"
        >
          <XMarkIcon className="size-3.5" aria-hidden="true" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 z-10 -translate-y-1/2 rounded border border-border bg-base-200 px-1.5 font-mono text-3xs leading-4 text-fg-subtle">
          /
        </kbd>
      )}
    </label>
  );
};
