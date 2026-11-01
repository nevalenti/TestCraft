import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import type { Ref } from "react";

import { cn } from "@/lib/cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  shortcut?: string;
  size?: "sm" | "md";
  inputRef?: Ref<HTMLInputElement>;
  className?: string;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  label,
  shortcut,
  size = "md",
  inputRef,
  className,
}: SearchInputProps) => (
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
        shortcut && "pr-8",
      )}
    />
    {shortcut && !value && (
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 z-10 -translate-y-1/2 rounded border border-border bg-base-200 px-1.5 font-mono text-[10px] leading-4 text-fg-subtle">
        {shortcut}
      </kbd>
    )}
  </label>
);
