import { PlayIcon } from '@heroicons/react/24/solid';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { Modal } from '@/components/ui/Modal';
import { useProject } from '@/features/projects/hooks';
import { useProjectTestCases } from '@/features/testCases/hooks';
import { AddCasesPanel } from '@/features/testPlans/AddCasesPanel';
import {
  useAddCaseToPlan,
  useCreateRunFromPlan,
  useRemoveCaseFromPlan,
  useReorderPlanCases,
  useTestPlan,
  useTestPlanCases,
} from '@/features/testPlans/hooks';
import { PlanCasesPanel } from '@/features/testPlans/PlanCasesPanel';
import { RunFromPlanForm } from '@/features/testPlans/RunFromPlanForm';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { useRequiredParam } from '@/hooks/useRequiredParam';

export const TestPlanPage = () => {
  const projectId = useRequiredParam('projectId');
  const planId = useRequiredParam('planId');
  const navigate = useNavigate();

  const { data: project } = useProject(projectId);
  const { data: plan } = useTestPlan(projectId, planId);
  const {
    data: cases,
    isPending,
    isError,
    error,
    refetch,
  } = useTestPlanCases(projectId, planId);
  const { data: allCases } = useProjectTestCases(projectId);
  const addCase = useAddCaseToPlan(projectId, planId);
  const removeCase = useRemoveCaseFromPlan(projectId, planId);
  const reorderCases = useReorderPlanCases(projectId, planId);
  const createRun = useCreateRunFromPlan(projectId);
  const showSkeleton = useIsLoadingVisible(isPending);

  const [runModalOpen, setRunModalOpen] = useState(false);

  useBreadcrumbs([
    { label: 'Projects', href: '/projects' },
    { label: project?.name ?? '…', href: `/projects/${projectId}` },
    { label: 'Test Plans', href: `/projects/${projectId}/plans` },
    { label: plan?.name ?? '…' },
  ]);

  const sortedCases = [...(cases ?? [])].toSorted(
    (caseA, caseB) => caseA.order - caseB.order,
  );
  const caseIds = new Set(sortedCases.map((planCase) => planCase.testCaseId));
  const availableToAdd = (allCases ?? []).filter(
    (testCase) => !caseIds.has(testCase.id),
  );

  const handleRunFromPlan = (data: { name: string; environment: string }) => {
    createRun.mutate(
      { planId, name: data.name, environment: data.environment },
      {
        onSuccess: (run) => {
          setRunModalOpen(false);
          navigate({
            to: '/projects/$projectId/runs/$runId',
            params: { projectId, runId: run.id },
          });
        },
      },
    );
  };

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{plan?.name ?? '…'}</h1>
          {plan?.description && (
            <p className="mt-0.5 text-sm text-base-content/70">
              {plan.description}
            </p>
          )}
        </div>
        <button
          className="btn gap-1.5 btn-sm btn-primary"
          onClick={() => setRunModalOpen(true)}
          disabled={sortedCases.length === 0}
        >
          <PlayIcon className="size-4" />
          Run Plan
        </button>
      </header>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-widest text-base-content/75 uppercase">
              Plan Cases ({sortedCases.length})
            </p>
            <PlanCasesPanel
              sortedCases={sortedCases}
              isPending={isPending}
              showSkeleton={showSkeleton}
              isError={isError}
              error={error}
              onRetry={refetch}
              onReorder={(reordered) => reorderCases.mutate(reordered)}
              onRemove={(id) => removeCase.mutate(id)}
            />
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold tracking-widest text-base-content/75 uppercase">
              Add Cases
            </p>
            <AddCasesPanel
              availableCases={availableToAdd}
              onAdd={(id) => addCase.mutate(id)}
            />
          </div>
        </div>
      </section>

      <Modal
        isOpen={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        title="Run Test Plan"
      >
        <RunFromPlanForm
          planName={plan?.name ?? 'Plan'}
          onSubmit={handleRunFromPlan}
          onCancel={() => setRunModalOpen(false)}
          isLoading={createRun.isPending}
        />
      </Modal>
    </div>
  );
};
