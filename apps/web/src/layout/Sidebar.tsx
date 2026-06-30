import {
  HomeIcon,
  RectangleStackIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  ArrowRightStartOnRectangleIcon,
  HomeIcon as HomeIconSolid,
  RectangleStackIcon as RectangleStackIconSolid,
  UserIcon as UserIconSolid,
} from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";

import keycloak from "@/auth/keycloak";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoMark } from "@/layout/LogoMark";
import { NavItem } from "@/layout/NavItem";

export const Sidebar = () => {
  const signOutDialogRef = useRef<HTMLDialogElement>(null);
  const displayName =
    keycloak.tokenParsed?.name ?? keycloak.tokenParsed?.preferred_username;

  const confirmSignOut = () => signOutDialogRef.current?.showModal();
  const doSignOut = () =>
    keycloak.logout({ redirectUri: location.origin + "/" });

  return (
    <>
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-base-200 lg:flex">
        <Link
          to="/"
          className="header-stripes flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4 text-base-content transition-opacity hover:opacity-75"
        >
          <LogoMark />
          <span
            className="text-[15px] font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TestCraft
          </span>
        </Link>

        <nav
          className="flex-1 space-y-2 overflow-y-auto px-2 py-3"
          aria-label="Main navigation"
        >
          <NavItem
            to="/"
            label="Dashboard"
            OutlineIcon={HomeIcon}
            SolidIcon={HomeIconSolid}
            fuzzy={false}
          />
          <NavItem
            to="/projects"
            label="Projects"
            OutlineIcon={RectangleStackIcon}
            SolidIcon={RectangleStackIconSolid}
          />

          <NavItem
            to="/account"
            label={displayName ?? "Account"}
            OutlineIcon={UserIcon}
            SolidIcon={UserIconSolid}
          />

          <button
            onClick={confirmSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-base-content/65 transition-colors hover:bg-error/8 hover:text-error"
          >
            <ArrowRightStartOnRectangleIcon
              className="size-[18px] shrink-0"
              aria-hidden="true"
            />
            Sign out
          </button>
        </nav>

        <div className="shrink-0 border-t border-border">
          <div className="flex items-center justify-between px-3 py-1.5">
            <p className="text-[10px] text-base-content/35">© 2026 TestCraft</p>
            <span className="text-base-content/35">
              <ThemeToggle />
            </span>
          </div>
        </div>
      </aside>

      <dialog ref={signOutDialogRef} className="modal">
        <div className="modal-box max-w-sm">
          <h3 className="text-base font-bold">Sign out?</h3>
          <p className="mt-1.5 text-sm text-base-content/60">
            You will be returned to the login page.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => signOutDialogRef.current?.close()}
            >
              Cancel
            </button>
            <button className="btn btn-sm btn-error" onClick={doSignOut}>
              <ArrowRightStartOnRectangleIcon className="size-4" />
              Sign out
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};
