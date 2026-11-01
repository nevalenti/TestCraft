import {
  ArrowRightStartOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  CameraIcon,
} from "@heroicons/react/24/solid";
import { useRef, useState } from "react";

import { keycloak } from "@/auth/keycloak";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAvatarUrl, useUploadAvatar } from "@/features/account/hooks";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { env } from "@/lib/env";
import { getInitials } from "@/lib/format";

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
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const { data: avatarData } = useAvatarUrl();
  const { mutate: uploadAvatar, isPending } = useUploadAvatar();

  useBreadcrumbs([{ label: "Account", href: "/account" }]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar(file);
    e.target.value = "";
  };

  const fields = [
    { label: "First name", value: firstName },
    { label: "Last name", value: lastName },
    ...(username && username !== email
      ? [{ label: "Username", value: username }]
      : []),
  ];

  return (
    <>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <PageHeader
          title="Account"
          description="Your profile and sign-in settings."
          actions={
            <>
              <a
                href={keycloakAccountUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn gap-2 btn-outline btn-sm"
              >
                <ArrowTopRightOnSquareIcon className="size-3.5" />
                Manage account
              </a>
              <button
                onClick={() => setIsSignOutOpen(true)}
                className="btn gap-2 text-fg-secondary btn-ghost btn-sm hover:text-error"
              >
                <ArrowRightStartOnRectangleIcon className="size-4" />
                Sign out
              </button>
            </>
          }
        />
        <div className="page-content min-h-0 flex-1 overflow-y-auto">
          <section className="max-w-2xl overflow-hidden panel">
            <div className="flex items-center gap-5 p-6">
              <div className="group relative shrink-0">
                {avatarData?.url ? (
                  <img
                    src={avatarData.url}
                    alt="Avatar"
                    className="size-16 rounded-full object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <span className="flex size-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-content ring-2 ring-primary/20">
                    {initials}
                  </span>
                )}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
                  aria-label="Change avatar"
                >
                  {isPending ? (
                    <span className="loading loading-sm loading-spinner text-white" />
                  ) : (
                    <CameraIcon className="size-5 text-white" />
                  )}
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold tracking-tight text-base-content">
                  {displayName || "—"}
                </p>
                {email && (
                  <p className="mt-0.5 truncate text-sm text-fg-muted">
                    {email}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
                className="btn shrink-0 btn-ghost btn-sm"
              >
                {isPending ? "Uploading…" : "Change photo"}
              </button>
            </div>

            <dl className="border-t border-border">
              {fields.map(({ label, value }) => (
                <div
                  key={label}
                  className="grid gap-1 border-b border-border/60 px-6 py-3.5 last:border-b-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4"
                >
                  <dt className="text-sm text-fg-subtle">{label}</dt>
                  <dd className="text-sm font-medium break-words text-base-content">
                    {value ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      <ConfirmDialog
        isOpen={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
        onConfirm={() =>
          keycloak.logout({ redirectUri: location.origin + "/" })
        }
        title="Sign out?"
        description="You will be returned to the login page."
        confirmLabel="Sign out"
        tone="neutral"
      />
    </>
  );
};
