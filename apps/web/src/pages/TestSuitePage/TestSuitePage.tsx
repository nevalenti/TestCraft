import { ClipboardDocumentListIcon, PlusIcon } from "@heroicons/react/24/solid";
import type {
  CreateTestCase,
  TestCase,
  UpdateTestCase,
} from "@testcraft/types";
import { useState } from "react";

import { ErrorState } from "@/components/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { ResourceCard } from "@/components/ui/ResourceCard";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/hooks/useModal";
import { useProject } from "@/hooks/useProjects";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import {
  useCreateTestCase,
  useDeleteTestCase,
  useTestCases,
  useUpdateTestCase,
} from "@/hooks/useTestCases";
import { useTestSuite } from "@/hooks/useTestSuites";
import { formatDate } from "@/lib/format";
import { TestCaseForm } from "@/pages/TestSuitePage/TestCaseForm";

export const TestSuitePage = () => {
  const projectId = useRequiredParam("projectId");
  const suiteId = useRequiredParam("suiteId");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestCase>();

  const { data: project } = useProject(projectId);
  const { data: suite } = useTestSuite(projectId, suiteId);
  const {
    data: testCases,
    isPending,
    isError,
  } = useTestCases(projectId, suiteId, debouncedSearch || undefined);
  const createCase = useCreateTestCase(projectId, suiteId);
  const updateCase = useUpdateTestCase(projectId, suiteId);
  const deleteCase = useDeleteTestCase(projectId, suiteId);

  const handleCreate = (input: CreateTestCase) =>
    createCase.mutate(input, { onSuccess: close });
  const handleUpdate = (id: string) => (input: UpdateTestCase) =>
    updateCase.mutate({ id, ...input }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteCase.mutate(id, { onSuccess: close });

  useBreadcrumbs([
    { label: "Dashboard", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…", href: `/projects/${projectId}` },
    { label: suite?.name ?? "…" },
  ]);

  const deleteItem = modal.type === "delete" ? modal.item : null;

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {suite?.name ?? (
              <span className="inline-block h-[0.75em] w-48 skeleton rounded align-middle" />
            )}
          </h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            {suite?.description ?? "Test cases in this suite"}
          </p>
        </div>
      </header>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <div className="mb-4 flex items-center gap-3">
          <input
            type="search"
            className="input-bordered input w-full max-w-sm bg-base-200"
            placeholder="Search test cases…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            className="btn ml-auto shrink-0 btn-sm btn-primary"
            onClick={openCreate}
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            New Test Case
          </button>
        </div>
        <div className="min-h-80">
          {isPending ? (
            <SkeletonGrid />
          ) : isError ? (
            <ErrorState />
          ) : testCases?.length === 0 ? (
            <EmptyState
              title="No test cases yet"
              description="Add test cases to document expected behaviour."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testCases?.map((testCase) => (
                <ResourceCard
                  key={testCase.id}
                  testId="case-card"
                  onEdit={() => openEdit(testCase)}
                  onDelete={() => openDelete(testCase)}
                  to={`/projects/${projectId}/suites/${suiteId}/cases/${testCase.id}`}
                  label="test case"
                  cardBg="card-bg-info"
                  accentText="text-info"
                  typeIcon={<ClipboardDocumentListIcon className="size-3.5" />}
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="line-clamp-2 text-base leading-snug font-semibold">
                      {testCase.name}
                    </span>
                    <p className="line-clamp-2 text-sm leading-relaxed text-base-content/70">
                      {testCase.description ?? (
                        <span className="text-base-content/30 italic">
                          No description
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={testCase.priority} />
                      {testCase.stepCount > 0 && (
                        <span className="text-[11px] text-base-content/50">
                          {testCase.stepCount} step
                          {testCase.stepCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-base-content/40 tabular-nums">
                      {formatDate(testCase.createdAt)}
                    </span>
                  </div>
                </ResourceCard>
              ))}
            </div>
          )}
        </div>
      </section>

      <Modal
        isOpen={modal.type === "create"}
        onClose={close}
        title="New Test Case"
      >
        {modal.type === "create" && (
          <TestCaseForm
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createCase.isPending}
          />
        )}
      </Modal>
      <Modal
        isOpen={modal.type === "edit"}
        onClose={close}
        title="Edit Test Case"
      >
        {modal.type === "edit" && (
          <TestCaseForm
            key={modal.item.id}
            defaultValues={{
              name: modal.item.name,
              description: modal.item.description ?? "",
              priority: modal.item.priority,
            }}
            onSubmit={handleUpdate(modal.item.id)}
            onCancel={close}
            isLoading={updateCase.isPending}
          />
        )}
      </Modal>
      <ConfirmDialog
        isOpen={modal.type === "delete"}
        onClose={close}
        onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
        title="Delete Test Case"
        description={deleteItem ? `Delete "${deleteItem.name}"?` : ""}
        isLoading={deleteCase.isPending}
      />
    </div>
  );
};
