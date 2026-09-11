import { ErrorState } from '@/components/ErrorState';
import { MembersSection } from '@/features/projectMembers/MembersSection';
import { useProject } from '@/features/projects/hooks';
import { useRequiredParam } from '@/hooks/useRequiredParam';

export const MembersTab = () => {
  const projectId = useRequiredParam('projectId');
  const { data: project } = useProject(projectId);

  if (!project?.isOwner)
    return (
      <ErrorState
        title="Owners only"
        message="Only the project owner can manage members."
      />
    );

  return <MembersSection projectId={projectId} />;
};
