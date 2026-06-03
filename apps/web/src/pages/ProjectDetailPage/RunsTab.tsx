import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { ArrowUpTrayIcon, BoltIcon, PlusIcon } from "@heroicons/react/24/solid";
import type {
  AllureResultItem,
  CreateTestRunInput,
  TestRun,
  UpdateTestRunInput,
} from "@testcraft/types";
import { TestRunStatus } from "@testcraft/types";
import { forwardRef, useImperativeHandle, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ResourceCard } from "@/components/ui/ResourceCard";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { useModal } from "@/hooks/useModal";
import {
  useCreateTestRun,
  useDeleteTestRun,
  useImportAllure,
  useImportJunitXml,
  useTestRuns,
  useUpdateTestRun,
} from "@/hooks/useTestRuns";
import { formatDate } from "@/lib/format";
import { AllureImportForm } from "@/pages/ProjectDetailPage/AllureImportForm";
import { JUnitImportForm } from "@/pages/ProjectDetailPage/JUnitImportForm";
import { RunForm } from "@/pages/ProjectDetailPage/RunForm";
import type { SectionHandle } from "@/pages/ProjectDetailPage/SuitesTab";

const RUN_STATUS_STYLES: Record<string, string> = {
  [TestRunStatus.Active]: "bg-warning/15 text-warning border-warning/30",
  [TestRunStatus.Completed]: "bg-success/15 text-success border-success/30",
  [TestRunStatus.Archived]:
    "bg-base-content/8 text-base-content/50 border-base-content/15",
};

const RunStatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${RUN_STATUS_STYLES[status] ?? ""}`}
  >
    {status}
  </span>
);

const ImportDropdown = ({
  onJUnit,
  onAllure,
}: {
  onJUnit: () => void;
  onAllure: () => void;
}) => (
  <div className="dropdown dropdown-end">
    <div tabIndex={0} role="button" className="btn btn-soft btn-sm gap-1.5">
      <ArrowUpTrayIcon className="size-4" />
      Import
      <ChevronDownIcon className="size-3 opacity-60" />
    </div>
    <ul className="dropdown-content menu bg-base-100 border-base-200 rounded-box z-10 mt-1 w-44 border p-1.5 shadow-lg">
      <li>
        <button
          type="button"
          onClick={() => {
            onJUnit();
            (document.activeElement as HTMLElement)?.blur();
          }}
        >
          JUnit XML
        </button>
      </li>
      <li>
        <button
          type="button"
          onClick={() => {
            onAllure();
            (document.activeElement as HTMLElement)?.blur();
          }}
        >
          Allure JSON
        </button>
      </li>
    </ul>
  </div>
);

export const RunsSection = forwardRef<SectionHandle, { projectId: string }>(
  ({ projectId }, ref) => {
    const { modal, close, openCreate, openEdit, openDelete } =
      useModal<TestRun>();
    const [importModal, setImportModal] = useState<"junit" | "allure" | null>(
      null,
    );
    const { data: runs, isPending } = useTestRuns(projectId);
    const createRun = useCreateTestRun(projectId);
    const updateRun = useUpdateTestRun(projectId);
    const deleteRun = useDeleteTestRun(projectId);
    const importJunit = useImportJunitXml(projectId);
    const importAllure = useImportAllure(projectId);

    useImperativeHandle(ref, () => ({ open: openCreate }));

    const handleCreate = (input: CreateTestRunInput) =>
      createRun.mutate(input, { onSuccess: close });
    const handleUpdate = (id: string) => (input: UpdateTestRunInput) =>
      updateRun.mutate({ id, ...input }, { onSuccess: close });
    const handleDelete = (id: string) =>
      deleteRun.mutate(id, { onSuccess: close });
    const handleImport = (data: {
      xml: string;
      environment: string;
      name?: string;
    }) => importJunit.mutate(data, { onSuccess: () => setImportModal(null) });
    const handleAllureImport = (data: {
      results: AllureResultItem[];
      environment: string;
      name?: string;
    }) => importAllure.mutate(data, { onSuccess: () => setImportModal(null) });

    const deleteItem = modal.type === "delete" ? modal.item : null;

    return (
      <>
        {isPending ? (
          <SkeletonGrid />
        ) : runs?.length === 0 ? (
          <EmptyState
            title="No test runs yet"
            description="Start a test run to record and track results."
            action={
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary btn-sm" onClick={openCreate}>
                  <PlusIcon className="size-4" />
                  Create First Run
                </button>
                <ImportDropdown
                  onJUnit={() => setImportModal("junit")}
                  onAllure={() => setImportModal("allure")}
                />
              </div>
            }
          />
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <ImportDropdown
                onJUnit={() => setImportModal("junit")}
                onAllure={() => setImportModal("allure")}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {runs?.map((run) => (
                <ResourceCard
                  key={run.id}
                  testId="run-card"
                  onEdit={() => openEdit(run)}
                  onDelete={() => openDelete(run)}
                  to={`/projects/${projectId}/runs/${run.id}`}
                  label="test run"
                  cardBg="card-bg-warning"
                  accentText="text-warning"
                  typeIcon={<BoltIcon className="size-3.5" />}
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-base font-semibold leading-snug line-clamp-2">
                      {run.name}
                    </span>
                    <p className="text-base-content/60 text-sm font-medium">
                      {run.environment}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <RunStatusBadge status={run.status} />
                    <p className="text-base-content/50 text-xs tabular-nums">
                      {formatDate(run.createdAt)}
                    </p>
                  </div>
                </ResourceCard>
              ))}
            </div>
          </>
        )}

        <Modal
          isOpen={modal.type === "create"}
          onClose={close}
          title="New Test Run"
        >
          {modal.type === "create" && (
            <RunForm
              onSubmit={handleCreate}
              onCancel={close}
              isLoading={createRun.isPending}
            />
          )}
        </Modal>
        <Modal
          isOpen={modal.type === "edit"}
          onClose={close}
          title="Edit Test Run"
        >
          {modal.type === "edit" && (
            <RunForm
              key={modal.item.id}
              defaultValues={{
                name: modal.item.name,
                environment: modal.item.environment,
                status: modal.item.status,
              }}
              onSubmit={handleUpdate(modal.item.id)}
              onCancel={close}
              isLoading={updateRun.isPending}
            />
          )}
        </Modal>
        <ConfirmDialog
          isOpen={modal.type === "delete"}
          onClose={close}
          onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
          title="Delete Test Run"
          description={deleteItem ? `Delete "${deleteItem.name}"?` : ""}
          isLoading={deleteRun.isPending}
        />
        <Modal
          isOpen={importModal === "junit"}
          onClose={() => setImportModal(null)}
          title="Import JUnit XML"
        >
          {importModal === "junit" && (
            <JUnitImportForm
              onSubmit={handleImport}
              onCancel={() => setImportModal(null)}
              isLoading={importJunit.isPending}
            />
          )}
        </Modal>
        <Modal
          isOpen={importModal === "allure"}
          onClose={() => setImportModal(null)}
          title="Import Allure Results"
        >
          {importModal === "allure" && (
            <AllureImportForm
              onSubmit={handleAllureImport}
              onCancel={() => setImportModal(null)}
              isLoading={importAllure.isPending}
            />
          )}
        </Modal>
      </>
    );
  },
);
RunsSection.displayName = "RunsSection";
