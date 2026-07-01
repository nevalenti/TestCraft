import { Link } from "@tanstack/react-router";

import { ThemeToggle } from "@/components/ThemeToggle";
import { AccountMenu } from "@/layout/AccountMenu";
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
                    className="text-xs text-base-content/30 select-none"
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
                    className="flex max-w-48 items-center truncate text-xs font-medium text-base-content/60 transition-colors hover:text-base-content/80"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    title={item.label}
                    className={`max-w-64 truncate text-xs font-semibold ${
                      isLast ? "text-base-content/80" : "text-base-content/70"
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
    <div className="header-stripes flex h-10 shrink-0 items-center border-b border-border bg-base-200/50 px-4 sm:px-6 lg:h-14 lg:px-8">
      {content()}
      <div className="ml-auto hidden items-center gap-2 lg:flex">
        <AccountMenu />
        <ThemeToggle />
      </div>
    </div>
  );
};
