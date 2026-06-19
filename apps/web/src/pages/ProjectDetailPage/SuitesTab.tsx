import { PlusIcon, RectangleStackIcon } from "@heroicons/react/24/solid";
import type {
  CreateTestSuite,
  TestSuite,
  UpdateTestSuite,
} from "@testcraft/types";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { ResourceCard } from "@/components/ui/ResourceCard";
import { ResourceListItem } from "@/components/ui/ResourceListItem";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/hooks/useModal";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import {
  useCreateTestSuite,
  useDeleteTestSuite,
  useTestSuites,
  useUpdateTestSuite,
} from "@/hooks/useTestSuites";
import { formatDate } from "@/lib/format";
import { SourceFilter } from "@/pages/ProjectDetailPage/SourceFilter";
import { SuiteForm } from "@/pages/ProjectDetailPage/SuiteForm";
import { useViewModeStore } from "@/stores/viewMode";

export const SuitesTab = () => {
  const projectId = useRequiredParam("projectId");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const viewMode = useViewModeStore((state) => state.viewMode);
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestSuite>();
  const { data: suites, isPending } = useTestSuites(
    projectId,
    debouncedSearch || undefined,
  );
  const createSuite = useCreateTestSuite(projectId);
  const updateSuite = useUpdateTestSuite(projectId);
  const deleteSuite = useDeleteTestSuite(projectId);

  const handleCreate = (input: CreateTestSuite) =>
    createSuite.mutate(input, { onSuccess: close });
  const handleUpdate = (id: string) => (input: UpdateTestSuite) =>
    updateSuite.mutate({ id, ...input }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteSuite.mutate(id, { onSuccess: close });

  const deleteItem = modal.type === "delete" ? modal.item : null;

  const allSuites = suites ?? [];
  const sources = [
    ...new Set(allSuites.map((s) => s.source).filter(Boolean) as string[]),
  ].toSorted((a, b) => a.localeCompare(b));
  const sourceCounts = Object.fromEntries(
    sources.map((src) => [
      src,
      allSuites.filter((s) => s.source === src).length,
    ]),
  );
  const visibleSuites = sourceFilter
    ? allSuites.filter((s) => s.source === sourceFilter)
    : suites;

  const renderSuites = () => {
    if (isPending)
      return (
        <div className="flex min-h-80 items-center justify-center">
          <span className="loading loading-lg loading-spinner text-primary" />
        </div>
      );

    if (suites?.length === 0)
      return (
        <EmptyState
          title="No test suites yet"
          description="Group related test cases into suites."
        />
      );

    if (viewMode === "list")
      return (
        <div className="flex flex-col gap-2">
          {visibleSuites?.map((suite) => (
            <ResourceListItem
              key={suite.id}
              testId="suite-card"
              onEdit={() => openEdit(suite)}
              onDelete={() => openDelete(suite)}
              to={`/projects/${projectId}/suites/${suite.id}`}
              label="test suite"
              cardBg="card-bg-success"
              accentText="text-success"
              typeIcon={<RectangleStackIcon className="size-4" />}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">
                  {suite.name}
                </span>
                <p className="truncate text-xs text-base-content/60">
                  {suite.description ?? (
                    <span className="text-base-content/30 italic">
                      No description
                    </span>
                  )}
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                {suite.source && (
                  <span className="rounded-full bg-base-200 px-2 py-0.5 text-[11px] font-medium text-base-content/50">
                    {suite.source}
                  </span>
                )}
                <span className="text-[11px] font-medium text-base-content/40 tabular-nums">
                  {formatDate(suite.createdAt)}
                </span>
              </div>
            </ResourceListItem>
          ))}
        </div>
      );

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleSuites?.map((suite) => (
          <ResourceCard
            key={suite.id}
            testId="suite-card"
            onEdit={() => openEdit(suite)}
            onDelete={() => openDelete(suite)}
            to={`/projects/${projectId}/suites/${suite.id}`}
            label="test suite"
            cardBg="card-bg-success"
            accentText="text-success"
            typeIcon={<RectangleStackIcon className="size-3.5" />}
          >
            <div className="flex flex-col gap-1.5">
              <span className="line-clamp-2 text-base leading-snug font-semibold">
                {suite.name}
              </span>
              <p className="line-clamp-2 text-sm leading-relaxed text-base-content/70">
                {suite.description ?? (
                  <span className="text-base-content/30 italic">
                    No description
                  </span>
                )}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              {suite.source ? (
                <span className="rounded-full bg-base-200 px-2 py-0.5 text-[11px] font-medium text-base-content/50">
                  {suite.source}
                </span>
              ) : (
                <span />
              )}
              <span className="shrink-0 text-[11px] font-medium text-base-content/40 tabular-nums">
                {formatDate(suite.createdAt)}
              </span>
            </div>
          </ResourceCard>
        ))}
      </div>
    );
  };

  return (
    <>
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search test suites…"
      >
        <ViewToggle />
        <button className="btn btn-sm btn-primary" onClick={openCreate}>
          <PlusIcon className="size-4" aria-hidden="true" />
          New Suite
        </button>
      </ListToolbar>

      <SourceFilter
        sources={sources}
        counts={sourceCounts}
        value={sourceFilter}
        onChange={setSourceFilter}
      />

      {renderSuites()}

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
};
