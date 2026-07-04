import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import type { TestPlan } from "@testcraft/types";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useProject } from "@/hooks/useProjects";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import {
  useCreateTestPlan,
  useDeleteTestPlan,
  useTestPlans,
  useUpdateTestPlan,
} from "@/hooks/useTestPlans";
import { formatDate } from "@/lib/format";

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; plan: TestPlan };

export const TestPlansPage = () => {
  const projectId = useRequiredParam("projectId");
  const { data: project } = useProject(projectId);
  const { data: plans, isPending } = useTestPlans(projectId);
  const createPlan = useCreateTestPlan(projectId);
  const updatePlan = useUpdateTestPlan(projectId);
  const deletePlan = useDeleteTestPlan(projectId);
  const [modal, setModal] = useState<ModalState>({ type: "closed" });

  useBreadcrumbs([
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…", href: `/projects/${projectId}` },
    { label: "Test Plans" },
  ]);

  const {
    register: registerCreate,
    handleSubmit: handleCreate,
    reset: resetCreate,
  } = useForm<{ name: string; description: string }>({
    defaultValues: { name: "", description: "" },
  });
  const {
    register: registerEdit,
    handleSubmit: handleEdit,
    reset: resetEdit,
  } = useForm<{ name: string; description: string }>({
    defaultValues: { name: "", description: "" },
  });

  if (isPending)
    return (
      <div className="flex min-h-80 items-center justify-center">
        <span className="loading loading-lg loading-spinner text-primary" />
      </div>
    );

  const openEdit = (plan: TestPlan) => {
    resetEdit({ name: plan.name, description: plan.description ?? "" });
    setModal({ type: "edit", plan });
  };

  const close = () => setModal({ type: "closed" });

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Test Plans</h1>
          <p className="mt-0.5 text-sm text-base-content/70">
            Pre-select test cases for structured test runs
          </p>
        </div>
        <button
          className="btn gap-1.5 btn-sm btn-primary"
          onClick={() => {
            resetCreate({ name: "", description: "" });
            setModal({ type: "create" });
          }}
        >
          <PlusIcon className="size-4" />
          New Plan
        </button>
      </header>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        {plans?.length ? (
          <ul className="space-y-3">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-base-100 px-5 py-4 transition-colors hover:bg-base-200/40"
              >
                <div className="min-w-0">
                  <Link
                    to="/projects/$projectId/plans/$planId"
                    params={{ projectId, planId: plan.id }}
                    className="text-sm font-semibold hover:text-primary"
                  >
                    {plan.name}
                  </Link>
                  {plan.description && (
                    <p className="mt-0.5 truncate text-xs text-base-content/75">
                      {plan.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-base-content/65">
                    Created {formatDate(plan.createdAt)} · {plan.caseCount ?? 0}{" "}
                    case{plan.caseCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => openEdit(plan)}
                    aria-label="Edit plan"
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                  <button
                    className="btn text-error btn-ghost btn-xs"
                    onClick={() => deletePlan.mutate(plan.id)}
                    aria-label="Delete plan"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No test plans yet"
            description="Create a plan to pre-select test cases and run them as a structured suite."
            action={
              <button
                className="btn gap-1.5 btn-sm btn-primary"
                onClick={() => setModal({ type: "create" })}
              >
                <PlusIcon className="size-4" />
                New Plan
              </button>
            }
          />
        )}
      </section>

      <Modal
        isOpen={modal.type === "create"}
        onClose={close}
        title="New Test Plan"
      >
        <form
          onSubmit={handleCreate((data) =>
            createPlan.mutate(data, { onSuccess: close }),
          )}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="create-plan-name"
              className="label-text label text-xs"
            >
              Name
            </label>
            <input
              id="create-plan-name"
              className="input-bordered input input-sm w-full"
              autoFocus
              {...registerCreate("name", { required: true })}
            />
          </div>
          <div>
            <label
              htmlFor="create-plan-desc"
              className="label-text label text-xs"
            >
              Description (optional)
            </label>
            <textarea
              id="create-plan-desc"
              className="textarea-bordered textarea w-full textarea-sm"
              rows={2}
              {...registerCreate("description")}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={close}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              disabled={createPlan.isPending}
            >
              Create
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modal.type === "edit"}
        onClose={close}
        title="Edit Test Plan"
      >
        {modal.type === "edit" && (
          <form
            onSubmit={handleEdit((data) =>
              updatePlan.mutate(
                { id: modal.plan.id, ...data },
                { onSuccess: close },
              ),
            )}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="edit-plan-name"
                className="label-text label text-xs"
              >
                Name
              </label>
              <input
                id="edit-plan-name"
                className="input-bordered input input-sm w-full"
                autoFocus
                {...registerEdit("name", { required: true })}
              />
            </div>
            <div>
              <label
                htmlFor="edit-plan-desc"
                className="label-text label text-xs"
              >
                Description (optional)
              </label>
              <textarea
                id="edit-plan-desc"
                className="textarea-bordered textarea w-full textarea-sm"
                rows={2}
                {...registerEdit("description")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={close}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={updatePlan.isPending}
              >
                Save
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
