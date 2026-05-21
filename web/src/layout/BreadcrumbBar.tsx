import { HomeIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router";

import { useBreadcrumbsStore } from "@/stores/breadcrumbs";

export const BreadcrumbBar = () => {
  const breadcrumbs = useBreadcrumbsStore((s) => s.items);

  return (
    <div className="bg-base-100 border-b border-border px-4 sm:px-6 lg:px-8 py-2 flex items-center shrink-0">
      {breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li
                  key={item.href ?? item.label}
                  className="flex items-center gap-2"
                >
                  {index > 0 && (
                    <span
                      className="text-base-content/50 text-xs select-none"
                      aria-hidden="true"
                    >
                      /
                    </span>
                  )}
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="flex items-center text-xs font-medium text-base-content/75 hover:text-base-content transition-colors"
                    >
                      {item.label === "home" ? (
                        <HomeIcon className="size-3" aria-label="Home" />
                      ) : (
                        item.label
                      )}
                    </Link>
                  ) : (
                    <span
                      aria-current={isLast ? "page" : undefined}
                      title={item.label}
                      className={`text-xs font-semibold truncate max-w-48 ${
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
      ) : (
        <div className="skeleton h-4 w-28 rounded" aria-hidden="true" />
      )}
    </div>
  );
};
