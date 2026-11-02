import {
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  BookOpenIcon,
  DocumentTextIcon,
  HomeIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import {
  DocumentTextIcon as DocumentTextIconSolid,
  HomeIcon as HomeIconSolid,
  RectangleStackIcon as RectangleStackIconSolid,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { AccountMenu } from "@/layout/AccountMenu";
import { LogoMark } from "@/layout/LogoMark";
import { NavItem } from "@/layout/NavItem";

const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
  <>
    <NavItem
      to="/"
      label="Dashboard"
      OutlineIcon={HomeIcon}
      SolidIcon={HomeIconSolid}
      fuzzy={false}
      onClick={onNavigate}
    />
    <NavItem
      to="/projects"
      label="Projects"
      OutlineIcon={RectangleStackIcon}
      SolidIcon={RectangleStackIconSolid}
      onClick={onNavigate}
    />
    <NavItem
      to="/notes"
      label="Notes"
      OutlineIcon={DocumentTextIcon}
      SolidIcon={DocumentTextIconSolid}
      onClick={onNavigate}
    />
  </>
);

export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeDrawer = () => setIsDrawerOpen(false);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsDrawerOpen(false);
      openButtonRef.current?.focus();
    };
    addEventListener("keydown", handleKeyDown);
    return () => removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen]);

  return (
    <>
      <nav
        className="header-stripes navbar relative z-20 h-12 shrink-0 gap-2 border-b border-border bg-base-300 px-3 sm:px-4 lg:h-14"
        aria-label="Main navigation"
      >
        <div className="flex flex-1 items-center gap-1">
          <button
            ref={openButtonRef}
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="btn btn-square btn-ghost btn-sm lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-nav-panel"
          >
            <Bars3Icon className="size-5" aria-hidden="true" />
          </button>
          <Link
            to="/"
            className="flex min-w-0 shrink-0 items-center gap-2 text-base-content transition-opacity hover:opacity-75"
          >
            <LogoMark />
            <span className="font-display text-[15px] font-extrabold tracking-tight">
              TestCraft
            </span>
          </Link>
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          <NavLinks />
          <a
            href="/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-fg-secondary transition-colors hover:bg-base-content/6 hover:text-base-content"
          >
            <BookOpenIcon className="size-[18px] shrink-0" aria-hidden="true" />
            Documentation
            <ArrowTopRightOnSquareIcon
              className="size-3.5 shrink-0 text-fg-subtle"
              aria-hidden="true"
            />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1">
          <AccountMenu />
        </div>
      </nav>

      <div className="drawer lg:hidden">
        <input
          id="mobile-nav-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isDrawerOpen}
          onChange={(event) => setIsDrawerOpen(event.target.checked)}
          tabIndex={-1}
          aria-hidden="true"
        />
        <div
          className="drawer-side z-50"
          onTransitionEnd={(event) => {
            if (
              isDrawerOpen &&
              event.target === event.currentTarget &&
              event.propertyName === "visibility"
            )
              closeButtonRef.current?.focus();
          }}
        >
          <label
            htmlFor="mobile-nav-drawer"
            aria-label="Close menu"
            className="drawer-overlay"
          />
          <div
            id="mobile-nav-panel"
            className="flex min-h-full w-64 flex-col bg-base-100"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2.5">
                <LogoMark />
                <span className="font-display text-[15px] font-extrabold tracking-tight text-base-content">
                  TestCraft
                </span>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => {
                  closeDrawer();
                  openButtonRef.current?.focus();
                }}
                className="btn btn-square btn-ghost btn-sm"
                aria-label="Close menu"
              >
                <XMarkIcon className="size-4" aria-hidden="true" />
              </button>
            </div>

            <nav
              className="flex flex-1 flex-col space-y-0.5 px-2 py-3"
              aria-label="Mobile navigation"
            >
              <NavLinks onNavigate={closeDrawer} />
              <a
                href="/docs/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeDrawer}
                className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-fg-secondary transition-colors hover:bg-base-content/6 hover:text-base-content"
              >
                <BookOpenIcon
                  className="size-[18px] shrink-0"
                  aria-hidden="true"
                />
                Documentation
                <ArrowTopRightOnSquareIcon
                  className="size-3.5 shrink-0 text-fg-subtle"
                  aria-hidden="true"
                />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};
