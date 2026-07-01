import {
  Bars3Icon,
  Cog6ToothIcon,
  HomeIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import {
  Cog6ToothIcon as Cog6ToothIconSolid,
  HomeIcon as HomeIconSolid,
  RectangleStackIcon as RectangleStackIconSolid,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { AccountMenu } from "@/layout/AccountMenu";
import { LogoMark } from "@/layout/LogoMark";
import { NavItem } from "@/layout/NavItem";

export const Header = () => {
  const drawerRef = useRef<HTMLInputElement>(null);

  const closeDrawer = () => {
    if (drawerRef.current) drawerRef.current.checked = false;
  };

  return (
    <>
      <nav className="header-stripes navbar h-14 shrink-0 border-b border-border bg-base-200 px-3 lg:hidden">
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
          <AccountMenu />
          <ThemeToggle />
        </div>
      </nav>

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
              <NavItem
                to="/settings"
                label="Settings"
                OutlineIcon={Cog6ToothIcon}
                SolidIcon={Cog6ToothIconSolid}
                onClick={closeDrawer}
              />
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};
