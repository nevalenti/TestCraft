import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";
import { useBreadcrumbsStore } from "@/stores/breadcrumbs";

export const BreadcrumbBar = () => {
  const breadcrumbs = useBreadcrumbsStore((store) => store.items);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (nav) nav.scrollLeft = nav.scrollWidth;
  }, [breadcrumbs]);

  if (breadcrumbs === null || breadcrumbs.length === 0) return null;

  return (
    <div className="header-stripes hidden h-9 shrink-0 items-center border-b border-border bg-base-300 px-4 sm:flex sm:px-6 lg:h-10 lg:px-8">
      <nav
        ref={navRef}
        aria-label="Breadcrumb"
        className="min-w-0 overflow-x-auto"
      >
        <ol className="flex items-center gap-1">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <li
                key={item.href ?? item.label}
                className="flex shrink-0 items-center gap-1"
              >
                {index > 0 && (
                  <span
                    className="text-sm text-fg-subtle select-none"
                    aria-hidden="true"
                  >
                    /
                  </span>
                )}
                {item.href ? (
                  <Link
                    to={item.href}
                    activeOptions={{ exact: true }}
                    title={item.label}
                    className="flex max-w-28 items-center truncate text-sm font-medium text-fg-secondary transition-colors hover:text-base-content sm:max-w-48"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    title={item.label}
                    className={cn(
                      "max-w-40 truncate text-sm font-semibold sm:max-w-64",
                      isLast ? "text-base-content" : "text-fg-secondary",
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
