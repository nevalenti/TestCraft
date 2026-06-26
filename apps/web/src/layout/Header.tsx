import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";

import keycloak from "@/auth/keycloak";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoMark } from "@/layout/LogoMark";

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const Header = () => {
  const drawerRef = useRef<HTMLInputElement>(null);
  const displayName =
    keycloak.tokenParsed?.name ?? keycloak.tokenParsed?.preferred_username;
  const email = keycloak.tokenParsed?.email;
  const initials = displayName ? getInitials(displayName) : undefined;

  return (
    <>
      <nav className="header-stripes navbar h-14 shrink-0 border-b border-border bg-base-100 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5 text-base-content transition-opacity hover:opacity-75"
          >
            <LogoMark />
            <span
              className="text-[15px] font-extrabold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              TestCraft
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn gap-2 pl-2 btn-ghost btn-sm"
              aria-label="Account menu"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-content">
                {initials}
              </span>
              {displayName && (
                <span className="hidden max-w-32 truncate text-sm sm:inline">
                  {displayName}
                </span>
              )}
              <ChevronDownIcon
                className="size-3 opacity-40"
                aria-hidden="true"
              />
            </div>
            <ul className="dropdown-content menu z-10 mt-2 w-fit max-w-64 min-w-52 rounded-xl border border-border bg-base-100 p-1.5 shadow-lg">
              {displayName && (
                <>
                  <li className="p-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-content">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-base-content">
                          {displayName}
                        </p>
                        {email && (
                          <p className="truncate text-xs text-base-content/55">
                            {email}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                  <li>
                    <hr className="my-1 border-border" />
                  </li>
                </>
              )}
              <li>
                <button
                  onClick={() =>
                    keycloak.logout({
                      redirectUri: location.origin + "/",
                    })
                  }
                  className="gap-2 text-sm text-base-content/70"
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
