import { PlusIcon, UsersIcon } from "@heroicons/react/24/solid";
import type { AssignableRole } from "@testcraft/types";
import { useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { SettingsEntityList } from "@/components/ui/SettingsEntityList";
import { SettingsSectionCard } from "@/components/ui/SettingsSectionCard";
import {
  useAddProjectMember,
  useProjectMembers,
  useRemoveProjectMember,
  useUpdateProjectMemberRole,
} from "@/features/projectMembers/hooks";
import { MemberForm } from "@/features/projectMembers/MemberForm";
import {
  assignableRoles,
  canManageMember,
  MEMBER_ROLE_LABELS,
} from "@/features/projectMembers/roles";
import { useProjectPermissions } from "@/features/projects/permissions";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, getInitials } from "@/lib/format";

const memberLabel = (member: {
  display_name?: string | null;
  email?: string | null;
}): string => member.display_name ?? member.email ?? "Member";

export const MembersSection = ({ projectId }: { projectId: string }) => {
  const {
    data: members,
    isError,
    error,
    refetch,
  } = useProjectMembers(projectId);
  const addMember = useAddProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);
  const updateRole = useUpdateProjectMemberRole(projectId);
  const { role: myRole } = useProjectPermissions(projectId);
  const roles = assignableRoles(myRole);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const handleAdd = (data: { email: string; role: AssignableRole }) => {
    addMember.mutate(data, { onSuccess: () => setIsCreateOpen(false) });
  };

  const visibleMembers = debouncedSearch
    ? (members ?? []).filter((member) =>
        memberLabel(member)
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()),
      )
    : members;

  return (
    <SettingsSectionCard
      icon={UsersIcon}
      title="Members"
      description="Invite teammates to collaborate on this project."
    >
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search members…"
      >
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setIsCreateOpen(true)}
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          Add Member
        </button>
      </ListToolbar>

      {isError ? (
        <ErrorState
          title="Failed to load members"
          error={error}
          onRetry={refetch}
        />
      ) : (
        <SettingsEntityList
          items={visibleMembers ?? []}
          getKey={(member) => member.id}
          renderLeading={(member) => (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-content">
              {getInitials(memberLabel(member))}
            </span>
          )}
          renderPrimary={memberLabel}
          renderSecondary={(member) =>
            member.email
              ? `${member.email} · added ${formatDate(member.created_at)}`
              : `added ${formatDate(member.created_at)}`
          }
          renderTrailing={(member) =>
            canManageMember(myRole, member.role) ? (
              <select
                className="select-bordered select select-xs"
                value={member.role}
                aria-label={`Role of ${member.email ?? memberLabel(member)}`}
                disabled={updateRole.isPending}
                onChange={(event) =>
                  updateRole.mutate({
                    id: member.id,
                    role: event.target.value as AssignableRole,
                  })
                }
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {MEMBER_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            ) : (
              <span className="badge badge-ghost badge-sm">
                {MEMBER_ROLE_LABELS[member.role]}
              </span>
            )
          }
          isRemoveHidden={(member) => !canManageMember(myRole, member.role)}
          onRemove={(member) => removeMember.mutate(member.id)}
          removeAriaLabel={(member) =>
            `Remove ${member.email ?? memberLabel(member)}`
          }
          emptyTitle="No members yet"
          emptyDescription="Invite teammates to collaborate on this project."
        />
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Member"
      >
        <MemberForm
          onSubmit={handleAdd}
          onCancel={() => setIsCreateOpen(false)}
          isLoading={addMember.isPending}
          roles={roles}
        />
      </Modal>
    </SettingsSectionCard>
  );
};
