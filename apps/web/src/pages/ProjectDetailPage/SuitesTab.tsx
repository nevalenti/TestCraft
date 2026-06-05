import { PlusIcon, RectangleGroupIcon } from "@heroicons/react/24/solid";
import type {
  CreateTestSuite,
  TestSuite,
  UpdateTestSuite,
} from "@testcraft/types";
import { forwardRef, useImperativeHandle, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ResourceCard } from "@/components/ui/ResourceCard";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/hooks/useModal";
import {
  useCreateTestSuite,
  useDeleteTestSuite,
  useTestSuites,
  useUpdateTestSuite,
} from "@/hooks/useTestSuites";
import { formatDate } from "@/lib/format";
import { SuiteForm } from "@/pages/ProjectDetailPage/SuiteForm";
import type { TabHandle } from "@/pages/ProjectDetailPage/TabHandle";

export const SuitesSection = forwardRef<TabHandle, { projectId: string }>(
  ({ projectId }, ref) => {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const { modal, close, openCreate, openEdit, openDelete } =
      useModal<TestSuite>();
    const { data: suites, isPending } = useTestSuites(
      projectId,
      debouncedSearch || undefined,
    );
    const createSuite = useCreateTestSuite(projectId);
    const updateSuite = useUpdateTestSuite(projectId);
    const deleteSuite = useDeleteTestSuite(projectId);

    useImperativeHandle(ref, () => ({ open: openCreate }));

    const handleCreate = (input: CreateTestSuite) =>
      createSuite.mutate(input, { onSuccess: close });
    const handleUpdate = (id: string) => (input: UpdateTestSuite) =>
      updateSuite.mutate({ id, ...input }, { onSuccess: close });
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
            description="Group related test cases into suites."
            action={
              <button className="btn btn-primary btn-sm" onClick={openCreate}>
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-white/35 text-black">
                  <PlusIcon className="size-3" aria-hidden="true" />
                </span>
                Create First Suite
              </button>
            }
          />
        ) : (
          <>
            <div className="mb-4">
              <input
                type="search"
                className="input input-bordered bg-base-200 w-full max-w-sm"
                placeholder="Search test suites…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suites?.map((suite) => (
                <ResourceCard
                  key={suite.id}
                  testId="suite-card"
                  onEdit={() => openEdit(suite)}
                  onDelete={() => openDelete(suite)}
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
          </>
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
