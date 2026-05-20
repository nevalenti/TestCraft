import { Link } from "react-router";

import { useBreadcrumbsStore } from "@/stores/breadcrumbs";

const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="size-3"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
    <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
  </svg>
);

export const BreadcrumbBar = () => {
  const breadcrumbs = useBreadcrumbsStore((s) => s.items);

  if (breadcrumbs.length === 0) return null;

  return (
    <div className="bg-base-100 border-b border-border px-4 sm:px-6 lg:px-8 py-2 flex items-center shrink-0">
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
                  <span className="text-base-content/20 text-xs select-none">
                    /
                  </span>
                )}
                {item.href ? (
                  <Link
                    to={item.href}
                    className="flex items-center text-[11px] font-medium text-primary/70 hover:text-primary transition-colors"
                  >
                    {item.label === "home" ? <HomeIcon /> : item.label}
                  </Link>
                ) : (
                  <span
                    className={`text-[11px] font-semibold truncate max-w-48 ${
                      isLast ? "text-base-content" : "text-base-content/60"
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
    </div>
  );
};
