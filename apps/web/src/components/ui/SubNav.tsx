import type { ReactNode } from "react";

interface SubNavProps {
  label: string;
  children: ReactNode;
}

export const SubNav = ({ label, children }: SubNavProps) => (
  <nav
    aria-label={label}
    className="-m-1 inline-flex max-w-full items-center gap-1 overflow-x-auto p-1"
  >
    {children}
  </nav>
);
