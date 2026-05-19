import { useRef } from "react";
import { Link } from "react-router";

import { ThemeToggle } from "@/components/ThemeToggle";
import { FolderIcon } from "@/components/ui/icons";
import { LogoMark } from "@/layout/LogoMark";

export const Header = () => {
  const drawerRef = useRef<HTMLInputElement>(null);

  const closeMobileNav = () => {
    if (drawerRef.current) drawerRef.current.checked = false;
  };

  return (
    <>
      <nav className="navbar border-border bg-base-200 h-14 border-b px-6 sm:px-8 lg:px-10 header-stripes shrink-0">
        <div className="navbar-start">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-75 text-base-content"
          >
            <LogoMark />
            <span
              className="text-[16px] font-extrabold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              TestCraft
            </span>
          </Link>
        </div>

        <div className="navbar-end gap-1.5">
          <ThemeToggle />
          <label
            htmlFor="mobile-nav-drawer"
            className="btn btn-ghost btn-sm btn-square lg:hidden"
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </label>
        </div>
      </nav>

      <div className="drawer drawer-end lg:hidden">
        <input
          id="mobile-nav-drawer"
          ref={drawerRef}
          type="checkbox"
          className="drawer-toggle"
        />
        <div className="drawer-side z-50">
          <label
            htmlFor="mobile-nav-drawer"
            aria-label="Close menu"
            className="drawer-overlay"
          />
          <div className="bg-base-100 flex min-h-full w-72 flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span
                className="text-sm font-extrabold tracking-tight text-base-content"
                style={{ fontFamily: "var(--font-display)" }}
              >
                TestCraft
              </span>
              <label
                htmlFor="mobile-nav-drawer"
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </label>
            </div>

            <nav
              className="flex flex-1 flex-col gap-0.5 px-3 py-4"
              aria-label="Mobile navigation"
            >
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-base-content/40">
                Menu
              </p>
              <Link
                to="/projects"
                onClick={closeMobileNav}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content transition-colors"
              >
                <FolderIcon size="size-4" />
                Projects
              </Link>
            </nav>

            <div className="border-t border-border p-4 flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
