import { Link } from "@tanstack/react-router";

import { useBreadcrumbsStore } from "@/stores/breadcrumbs";

export const BreadcrumbBar = () => {
  const breadcrumbs = useBreadcrumbsStore((store) => store.items);

  const content = () => {
    if (breadcrumbs === null || breadcrumbs.length === 0) return null;

    return (
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <li
                key={item.href ?? item.label}
                className="flex items-center gap-1"
              >
                {index > 0 && (
                  <span
                    className="text-[10px] text-base-content/25 select-none"
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
                    className="flex max-w-48 items-center truncate text-[11px] font-medium text-base-content/50 transition-colors hover:text-base-content/80"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    title={item.label}
                    className={`max-w-64 truncate text-[11px] font-semibold ${
                      isLast ? "text-base-content/80" : "text-base-content/60"
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
    );
  };

  return (
    <div className="flex h-8 shrink-0 items-center border-b border-border bg-base-200/50 px-4 sm:px-6 lg:px-8">
      {content()}
    </div>
  );
};
