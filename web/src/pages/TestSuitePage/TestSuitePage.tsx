import { useState } from "react";
import { Link } from "react-router";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ResourceCard } from "@/components/ui/ResourceCard";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
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
import type {
  CreateTestCaseDto,
  ModalState,
  TestCaseDto,
  UpdateTestCaseDto,
} from "@/types";

import { TestCaseForm } from "./TestCaseForm";

export const TestSuitePage = () => {
  const projectId = useRequiredParam("projectId");
  const suiteId = useRequiredParam("suiteId");
  const [modal, setModal] = useState<ModalState<TestCaseDto>>({
    type: "closed",
  });

  const { data: project } = useProject(projectId);
  const { data: suite } = useTestSuite(projectId, suiteId);
  const { data: testCases, isPending } = useTestCases(projectId, suiteId);
  const createCase = useCreateTestCase(projectId, suiteId);
  const updateCase = useUpdateTestCase(projectId, suiteId);
  const deleteCase = useDeleteTestCase(projectId, suiteId);
  const close = () => setModal({ type: "closed" });

  const handleCreate = (dto: CreateTestCaseDto) =>
    createCase.mutate(dto, { onSuccess: close });
  const handleUpdate = (id: string) => (dto: UpdateTestCaseDto) =>
    updateCase.mutate({ id, ...dto }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteCase.mutate(id, { onSuccess: close });

  useBreadcrumbs([
    { label: "home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…", href: `/projects/${projectId}` },
    { label: suite?.name ?? "…" },
  ]);

  const deleteItem = modal.type === "delete" ? modal.item : null;

  return (
    <div className="w-full flex flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">
            {suite?.name}
          </h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            {suite?.description ?? "Test cases in this suite"}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm shrink-0"
          onClick={() => setModal({ type: "create" })}
        >
          New Test Case
        </button>
      </header>

      <section className="page-content flex-1">
        <div className="min-h-80">
          {isPending ? (
            <SkeletonGrid />
          ) : testCases?.length === 0 ? (
            <EmptyState
              title="No test cases yet"
              description="Add test cases to document expected behaviour."
              action={
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setModal({ type: "create" })}
                >
                  Create First Test Case
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testCases?.map((tc) => (
                <ResourceCard
                  key={tc.id}
                  onEdit={() => setModal({ type: "edit", item: tc })}
                  onDelete={() => setModal({ type: "delete", item: tc })}
                  label="test case"
                >
                  <div className="flex flex-col gap-1.5">
                    <Link
                      to={`/projects/${projectId}/suites/${suiteId}/cases/${tc.id}`}
                      className="text-[15px] font-semibold leading-snug line-clamp-2 transition-colors hover:text-primary"
                    >
                      {tc.name}
                    </Link>
                    {tc.description && (
                      <p className="text-base-content/65 line-clamp-2 text-sm leading-relaxed">
                        {tc.description}
                      </p>
                    )}
                  </div>
                  <p className="text-base-content/50 mt-3 text-xs tabular-nums">
                    {formatDate(tc.createdAt)}
                  </p>
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
