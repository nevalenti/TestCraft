import { useState } from 'react';

import { Modal } from '@/components/ui/Modal';
import { ApiTokensSection } from '@/features/apiTokens/ApiTokensSection';
import { NotificationsSection } from '@/features/notifications/NotificationsSection';
import { MembersSection } from '@/features/projectMembers/MembersSection';
import { cn } from '@/lib/cn';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  isOwner: boolean;
}

type Tab = 'tokens' | 'notifications' | 'members';

export const ProjectSettingsModal = ({
  isOpen,
  onClose,
  projectId,
  isOwner,
}: ProjectSettingsModalProps) => {
  const [tab, setTab] = useState<Tab>('tokens');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Settings">
      <div className="mb-5 flex gap-1">
        <button
          className={cn(
            'btn btn-sm',
            tab === 'tokens' ? 'btn-neutral' : 'btn-ghost',
          )}
          onClick={() => setTab('tokens')}
        >
          API Tokens
        </button>
        <button
          className={cn(
            'btn btn-sm',
            tab === 'notifications' ? 'btn-neutral' : 'btn-ghost',
          )}
          onClick={() => setTab('notifications')}
        >
          Notifications
        </button>
        {isOwner && (
          <button
            className={cn(
              'btn btn-sm',
              tab === 'members' ? 'btn-neutral' : 'btn-ghost',
            )}
            onClick={() => setTab('members')}
          >
            Members
          </button>
        )}
      </div>

      {tab === 'tokens' && <ApiTokensSection projectId={projectId} />}
      {tab === 'notifications' && (
        <NotificationsSection projectId={projectId} />
      )}
      {tab === 'members' && isOwner && <MembersSection projectId={projectId} />}
    </Modal>
  );
};
