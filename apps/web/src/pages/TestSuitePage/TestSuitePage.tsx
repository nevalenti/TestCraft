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
import { LabelBadge } from "@/components/ui/LabelBadge";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { ResourceCard } from "@/components/ui/ResourceCard";
import { ResourceListItem } from "@/components/ui/ResourceListItem";
import { ViewToggle } from "@/components/ui/ViewToggle";
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
import { useViewModeStore } from "@/stores/viewMode";

export const TestSuitePage = () => {
  const projectId = useRequiredParam("projectId");
  const suiteId = useRequiredParam("suiteId");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const viewMode = useViewModeStore((state) => state.viewMode);
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestCase>();

  const { data: project } = useProject(projectId);
  const { data: suite } = useTestSuite(projectId, suiteId);
  const {
    data: testCases,
    isPending,
    isError,
    error,
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
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…", href: `/projects/${projectId}` },
    { label: suite?.name ?? "…" },
  ]);

  const deleteItem = modal.type === "delete" ? modal.item : null;

  const renderTestCases = () => {
    if (isPending)
      return (
        <div className="flex min-h-80 items-center justify-center">
          <span className="loading loading-lg loading-spinner text-primary" />
        </div>
      );
    if (isError) return <ErrorState error={error} />;
    if (testCases?.length === 0)
      return (
        <EmptyState
          title="No test cases yet"
          description="Add test cases to document expected behaviour."
        />
      );

    if (viewMode === "list")
      return (
        <div className="flex flex-col gap-2">
          {testCases?.map((testCase) => (
            <ResourceListItem
              key={testCase.id}
              testId="case-card"
              onEdit={() => openEdit(testCase)}
              onDelete={() => openDelete(testCase)}
              to={`/projects/${projectId}/suites/${suiteId}/cases/${testCase.id}`}
              label="test case"
              cardBg="card-bg-info"
              accentText="text-info"
              typeIcon={<ClipboardDocumentListIcon className="size-4" />}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">
                  {testCase.name}
                </span>
                <p className="truncate text-xs text-base-content/85">
                  {testCase.description ?? (
                    <span className="text-base-content/55 italic">
                      No description
                    </span>
                  )}
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                {(testCase.labels ?? []).length > 0 && (
                  <div className="flex items-center gap-1">
                    {testCase.labels!.slice(0, 2).map((label) => (
                      <LabelBadge key={label.id} label={label} />
                    ))}
                    {testCase.labels!.length > 2 && (
                      <span className="text-[11px] font-medium text-base-content/65">
                        +{testCase.labels!.length - 2}
                      </span>
                    )}
                  </div>
                )}
                {testCase.stepCount > 0 && (
                  <span className="text-[11px] text-base-content/75">
                    {testCase.stepCount} step
                    {testCase.stepCount === 1 ? "" : "s"}
                  </span>
                )}
                <PriorityBadge priority={testCase.priority} />
                <span className="text-[11px] text-base-content/65 tabular-nums">
                  {formatDate(testCase.createdAt)}
                </span>
              </div>
            </ResourceListItem>
          ))}
        </div>
      );

    return (
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
            <div className="flex flex-col gap-1">
              <span className="line-clamp-2 text-base leading-snug font-semibold">
                {testCase.name}
              </span>
              <p className="line-clamp-2 text-sm leading-relaxed text-base-content/85">
                {testCase.description ?? (
                  <span className="text-base-content/55 italic">
                    No description
                  </span>
                )}
              </p>
            </div>
            {(testCase.labels ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {testCase.labels!.slice(0, 3).map((label) => (
                  <LabelBadge key={label.id} label={label} />
                ))}
                {testCase.labels!.length > 3 && (
                  <span className="text-[11px] font-medium text-base-content/65">
                    +{testCase.labels!.length - 3}
                  </span>
                )}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <PriorityBadge priority={testCase.priority} />
                {testCase.stepCount > 0 && (
                  <span className="text-[11px] text-base-content/75">
                    {testCase.stepCount} step
                    {testCase.stepCount === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-base-content/65 tabular-nums">
                {formatDate(testCase.createdAt)}
              </span>
            </div>
          </ResourceCard>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">{suite?.name}</h1>
            {suite?.source && (
              <span className="rounded-full bg-base-200 px-2 py-0.5 text-[11px] font-medium text-base-content/75">
                {suite.source}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-base-content/70">
            {suite?.description ?? "Test cases in this suite"}
          </p>
        </div>
      </header>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <ListToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search test cases…"
        >
          <ViewToggle />
          <button className="btn btn-sm btn-primary" onClick={openCreate}>
            <PlusIcon className="size-4" aria-hidden="true" />
            New Test Case
          </button>
        </ListToolbar>
        <div className="min-h-80">{renderTestCases()}</div>
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
