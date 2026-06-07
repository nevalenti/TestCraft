import { Link } from "@tanstack/react-router";

import { useBreadcrumbsStore } from "@/stores/breadcrumbs";

export const BreadcrumbBar = () => {
  const breadcrumbs = useBreadcrumbsStore((store) => store.items);

  return (
    <div className="flex h-9 shrink-0 items-center border-b border-border bg-base-100 px-4 sm:px-6 lg:px-8">
      {breadcrumbs.length === 0 ? (
        <div className="h-5 w-28 skeleton rounded" aria-hidden="true" />
      ) : (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li
                  key={item.href ?? item.label}
                  className="flex items-center gap-1.5"
                >
                  {index > 0 && (
                    <span
                      className="text-xs text-base-content/40 select-none"
                      aria-hidden="true"
                    >
                      /
                    </span>
                  )}
                  {item.href ? (
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      to={item.href as any}
                      title={item.label}
                      className="flex max-w-48 items-center truncate text-xs font-medium text-base-content/65 transition-colors hover:text-base-content"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={isLast ? "page" : undefined}
                      title={item.label}
                      className={`max-w-64 truncate text-xs font-semibold ${
                        isLast ? "text-base-content" : "text-base-content/80"
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
    </div>
  );
};
