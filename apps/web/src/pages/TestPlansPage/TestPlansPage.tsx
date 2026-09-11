import { PlusIcon } from '@heroicons/react/24/solid';
import type { TestPlan } from '@testcraft/types';

import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { SkeletonStatus } from '@/components/ui/SkeletonStatus';
import { useProject } from '@/features/projects/hooks';
import {
  useCreateTestPlan,
  useDeleteTestPlan,
  useTestPlans,
  useUpdateTestPlan,
} from '@/features/testPlans/hooks';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { useModal } from '@/hooks/useModal';
import { useRequiredParam } from '@/hooks/useRequiredParam';
import { PlanListItem } from '@/pages/TestPlansPage/PlanListItem';
import { PlanRowSkeleton } from '@/pages/TestPlansPage/PlanRowSkeleton';
import { TestPlanForm } from '@/pages/TestPlansPage/TestPlanForm';

export const TestPlansPage = () => {
  const projectId = useRequiredParam('projectId');
  const { data: project } = useProject(projectId);
  const {
    data: plans,
    isPending,
    isError,
    error,
    refetch,
  } = useTestPlans(projectId);
  const createPlan = useCreateTestPlan(projectId);
  const updatePlan = useUpdateTestPlan(projectId);
  const deletePlan = useDeleteTestPlan(projectId);
  const { modal, close, openCreate, openEdit } = useModal<TestPlan>();
  const showSkeleton = useIsLoadingVisible(isPending);

  useBreadcrumbs([
    { label: 'Projects', href: '/projects' },
    { label: project?.name ?? '…', href: `/projects/${projectId}` },
    { label: 'Test Plans' },
  ]);

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  let planListContent: React.ReactNode;
  if (isPending) {
    planListContent = showSkeleton ? (
      <SkeletonStatus label="Loading test plans…">
        <ul className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <PlanRowSkeleton key={i} />
          ))}
        </ul>
      </SkeletonStatus>
    ) : null;
  } else if (plans?.length) {
    planListContent = (
      <ul className="space-y-2">
        {plans.map((plan) => (
          <PlanListItem
            key={plan.id}
            plan={plan}
            projectId={projectId}
            onEdit={() => openEdit(plan)}
            onDelete={() => deletePlan.mutate(plan.id)}
          />
        ))}
      </ul>
    );
  } else {
    planListContent = (
      <EmptyState
        title="No test plans yet"
        description="Create a plan to pre-select test cases and run them as a structured suite."
        action={
          <button
            className="btn gap-1.5 btn-sm btn-primary"
            onClick={openCreate}
          >
            <PlusIcon className="size-4" />
            New Plan
          </button>
        }
      />
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Test Plans</h1>
          <p className="mt-0.5 text-sm text-base-content/70">
            Pre-select test cases for structured test runs
          </p>
        </div>
        <button className="btn gap-1.5 btn-sm btn-primary" onClick={openCreate}>
          <PlusIcon className="size-4" />
          New Plan
        </button>
      </header>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        {planListContent}
      </section>

      <Modal
        isOpen={modal.type === 'create'}
        onClose={close}
        title="New Test Plan"
      >
        {modal.type === 'create' && (
          <TestPlanForm
            submitLabel="Create"
            onSubmit={(data) => createPlan.mutate(data, { onSuccess: close })}
            onCancel={close}
            isLoading={createPlan.isPending}
          />
        )}
      </Modal>

      <Modal
        isOpen={modal.type === 'edit'}
        onClose={close}
        title="Edit Test Plan"
      >
        {modal.type === 'edit' && (
          <TestPlanForm
            key={modal.item.id}
            submitLabel="Save"
            defaultValues={{
              name: modal.item.name,
              description: modal.item.description ?? '',
            }}
            onSubmit={(data) =>
              updatePlan.mutate(
                { id: modal.item.id, ...data },
                { onSuccess: close },
              )
            }
            onCancel={close}
            isLoading={updatePlan.isPending}
          />
        )}
      </Modal>
    </div>
  );
};
