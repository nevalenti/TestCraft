import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";

import keycloak from "@/auth/keycloak";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoMark } from "@/layout/LogoMark";

export const Header = () => {
  const drawerRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <nav className="header-stripes navbar h-14 shrink-0 border-b border-border bg-base-200 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5 text-base-content transition-opacity hover:opacity-75"
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

        <div className="flex shrink-0 items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() =>
              keycloak.logout({ redirectUri: window.location.origin + "/" })
            }
            className="btn btn-circle btn-ghost btn-sm"
            aria-label="Sign out"
          >
            <ArrowRightStartOnRectangleIcon
              className="size-5"
              aria-hidden="true"
            />
          </button>
          <label
            htmlFor="mobile-nav-drawer"
            className="btn btn-square btn-ghost btn-sm lg:hidden"
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
          <div className="flex min-h-full w-72 flex-col bg-base-100">
            <div className="flex items-center justify-between border-b border-border p-4">
              <span
                className="text-sm font-extrabold tracking-tight text-base-content"
                style={{ fontFamily: "var(--font-display)" }}
              ></span>
              <label
                htmlFor="mobile-nav-drawer"
                className="btn btn-square btn-ghost btn-sm"
                aria-label="Close menu"
              >
                <XMarkIcon className="size-4" aria-hidden="true" />
              </label>
            </div>

            <nav
              className="flex flex-1 flex-col gap-0.5 px-3 py-4"
              aria-label="Mobile navigation"
            ></nav>

            <div className="border-t border-border p-4 text-center"></div>
          </div>
        </div>
      </div>
    </>
  );
};
