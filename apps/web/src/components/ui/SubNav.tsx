import type { ReactNode } from "react";

interface SubNavProps {
  label: string;
  children: ReactNode;
}

export const SubNav = ({ label, children }: SubNavProps) => (
  <nav
    aria-label={label}
    className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl bg-base-content/6 p-1"
  >
    {children}
  </nav>
);
