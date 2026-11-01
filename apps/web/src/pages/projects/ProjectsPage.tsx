import { PlusIcon } from "@heroicons/react/24/solid";
import type { CreateProject, Project, UpdateProject } from "@testcraft/types";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { ResourceView } from "@/components/ui/resource/ResourceView";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "@/features/projects/hooks";
import { ProjectCard } from "@/features/projects/ProjectCard";
import { ProjectForm } from "@/features/projects/ProjectForm";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";
import { useModal } from "@/hooks/useModal";

export const ProjectsPage = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<Project>();
  const {
    data: projects,
    isPending,
    isError,
    error,
    refetch,
  } = useProjects(debouncedSearch || undefined);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const showSkeleton = useIsLoadingVisible(isPending);

  useBreadcrumbs([{ label: "Projects" }]);

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const handleCreate = (input: CreateProject) =>
    createProject.mutate(input, { onSuccess: close });
  const handleUpdate = (item: Project) => (input: UpdateProject) =>
    updateProject.mutate(
      { id: item.id, version: item.version, ...input },
      { onSuccess: close },
    );
  const handleDelete = (id: string) =>
    deleteProject.mutate(id, { onSuccess: close });

  const deleteItem = modal.type === "delete" ? modal.item : null;

  const renderCard = (project: Project) => (
    <ProjectCard
      key={project.id}
      project={project}
      onEdit={() => openEdit(project)}
      onDelete={() => openDelete(project)}
    />
  );

  return (
    <div className="flex min-h-0 w-full flex-col">
      <PageHeader
        title="Projects"
        description="Each project holds its suites, runs, plans and analytics."
        actions={
          <button className="btn btn-sm btn-primary" onClick={openCreate}>
            <PlusIcon className="size-4" aria-hidden="true" />
            New Project
          </button>
        }
      />
      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <ListToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search projects…"
        />
        <div className="min-h-80">
          <ResourceView
            isPending={isPending}
            showSkeleton={showSkeleton}
            skeletonLabel="Loading projects…"
            isError={isError}
            error={error}
            onRetry={refetch}
            items={projects}
            viewMode="grid"
            emptyTitle="No projects yet"
            emptyDescription="Projects group your test suites and runs."
            renderCard={renderCard}
          />
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
            onSubmit={handleUpdate(modal.item)}
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
