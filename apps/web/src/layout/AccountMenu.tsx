import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import { useNavigate } from "@tanstack/react-router";

import { keycloak } from "@/auth/keycloak";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useAvatarUrl } from "@/features/account/hooks";
import { getInitials } from "@/lib/format";

export const AccountMenu = () => {
  const navigate = useNavigate();
  const displayName =
    keycloak.tokenParsed?.name ?? keycloak.tokenParsed?.preferred_username;
  const email = keycloak.tokenParsed?.email;
  const initials = displayName ? getInitials(displayName) : undefined;
  const { data: avatarData } = useAvatarUrl();

  return (
    <DropdownMenu
      label="Account menu"
      className="dropdown-end"
      triggerClassName="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-base-200 py-0.5 pr-3 pl-1 shadow-sm transition-all group-data-open:border-primary/50 group-data-open:bg-base-300 group-data-open:shadow-md hover:border-primary/40 hover:bg-base-300 hover:shadow-md"
      menuClassName="z-10 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-base-100 shadow-2xl shadow-black/10"
      trigger={
        <>
          {avatarData?.url ? (
            <img
              src={avatarData.url}
              alt=""
              className="size-7 shrink-0 rounded-full object-cover ring-2 ring-transparent transition-all group-data-open:ring-primary/30"
            />
          ) : (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-content ring-2 ring-transparent transition-all group-data-open:ring-primary/30">
              {initials}
            </span>
          )}
          {displayName && (
            <span className="hidden max-w-24 truncate text-sm font-semibold text-base-content sm:inline">
              {displayName.split(/\s+/, 1)[0]}
            </span>
          )}
          <ChevronDownIcon
            className="size-3.5 shrink-0 text-fg-muted transition-transform duration-200 group-data-open:rotate-180"
            aria-hidden="true"
          />
        </>
      }
    >
      {displayName && (
        <>
          <li>
            <button
              onClick={() => navigate({ to: "/account" })}
              className="group flex w-full cursor-pointer items-center gap-3 bg-base-200/30 px-4 py-3.5 text-left transition-[background-color,box-shadow] duration-150 hover:bg-base-300 hover:shadow-[inset_3px_0_0_var(--color-primary)]"
            >
              {avatarData?.url ? (
                <img
                  src={avatarData.url}
                  alt=""
                  className="size-10 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-primary/20"
                />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-content shadow-sm ring-2 ring-primary/20">
                  {initials}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm leading-tight font-semibold text-base-content">
                  {displayName}
                </p>
                {email && (
                  <p className="mt-0.5 truncate text-xs text-fg-secondary">
                    {email}
                  </p>
                )}
              </div>
              <ChevronRightIcon
                className="size-3.5 shrink-0 text-fg-subtle transition-transform motion-safe:group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </li>
          <li aria-hidden="true">
            <hr className="border-border" />
          </li>
        </>
      )}
      <li className="p-1.5">
        <button
          onClick={() =>
            keycloak.logout({
              redirectUri: location.origin + "/",
            })
          }
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-fg-secondary transition-colors hover:bg-error/10 hover:text-error"
        >
          <ArrowRightStartOnRectangleIcon
            className="size-4"
            aria-hidden="true"
          />
          Sign out
        </button>
      </li>
    </DropdownMenu>
  );
};
