import { ApiTokensSection } from '@/features/apiTokens/ApiTokensSection';
import { useRequiredParam } from '@/hooks/useRequiredParam';

export const ApiTokensTab = () => {
  const projectId = useRequiredParam('projectId');
  return <ApiTokensSection projectId={projectId} />;
};
