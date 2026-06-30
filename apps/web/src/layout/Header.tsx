import {
  Bars3Icon,
  HomeIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon as HomeIconSolid,
  RectangleStackIcon as RectangleStackIconSolid,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Link, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";

import keycloak from "@/auth/keycloak";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAvatarUrl } from "@/hooks/useAccount";
import { LogoMark } from "@/layout/LogoMark";
import { NavItem } from "@/layout/NavItem";

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
  const navigate = useNavigate();
  const displayName =
    keycloak.tokenParsed?.name ?? keycloak.tokenParsed?.preferred_username;
  const email = keycloak.tokenParsed?.email;
  const initials = displayName ? getInitials(displayName) : undefined;
  const { data: avatarData } = useAvatarUrl();

  const closeDrawer = () => {
    if (drawerRef.current) drawerRef.current.checked = false;
  };

  return (
    <>
      {/* Mobile topbar — hidden on desktop */}
      <nav className="header-stripes navbar h-14 shrink-0 border-b border-border bg-base-100 px-3 lg:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <label
            htmlFor="mobile-nav-drawer"
            className="btn btn-square btn-ghost btn-sm"
            aria-label="Open navigation menu"
          >
            <Bars3Icon className="size-5" aria-hidden="true" />
          </label>
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 text-base-content transition-opacity hover:opacity-75"
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

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn gap-2 pl-2 btn-ghost btn-sm"
              aria-label="Account menu"
            >
              {avatarData?.url ? (
                <img
                  src={avatarData.url}
                  alt="Avatar"
                  className="size-6 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-content">
                  {initials}
                </span>
              )}
              <ChevronDownIcon
                className="size-3 opacity-40"
                aria-hidden="true"
              />
            </div>
            <ul className="dropdown-content z-10 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-base-100 shadow-xl">
              {displayName && (
                <>
                  <li>
                    <button
                      onClick={() => {
                        navigate({ to: "/account" });
                        (document.activeElement as HTMLElement)?.blur();
                      }}
                      className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-base-200/60"
                    >
                      {avatarData?.url ? (
                        <img
                          src={avatarData.url}
                          alt="Avatar"
                          className="size-9 shrink-0 rounded-full object-cover ring-2 ring-primary/20"
                        />
                      ) : (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-content ring-2 ring-primary/20">
                          {initials}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm leading-tight font-semibold text-base-content">
                          {displayName}
                        </p>
                        {email && (
                          <p className="mt-0.5 truncate text-xs text-base-content/60">
                            {email}
                          </p>
                        )}
                      </div>
                      <ChevronRightIcon
                        className="size-3.5 shrink-0 text-base-content/35 transition-transform motion-safe:group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                  <li aria-hidden="true">
                    <hr className="border-border" />
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
                  className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-sm text-base-content/65 transition-colors hover:bg-error/8 hover:text-error"
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

      {/* Mobile nav drawer */}
      <div className="drawer lg:hidden">
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
          <div className="flex min-h-full w-64 flex-col bg-base-100">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2.5">
                <LogoMark />
                <span
                  className="text-[15px] font-extrabold tracking-tight text-base-content"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  TestCraft
                </span>
              </div>
              <label
                htmlFor="mobile-nav-drawer"
                className="btn btn-square btn-ghost btn-sm"
                aria-label="Close menu"
              >
                <XMarkIcon className="size-4" aria-hidden="true" />
              </label>
            </div>

            <nav
              className="flex-1 space-y-0.5 px-2 py-3"
              aria-label="Mobile navigation"
            >
              <NavItem
                to="/"
                label="Dashboard"
                OutlineIcon={HomeIcon}
                SolidIcon={HomeIconSolid}
                fuzzy={false}
                onClick={closeDrawer}
              />
              <NavItem
                to="/projects"
                label="Projects"
                OutlineIcon={RectangleStackIcon}
                SolidIcon={RectangleStackIconSolid}
                onClick={closeDrawer}
              />
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};
