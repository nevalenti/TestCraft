import {
  BookOpenIcon,
  Cog6ToothIcon,
  HomeIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import {
  Cog6ToothIcon as Cog6ToothIconSolid,
  HomeIcon as HomeIconSolid,
  RectangleStackIcon as RectangleStackIconSolid,
} from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";

import { LogoMark } from "@/layout/LogoMark";
import { NavItem } from "@/layout/NavItem";

export const Sidebar = () => {
  return (
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
          to="/settings"
          label="Settings"
          OutlineIcon={Cog6ToothIcon}
          SolidIcon={Cog6ToothIconSolid}
        />
        <a
          href="/docs/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-base-content/85 transition-colors hover:bg-base-content/6 hover:text-base-content"
        >
          <BookOpenIcon className="size-[18px] shrink-0" />
          Documentation
        </a>
      </nav>
    </aside>
  );
};
