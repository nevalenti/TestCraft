import { useState } from "react";
import { Link, useParams } from "react-router";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { type ViewMode, ViewToggle } from "@/components/ui/ViewToggle";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useProject } from "@/hooks/useProjects";
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
  const { projectId, suiteId } = useParams<{
    projectId: string;
    suiteId: string;
  }>();
  const [modal, setModal] = useState<ModalState<TestCaseDto>>({
    type: "closed",
  });
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { data: project } = useProject(projectId!);
  const { data: suite } = useTestSuite(projectId!, suiteId!);
  const { data: testCases, isPending } = useTestCases(projectId!, suiteId!);
  const createCase = useCreateTestCase(projectId!, suiteId!);
  const updateCase = useUpdateTestCase(projectId!, suiteId!);
  const deleteCase = useDeleteTestCase(projectId!, suiteId!);
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

  return (
    <div className="w-full flex flex-col">
      <header className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{suite?.name}</h1>
          {suite?.description && (
            <p className="mt-0.5 text-sm text-base-content/45">
              {suite.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setModal({ type: "create" })}
          >
            New Test Case
          </button>
        </div>
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
                  New Test Case
                </button>
              }
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testCases?.map((tc) => (
                <div
                  key={tc.id}
                  className="relative bg-base-100 border border-border border-l-4 border-l-primary shadow-sm transition-all duration-150 hover:shadow-md group overflow-hidden"
                >
                  <div className="p-5 flex flex-row gap-4 items-stretch">
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex flex-col gap-1.5">
                        <Link
                          to={`/projects/${projectId}/suites/${suiteId}/cases/${tc.id}`}
                          className="text-[15px] font-semibold leading-snug line-clamp-2 transition-colors hover:text-primary"
                        >
                          {tc.name}
                        </Link>
                        {tc.description && (
                          <p className="text-base-content/50 line-clamp-2 text-sm leading-relaxed">
                            {tc.description}
                          </p>
                        )}
                      </div>
                      <p className="text-base-content/35 mt-3 text-xs tabular-nums">
                        {formatDate(tc.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setModal({ type: "edit", item: tc })}
                        aria-label="Edit test case"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => setModal({ type: "delete", item: tc })}
                        aria-label="Delete test case"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-border overflow-hidden">
              {testCases?.map((tc) => (
                <div
                  key={tc.id}
                  className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 border-l-4 border-l-primary bg-base-100 group hover:bg-base-200/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/projects/${projectId}/suites/${suiteId}/cases/${tc.id}`}
                      className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1"
                    >
                      {tc.name}
                    </Link>
                    {tc.description && (
                      <p className="text-xs text-base-content/45 line-clamp-1 mt-0.5">
                        {tc.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs text-base-content/35 tabular-nums hidden sm:block">
                      {formatDate(tc.createdAt)}
                    </p>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => setModal({ type: "edit", item: tc })}
                        aria-label="Edit test case"
                      >
                        <PencilIcon size="size-3.5" />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => setModal({ type: "delete", item: tc })}
                        aria-label="Delete test case"
                      >
                        <TrashIcon size="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
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
        <TestCaseForm
          onSubmit={handleCreate}
          onCancel={close}
          isLoading={createCase.isPending}
        />
      </Modal>
      {modal.type === "edit" && (
        <Modal isOpen onClose={close} title="Edit Test Case">
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
        </Modal>
      )}
      {modal.type === "delete" && (
        <ConfirmDialog
          isOpen
          onClose={close}
          onConfirm={() => handleDelete(modal.item.id)}
          title="Delete Test Case"
          description={`Delete "${modal.item.name}"?`}
          isLoading={deleteCase.isPending}
        />
      )}
    </div>
  );
};
