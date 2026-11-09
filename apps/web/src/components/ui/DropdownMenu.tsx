import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/cn";

interface DropdownMenuProps {
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  menuClassName?: string;
  className?: string;
  children: ReactNode;
}

export const DropdownMenu = ({
  label,
  trigger,
  triggerClassName,
  menuClassName,
  className,
  children,
}: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }
      const items = [
        ...(menuRef.current?.querySelectorAll<HTMLElement>(
          ":is(a[href], button:not(:disabled))",
        ) ?? []),
      ];
      if (
        items.length === 0 ||
        !containerRef.current?.contains(document.activeElement)
      )
        return;
      const current = items.indexOf(document.activeElement as HTMLElement);
      const target = {
        ArrowDown: items[(current + 1) % items.length],
        ArrowUp: items[(current - 1 + items.length) % items.length],
        Home: items[0],
        End: items.at(-1),
      }[event.key];
      if (!target) return;
      event.preventDefault();
      target.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node))
        setIsOpen(false);
    };
    const handleItemClick = (event: MouseEvent) => {
      if ((event.target as Element).closest("button, a")) setIsOpen(false);
    };
    const menu = menuRef.current;
    addEventListener("keydown", handleKeyDown);
    addEventListener("pointerdown", handlePointerDown);
    menu?.addEventListener("click", handleItemClick);
    return () => {
      removeEventListener("keydown", handleKeyDown);
      removeEventListener("pointerdown", handlePointerDown);
      menu?.removeEventListener("click", handleItemClick);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      data-open={isOpen || undefined}
      className={cn(
        "group dropdown",
        isOpen ? "dropdown-open" : "dropdown-close",
        className,
      )}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setIsOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((previous) => !previous)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown") return;
          event.preventDefault();
          setIsOpen(true);
          requestAnimationFrame(() =>
            menuRef.current
              ?.querySelector<HTMLElement>(
                ":is(a[href], button:not(:disabled))",
              )
              ?.focus(),
          );
        }}
        className={triggerClassName}
      >
        {trigger}
      </button>
      <ul
        ref={menuRef}
        id={menuId}
        hidden={!isOpen}
        className={cn("dropdown-content", menuClassName)}
      >
        {children}
      </ul>
    </div>
  );
};
