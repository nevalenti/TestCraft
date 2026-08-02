import { useState } from 'react';

import { SettingsEntityList } from '@/components/ui/SettingsEntityList';
import {
  useAddProjectMember,
  useProjectMembers,
  useRemoveProjectMember,
} from '@/hooks/useProjectMembers';
import { formatDate } from '@/lib/format';

export const MembersSection = ({ projectId }: { projectId: string }) => {
  const { data: members } = useProjectMembers(projectId);
  const addMember = useAddProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);
  const [email, setEmail] = useState('');

  const handleAdd = () => {
    if (!email) return;
    addMember.mutate(
      { email },
      {
        onSuccess: () => setEmail(''),
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="member-email" className="label-text label text-xs">
            Add member by email
          </label>
          <input
            id="member-email"
            type="email"
            className="input-bordered input input-sm w-full"
            placeholder="teammate@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <button
          className="btn btn-sm btn-primary"
          onClick={handleAdd}
          disabled={!email || addMember.isPending}
        >
          {addMember.isPending ? (
            <span className="loading loading-xs loading-spinner" />
          ) : (
            'Add'
          )}
        </button>
      </div>

      <SettingsEntityList
        items={members ?? []}
        getKey={(member) => member.id}
        renderPrimary={(member) => member.displayName ?? member.email}
        renderSecondary={(member) =>
          `${member.email} · added ${formatDate(member.createdAt)}`
        }
        onRemove={(member) => removeMember.mutate(member.id)}
        removeAriaLabel={(member) => `Remove ${member.email}`}
      />
    </div>
  );
};
