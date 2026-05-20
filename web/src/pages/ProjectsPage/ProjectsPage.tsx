import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "@/hooks/useProjects";
import type {
  CreateProjectDto,
  ModalState,
  ProjectDto,
  UpdateProjectDto,
} from "@/types";

import { ProjectCard } from "./ProjectCard";
import { ProjectForm } from "./ProjectForm";

export const ProjectsPage = () => {
  const [modal, setModal] = useState<ModalState<ProjectDto>>({
    type: "closed",
  });
  const { data: projects, isPending, isError } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  useBreadcrumbs([{ label: "home", href: "/" }, { label: "Projects" }]);
  const close = () => setModal({ type: "closed" });

  const handleCreate = (dto: CreateProjectDto) =>
    createProject.mutate(dto, { onSuccess: close });
  const handleUpdate = (id: string) => (dto: UpdateProjectDto) =>
    updateProject.mutate({ id, ...dto }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteProject.mutate(id, { onSuccess: close });

  if (isError)
    return <p className="text-error p-8">Failed to load projects.</p>;

  const deleteItem = modal.type === "delete" ? modal.item : null;

  return (
    <div className="w-full flex flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">
            Projects
          </h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            Manage and organise your testing projects
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm shrink-0"
          onClick={() => setModal({ type: "create" })}
        >
          New Project
        </button>
      </header>

      <section className="page-content flex-1">
        <div className="min-h-80">
          {isPending ? (
            <SkeletonGrid />
          ) : projects?.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Create your first project to start organising your test cases."
              action={
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setModal({ type: "create" })}
                >
                  Create First Project
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects?.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => setModal({ type: "edit", item: project })}
                  onDelete={() => setModal({ type: "delete", item: project })}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Modal
        isOpen={modal.type === "create"}
        onClose={close}
        title="New Project"
      >
        {modal.type === "create" && (
          <ProjectForm
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createProject.isPending}
          />
        )}
      </Modal>
      <Modal
        isOpen={modal.type === "edit"}
        onClose={close}
        title="Edit Project"
      >
        {modal.type === "edit" && (
          <ProjectForm
            key={modal.item.id}
            defaultValues={{
              name: modal.item.name,
              description: modal.item.description ?? "",
            }}
            onSubmit={handleUpdate(modal.item.id)}
            onCancel={close}
            isLoading={updateProject.isPending}
          />
        )}
      </Modal>
      <ConfirmDialog
        isOpen={modal.type === "delete"}
        onClose={close}
        onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
        title="Delete Project"
        description={
          deleteItem
            ? `Delete "${deleteItem.name}"? This cannot be undone.`
            : ""
        }
        isLoading={deleteProject.isPending}
      />
    </div>
  );
};
