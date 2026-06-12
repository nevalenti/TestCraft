import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  ChevronDownIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";

import keycloak from "@/auth/keycloak";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoMark } from "@/layout/LogoMark";

export const Header = () => {
  const drawerRef = useRef<HTMLInputElement>(null);
  const displayName =
    keycloak.tokenParsed?.name ?? keycloak.tokenParsed?.preferred_username;

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
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn gap-1.5 btn-ghost btn-sm"
              aria-label="Account menu"
            >
              <UserCircleIcon className="size-5" aria-hidden="true" />
              {displayName && (
                <span className="hidden max-w-32 truncate sm:inline">
                  {displayName}
                </span>
              )}
              <ChevronDownIcon
                className="size-3.5 opacity-50"
                aria-hidden="true"
              />
            </div>
            <ul className="dropdown-content menu z-10 mt-2 w-44 rounded-box bg-base-100 p-2 shadow-md">
              <li>
                <ThemeToggle />
              </li>
              <li>
                <button
                  onClick={() =>
                    keycloak.logout({
                      redirectUri: globalThis.location.origin + "/",
                    })
                  }
                >
                  <ArrowRightStartOnRectangleIcon
                    className="size-4"
                    aria-hidden="true"
                  />
                  Sign out
                </button>
              </li>
            </ul>
          </div>
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
