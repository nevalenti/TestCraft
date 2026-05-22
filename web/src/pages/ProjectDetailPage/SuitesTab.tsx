import { PlusIcon, RectangleGroupIcon } from "@heroicons/react/24/solid";
import { forwardRef, useImperativeHandle, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ResourceCard } from "@/components/ui/ResourceCard";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
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

export interface SectionHandle {
  open: () => void;
}

export const SuitesSection = forwardRef<SectionHandle, { projectId: string }>(
  ({ projectId }, ref) => {
    const [modal, setModal] = useState<ModalState<TestSuiteDto>>({
      type: "closed",
    });
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

    const deleteItem = modal.type === "delete" ? modal.item : null;

    return (
      <>
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
                <PlusIcon className="size-4" />
                Create First Suite
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suites?.map((suite) => (
              <ResourceCard
                key={suite.id}
                onEdit={() => setModal({ type: "edit", item: suite })}
                onDelete={() => setModal({ type: "delete", item: suite })}
                to={`/projects/${projectId}/suites/${suite.id}`}
                label="test suite"
                cardBg="card-bg-success"
                accentText="text-success"
                typeIcon={<RectangleGroupIcon className="size-3.5" />}
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-base font-semibold leading-snug line-clamp-2">
                    {suite.name}
                  </span>
                  <p className="text-base-content/70 line-clamp-2 text-sm leading-relaxed">
                    {suite.description ?? (
                      <span className="italic text-base-content/30">
                        No description
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-base-content/50 mt-3 text-xs tabular-nums">
                  {formatDate(suite.createdAt)}
                </p>
              </ResourceCard>
            ))}
          </div>
        )}

        <Modal
          isOpen={modal.type === "create"}
          onClose={close}
          title="New Test Suite"
        >
          {modal.type === "create" && (
            <SuiteForm
              onSubmit={handleCreate}
              onCancel={close}
              isLoading={createSuite.isPending}
            />
          )}
        </Modal>
        <Modal
          isOpen={modal.type === "edit"}
          onClose={close}
          title="Edit Test Suite"
        >
          {modal.type === "edit" && (
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
          )}
        </Modal>
        <ConfirmDialog
          isOpen={modal.type === "delete"}
          onClose={close}
          onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
          title="Delete Test Suite"
          description={deleteItem ? `Delete "${deleteItem.name}"?` : ""}
          isLoading={deleteSuite.isPending}
        />
      </>
    );
  },
);
SuitesSection.displayName = "SuitesSection";
