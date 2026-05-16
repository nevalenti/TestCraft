import { useRef } from "react";

import { Link } from "react-router";

import { ThemeToggle } from "@/components/ThemeToggle";

export const Header = () => {
  const drawerRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <nav className="navbar border-base-content/10 h-16 border-b px-4">
        <div className="navbar-start">
          <Link
            to="/"
            className="text-primary text-xl font-extrabold whitespace-nowrap shrink-0 transition-opacity hover:opacity-60"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TestCraft
          </Link>
        </div>
        <div className="navbar-end gap-2">
          <label
            htmlFor="mobile-nav-drawer"
            className="btn btn-ghost btn-square lg:hidden"
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
                strokeWidth={2}
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
          <div className="bg-base-100 flex min-h-full w-80 flex-col">
            <div className="flex items-center justify-end px-2 py-1">
              <label
                htmlFor="mobile-nav-drawer"
                className="btn btn-ghost btn-square"
                aria-label="Close menu"
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
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </label>
            </div>
            <nav
              className="flex flex-1 flex-col items-center justify-start gap-4 p-6"
              aria-label="Mobile navigation"
            />
            <div className="p-6">
              <div className="flex justify-center">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
