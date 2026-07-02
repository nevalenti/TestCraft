import { Link, useMatchRoute } from "@tanstack/react-router";

import { cn } from "@/lib/cn";

type NavItemProps = {
  to: string;
  label: React.ReactNode;
  OutlineIcon: React.ComponentType<{ className?: string }>;
  SolidIcon: React.ComponentType<{ className?: string }>;
  fuzzy?: boolean;
  hideIcon?: boolean;
  onClick?: () => void;
};

export const NavItem = ({
  to,
  label,
  OutlineIcon,
  SolidIcon,
  fuzzy = true,
  hideIcon = false,
  onClick,
}: NavItemProps) => {
  const matchRoute = useMatchRoute();
  const isActive = !!matchRoute({ to: to as never, fuzzy });

  return (
    <Link
      to={to as never}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
        isActive
          ? "bg-primary/12 font-semibold text-primary"
          : "font-medium text-base-content/85 hover:bg-base-content/6 hover:text-base-content",
      )}
    >
      {!hideIcon &&
        (isActive ? (
          <SolidIcon className="size-[18px] shrink-0" />
        ) : (
          <OutlineIcon className="size-[18px] shrink-0" />
        ))}
      {label}
    </Link>
  );
};
