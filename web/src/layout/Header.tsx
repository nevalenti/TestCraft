import {
  Bars3Icon,
  FolderIcon,
  HomeIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoMark } from "@/layout/LogoMark";

export const Header = () => {
  const drawerRef = useRef<HTMLInputElement>(null);

  const closeMobileNav = () => {
    if (drawerRef.current) drawerRef.current.checked = false;
  };

  return (
    <>
      <nav className="navbar border-border bg-base-200 h-14 border-b px-4 sm:px-6 lg:px-8 header-stripes shrink-0">
        <div className="flex-1 flex items-center min-w-0">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-75 text-base-content shrink-0"
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

        <div className="flex items-center gap-1.5 shrink-0">
          <ThemeToggle />
          <label
            htmlFor="mobile-nav-drawer"
            className="btn btn-ghost btn-sm btn-square lg:hidden"
            aria-label="Open menu"
          >
            <Bars3Icon className="size-5" aria-hidden="true" />
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
                <XMarkIcon className="size-4" aria-hidden="true" />
              </label>
            </div>

            <nav
              className="flex flex-1 flex-col gap-0.5 px-3 py-4"
              aria-label="Mobile navigation"
            >
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-base-content/55">
                Menu
              </p>
              <Link
                to="/"
                onClick={closeMobileNav}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-base-content/80 hover:bg-base-200 hover:text-base-content transition-colors"
              >
                <HomeIcon className="size-4" aria-hidden="true" />
                Overview
              </Link>
              <Link
                to="/projects"
                onClick={closeMobileNav}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-base-content/80 hover:bg-base-200 hover:text-base-content transition-colors"
              >
                <FolderIcon className="size-4" aria-hidden="true" />
                Projects
              </Link>
            </nav>

            <div className="border-t border-border p-4 text-center">
              <p className="text-[10px] text-base-content/40">
                &copy; 2026 TestCraft
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
