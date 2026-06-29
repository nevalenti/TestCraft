import {
  ArrowRightStartOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  CameraIcon,
} from "@heroicons/react/24/solid";
import { useRef } from "react";

import keycloak from "@/auth/keycloak";
import { useAvatarUrl, useUploadAvatar } from "@/hooks/useAccount";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { env } from "@/lib/env";

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const keycloakAccountUrl = `${env.VITE_KEYCLOAK_URL}/realms/${env.VITE_KEYCLOAK_REALM}/account`;

export const AccountPage = () => {
  const token = keycloak.tokenParsed;
  const displayName = token?.name ?? token?.preferred_username ?? "";
  const email = token?.email as string | undefined;
  const username = token?.preferred_username as string | undefined;
  const firstName = token?.given_name as string | undefined;
  const lastName = token?.family_name as string | undefined;
  const initials = displayName ? getInitials(displayName) : "?";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: avatarData } = useAvatarUrl();
  const { mutate: uploadAvatar, isPending } = useUploadAvatar();

  useBreadcrumbs([{ label: "Account", href: "/account" }]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar(file);
    e.target.value = "";
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-14">
        <div className="overflow-hidden rounded-2xl border border-border bg-base-100 shadow-lg">
          <div className="flex flex-col items-center px-8 py-10 text-center">
            <div className="group relative">
              {avatarData?.url ? (
                <img
                  src={avatarData.url}
                  alt="Avatar"
                  className="size-20 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-content">
                  {initials}
                </span>
              )}

              <button
                type="button"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
                aria-label="Change avatar"
              >
                {isPending ? (
                  <span className="loading loading-sm loading-spinner text-white" />
                ) : (
                  <CameraIcon className="size-6 text-white" />
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <hr className="border-border" />

          <dl className="divide-y divide-border">
            {[
              { label: "First Name", value: firstName ?? "—" },
              { label: "Last Name", value: lastName ?? "—" },
              { label: "Username", value: username ?? "—" },
              { label: "Email", value: email ?? "—" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 px-8 py-4"
              >
                <dt className="text-sm text-base-content/45">{label}</dt>
                <dd className="truncate text-sm font-medium text-base-content">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <hr className="border-border" />

          <div className="flex items-center justify-between px-8 py-5">
            <a
              href={keycloakAccountUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn gap-2 btn-sm"
            >
              <ArrowTopRightOnSquareIcon className="size-3.5" />
              Manage account
            </a>
            <button
              onClick={() =>
                keycloak.logout({ redirectUri: location.origin + "/" })
              }
              className="btn flex cursor-pointer items-center gap-2 btn-sm btn-error"
            >
              <ArrowRightStartOnRectangleIcon className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
