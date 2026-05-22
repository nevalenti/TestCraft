import { ClipboardDocumentListIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
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
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState<TestCaseDto>>({
    type: "closed",
  });

  const { data: project } = useProject(projectId);
  const { data: suite } = useTestSuite(projectId, suiteId);
  const {
    data: testCases,
    isPending,
    isError,
  } = useTestCases(projectId, suiteId);
  const filteredCases = useMemo(
    () =>
      !search
        ? testCases
        : testCases?.filter((tc) =>
            tc.name.toLowerCase().includes(search.toLowerCase()),
          ),
    [testCases, search],
  );
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
    <div className="w-full flex flex-col min-h-0">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">
            {suite?.name ?? (
              <span className="skeleton inline-block w-48 h-[0.75em] rounded align-middle" />
            )}
          </h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            {suite?.description ?? "Test cases in this suite"}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm shrink-0"
          onClick={() => setModal({ type: "create" })}
        >
          <PlusIcon className="size-4" />
          New Test Case
        </button>
      </header>

      <section className="page-content flex-1 overflow-y-auto min-h-0">
        <div className="mb-4">
          <input
            type="search"
            className="input input-bordered bg-base-200 w-full max-w-sm"
            placeholder="Search test cases…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="min-h-80">
          {isPending ? (
            <SkeletonGrid />
          ) : isError ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-error font-semibold mb-2">Failed to load</p>
                <p className="text-base-content/60 text-sm mb-4">
                  Please check your connection and try again.
                </p>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : filteredCases?.length === 0 ? (
            <EmptyState
              title="No test cases yet"
              description="Add test cases to document expected behaviour."
              action={
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setModal({ type: "create" })}
                >
                  <PlusIcon className="size-4" />
                  Create First Test Case
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCases?.map((tc) => (
                <ResourceCard
                  key={tc.id}
                  onEdit={() => setModal({ type: "edit", item: tc })}
                  onDelete={() => setModal({ type: "delete", item: tc })}
                  to={`/projects/${projectId}/suites/${suiteId}/cases/${tc.id}`}
                  label="test case"
                  cardBg="card-bg-info"
                  accentText="text-info"
                  typeIcon={<ClipboardDocumentListIcon className="size-3.5" />}
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-base font-semibold leading-snug line-clamp-2">
                      {tc.name}
                    </span>
                    <p className="text-base-content/70 line-clamp-2 text-sm leading-relaxed">
                      {tc.description ?? (
                        <span className="italic text-base-content/30">
                          No description
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={tc.priority} />
                      {tc.stepCount > 0 && (
                        <span className="text-[11px] text-base-content/50">
                          {tc.stepCount} step{tc.stepCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] tabular-nums text-base-content/40">
                      {formatDate(tc.createdAt)}
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
