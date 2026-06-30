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
  const signOutDialogRef = useRef<HTMLDialogElement>(null);
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
    { label: "First Name", value: firstName },
    { label: "Last Name", value: lastName },
    { label: "Username", value: username },
    { label: "Email", value: email },
  ];

  return (
    <>
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
        <header className="page-header">
          <h1 className="page-title">Account</h1>
          <p className="mt-0.5 text-sm text-base-content/55">
            Manage your profile and preferences
          </p>
        </header>

        <div className="page-content flex max-w-2xl flex-col gap-5">
          {/* Profile hero */}
          <div className="flex items-center gap-5 rounded-2xl border border-border bg-base-100 p-6 shadow-sm">
            <div className="group relative shrink-0">
              {avatarData?.url ? (
                <img
                  src={avatarData.url}
                  alt="Avatar"
                  className="size-20 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-content ring-2 ring-primary/20">
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
              <p className="font-display text-xl font-bold tracking-tight text-base-content">
                {displayName || "—"}
              </p>
              {email && (
                <p className="mt-0.5 truncate text-sm text-base-content/55">
                  {email}
                </p>
              )}
              {username && displayName !== username && (
                <p className="mt-0.5 text-xs text-base-content/40">
                  @{username}
                </p>
              )}
              <button
                type="button"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-xs font-medium text-primary/70 transition-colors hover:text-primary disabled:cursor-not-allowed"
              >
                {isPending ? "Uploading…" : "Change photo"}
              </button>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-base-200 px-4 py-3.5">
                <p className="text-[10px] font-semibold tracking-widest text-base-content/45 uppercase">
                  {label}
                </p>
                <p className="mt-1 truncate text-sm font-medium text-base-content">
                  {value ?? "—"}
                </p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-1">
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
              onClick={() => signOutDialogRef.current?.showModal()}
              className="btn gap-2 btn-sm btn-error"
            >
              <ArrowRightStartOnRectangleIcon className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

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
            <button
              className="btn btn-sm btn-error"
              onClick={() =>
                keycloak.logout({ redirectUri: location.origin + "/" })
              }
            >
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
