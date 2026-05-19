import { forwardRef, useImperativeHandle, useState } from "react";
import { Link } from "react-router";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { type ViewMode, ViewToggle } from "@/components/ui/ViewToggle";
import {
  useCreateTestSuite,
  useDeleteTestSuite,
  useTestSuites,
  useUpdateTestSuite,
} from "@/hooks/useTestSuites";
import { formatDate } from "@/lib/format";
import type {
  CreateTestSuiteDto,
  ModalState,
  TestSuiteDto,
  UpdateTestSuiteDto,
} from "@/types";

import { SuiteForm } from "./SuiteForm";
import type { TabHandle } from "./TabHandle";

export const SuitesTab = forwardRef<TabHandle, { projectId: string }>(
  ({ projectId }, ref) => {
    const [modal, setModal] = useState<ModalState<TestSuiteDto>>({
      type: "closed",
    });
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const { data: suites, isPending } = useTestSuites(projectId);
    const createSuite = useCreateTestSuite(projectId);
    const updateSuite = useUpdateTestSuite(projectId);
    const deleteSuite = useDeleteTestSuite(projectId);
    const close = () => setModal({ type: "closed" });

    useImperativeHandle(ref, () => ({
      open: () => setModal({ type: "create" }),
    }));

    const handleCreate = (dto: CreateTestSuiteDto) =>
      createSuite.mutate(dto, { onSuccess: close });
    const handleUpdate = (id: string) => (dto: UpdateTestSuiteDto) =>
      updateSuite.mutate({ id, ...dto }, { onSuccess: close });
    const handleDelete = (id: string) =>
      deleteSuite.mutate(id, { onSuccess: close });
    const hasItems = !isPending && (suites?.length ?? 0) > 0;

    return (
      <>
        <div className="min-h-80">
          <div
            className={`mb-4 flex justify-end ${!hasItems ? "invisible pointer-events-none" : ""}`}
          >
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>
          {isPending ? (
            <SkeletonGrid />
          ) : suites?.length === 0 ? (
            <EmptyState
              title="No test suites yet"
              description="Group related test cases together into suites."
              action={
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setModal({ type: "create" })}
                >
                  New Suite
                </button>
              }
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suites?.map((suite) => (
                <div
                  key={suite.id}
                  className="relative bg-base-100 border border-border border-l-4 border-l-primary shadow-sm transition-all duration-150 hover:shadow-md group overflow-hidden"
                >
                  <div className="p-5 flex flex-row gap-4 items-stretch">
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex flex-col gap-1.5">
                        <Link
                          to={`/projects/${projectId}/suites/${suite.id}`}
                          className="text-[15px] font-semibold leading-snug line-clamp-2 transition-colors hover:text-primary"
                        >
                          {suite.name}
                        </Link>
                        {suite.description && (
                          <p className="text-base-content/50 line-clamp-2 text-sm leading-relaxed">
                            {suite.description}
                          </p>
                        )}
                      </div>
                      <p className="text-base-content/35 mt-3 text-xs tabular-nums">
                        {formatDate(suite.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setModal({ type: "edit", item: suite })}
                        aria-label="Edit suite"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() =>
                          setModal({ type: "delete", item: suite })
                        }
                        aria-label="Delete suite"
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
              {suites?.map((suite) => (
                <div
                  key={suite.id}
                  className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 border-l-4 border-l-primary bg-base-100 group hover:bg-base-200/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/projects/${projectId}/suites/${suite.id}`}
                      className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1"
                    >
                      {suite.name}
                    </Link>
                    {suite.description && (
                      <p className="text-xs text-base-content/45 line-clamp-1 mt-0.5">
                        {suite.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs text-base-content/35 tabular-nums hidden sm:block">
                      {formatDate(suite.createdAt)}
                    </p>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => setModal({ type: "edit", item: suite })}
                        aria-label="Edit suite"
                      >
                        <PencilIcon size="size-3.5" />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() =>
                          setModal({ type: "delete", item: suite })
                        }
                        aria-label="Delete suite"
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

        <Modal
          isOpen={modal.type === "create"}
          onClose={close}
          title="New Test Suite"
        >
          <SuiteForm
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createSuite.isPending}
          />
        </Modal>
        {modal.type === "edit" && (
          <Modal isOpen onClose={close} title="Edit Test Suite">
            <SuiteForm
              key={modal.item.id}
              defaultValues={{
                name: modal.item.name,
                description: modal.item.description ?? "",
              }}
              onSubmit={handleUpdate(modal.item.id)}
              onCancel={close}
              isLoading={updateSuite.isPending}
            />
          </Modal>
        )}
        {modal.type === "delete" && (
          <ConfirmDialog
            isOpen
            onClose={close}
            onConfirm={() => handleDelete(modal.item.id)}
            title="Delete Test Suite"
            description={`Delete "${modal.item.name}"?`}
            isLoading={deleteSuite.isPending}
          />
        )}
      </>
    );
  },
);
SuitesTab.displayName = "SuitesTab";
