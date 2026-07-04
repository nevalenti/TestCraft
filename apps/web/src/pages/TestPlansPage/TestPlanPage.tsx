import type { DragEndEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  PlayIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { useNavigate } from "@tanstack/react-router";
import type { TestPlanCase } from "@testcraft/types";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Modal } from "@/components/ui/Modal";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useProject } from "@/hooks/useProjects";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import { useProjectTestCases } from "@/hooks/useTestCases";
import {
  useAddCaseToPlan,
  useCreateRunFromPlan,
  useRemoveCaseFromPlan,
  useReorderPlanCases,
  useTestPlan,
  useTestPlanCases,
} from "@/hooks/useTestPlans";

interface SortableItemProps {
  item: TestPlanCase;
  onRemove: (id: string) => void;
}

function SortableItem({ item, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.testCaseId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-border bg-base-100 px-4 py-3"
    >
      <button
        className="cursor-grab touch-none text-base-content/55 hover:text-base-content/85"
        {...listeners}
        {...attributes}
        aria-label="Drag to reorder"
      >
        <Bars3Icon className="size-4" />
      </button>
      <span className="w-5 text-right text-xs text-base-content/65 tabular-nums">
        {item.order}
      </span>
      <span className="flex-1 text-sm font-medium">{item.testCaseName}</span>
      <button
        className="btn text-error btn-ghost btn-xs"
        onClick={() => onRemove(item.testCaseId)}
        aria-label="Remove from plan"
      >
        <TrashIcon className="size-3.5" />
      </button>
    </li>
  );
}

export const TestPlanPage = () => {
  const projectId = useRequiredParam("projectId");
  const planId = useRequiredParam("planId");
  const navigate = useNavigate();

  const { data: project } = useProject(projectId);
  const { data: plan } = useTestPlan(projectId, planId);
  const { data: cases, isPending } = useTestPlanCases(projectId, planId);
  const { data: allCases } = useProjectTestCases(projectId);
  const addCase = useAddCaseToPlan(projectId, planId);
  const removeCase = useRemoveCaseFromPlan(projectId, planId);
  const reorderCases = useReorderPlanCases(projectId, planId);
  const createRun = useCreateRunFromPlan(projectId);

  const [addSearch, setAddSearch] = useState("");
  const [runModalOpen, setRunModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<{
    name: string;
    environment: string;
  }>({ defaultValues: { name: "", environment: "" } });

  useBreadcrumbs([
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…", href: `/projects/${projectId}` },
    { label: "Test Plans", href: `/projects/${projectId}/plans` },
    { label: plan?.name ?? "…" },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortedCases = [...(cases ?? [])].toSorted((a, b) => a.order - b.order);
  const caseIds = sortedCases.map((c) => c.testCaseId);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = sortedCases.findIndex((c) => c.testCaseId === active.id);
    const newIndex = sortedCases.findIndex((c) => c.testCaseId === over.id);
    const reordered = arrayMove(sortedCases, oldIndex, newIndex);
    reorderCases.mutate(
      reordered.map((c, i) => ({ testCaseId: c.testCaseId, order: i + 1 })),
    );
  };

  const availableToAdd = (allCases ?? []).filter(
    (c) =>
      !caseIds.includes(c.id) &&
      c.name.toLowerCase().includes(addSearch.toLowerCase()),
  );

  const handleRunFromPlan = (data: { name: string; environment: string }) => {
    createRun.mutate(
      { planId, name: data.name, environment: data.environment },
      {
        onSuccess: (run) => {
          reset();
          setRunModalOpen(false);
          navigate({
            to: "/projects/$projectId/runs/$runId",
            params: { projectId, runId: run.id },
          });
        },
      },
    );
  };

  const renderPlanCases = () => {
    if (isPending) {
      return (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner text-primary" />
        </div>
      );
    }
    if (sortedCases.length === 0) {
      return (
        <p className="text-sm text-base-content/65">
          Add test cases from the right panel.
        </p>
      );
    }
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={caseIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {sortedCases.map((item) => (
              <SortableItem
                key={item.testCaseId}
                item={item}
                onRemove={(id) => removeCase.mutate(id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    );
  };

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{plan?.name ?? "…"}</h1>
          {plan?.description && (
            <p className="mt-0.5 text-sm text-base-content/70">
              {plan.description}
            </p>
          )}
        </div>
        <button
          className="btn gap-1.5 btn-sm btn-primary"
          onClick={() => setRunModalOpen(true)}
          disabled={sortedCases.length === 0}
        >
          <PlayIcon className="size-4" />
          Run Plan
        </button>
      </header>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-widest text-base-content/75 uppercase">
              Plan Cases ({sortedCases.length})
            </p>
            {renderPlanCases()}
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold tracking-widest text-base-content/75 uppercase">
              Add Cases
            </p>
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-base-content/65" />
              <input
                className="input-bordered input input-sm w-full pl-8"
                placeholder="Search test cases…"
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
              />
            </div>
            {availableToAdd.length === 0 ? (
              <p className="text-sm text-base-content/65">
                {addSearch ? "No matches." : "All test cases are in the plan."}
              </p>
            ) : (
              <ul className="max-h-96 space-y-2 overflow-y-auto">
                {availableToAdd.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-base-100 px-4 py-2.5"
                  >
                    <span className="text-sm font-medium">{c.name}</span>
                    <button
                      className="btn text-primary btn-ghost btn-xs"
                      onClick={() => addCase.mutate(c.id)}
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <Modal
        isOpen={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        title="Run Test Plan"
      >
        <form onSubmit={handleSubmit(handleRunFromPlan)} className="space-y-4">
          <div>
            <label htmlFor="run-name" className="label-text label text-xs">
              Run Name
            </label>
            <input
              id="run-name"
              className="input-bordered input input-sm w-full"
              autoFocus
              placeholder={`${plan?.name ?? "Plan"} – Run 1`}
              {...register("name", { required: true })}
            />
          </div>
          <div>
            <label htmlFor="run-env" className="label-text label text-xs">
              Environment (optional)
            </label>
            <input
              id="run-env"
              className="input-bordered input input-sm w-full"
              placeholder="e.g. staging"
              {...register("environment")}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setRunModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              disabled={createRun.isPending}
            >
              Start Run
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
