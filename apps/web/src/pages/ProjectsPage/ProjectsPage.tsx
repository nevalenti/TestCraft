import { PlusIcon } from "@heroicons/react/24/solid";
import type { CreateProject, Project, UpdateProject } from "@testcraft/types";
import { useState } from "react";

import { ErrorState } from "@/components/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/hooks/useModal";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "@/hooks/useProjects";
import { ProjectCard } from "@/pages/ProjectsPage/ProjectCard";
import { ProjectForm } from "@/pages/ProjectsPage/ProjectForm";

export const ProjectsPage = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<Project>();
  const {
    data: projects,
    isPending,
    isError,
  } = useProjects(debouncedSearch || undefined);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  useBreadcrumbs([{ label: "Dashboard", href: "/" }, { label: "Projects" }]);

  const handleCreate = (input: CreateProject) =>
    createProject.mutate(input, { onSuccess: close });
  const handleUpdate = (id: string) => (input: UpdateProject) =>
    updateProject.mutate({ id, ...input }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteProject.mutate(id, { onSuccess: close });

  if (isError)
    return (
      <ErrorState message="Failed to load projects. Please check your connection and try again." />
    );

  const deleteItem = modal.type === "delete" ? modal.item : null;

  return (
    <div className="w-full flex flex-col min-h-0">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">
            Projects
          </h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            Manage and organise your testing projects
          </p>
        </div>
      </header>

      <section className="page-content flex-1 overflow-y-auto min-h-0">
        <div className="mb-4 flex items-center gap-3">
          <input
            type="search"
            className="input input-bordered bg-base-200 w-full max-w-sm"
            placeholder="Search projects…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            className="btn btn-primary btn-sm ml-auto shrink-0"
            onClick={openCreate}
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            New Project
          </button>
        </div>
        <div className="min-h-80">
          {isPending ? (
            <SkeletonGrid />
          ) : projects?.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Projects group your test suites and runs."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects?.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => openEdit(project)}
                  onDelete={() => openDelete(project)}
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
