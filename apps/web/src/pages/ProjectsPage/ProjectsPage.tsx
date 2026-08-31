import { PlusIcon } from '@heroicons/react/24/solid';
import type { CreateProject, Project, UpdateProject } from '@testcraft/types';
import { useState } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListToolbar } from '@/components/ui/ListToolbar';
import { Modal } from '@/components/ui/Modal';
import { ResourceSkeleton } from '@/components/ui/ResourceSkeleton';
import { SkeletonStatus } from '@/components/ui/SkeletonStatus';
import { ViewToggle } from '@/components/ui/ViewToggle';
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from '@/features/projects/hooks';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { useModal } from '@/hooks/useModal';
import { ProjectCard } from '@/pages/ProjectsPage/ProjectCard';
import { ProjectForm } from '@/pages/ProjectsPage/ProjectForm';
import { useViewModeStore } from '@/stores/viewMode';

export const ProjectsPage = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const viewMode = useViewModeStore((state) => state.viewMode);
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

  useBreadcrumbs([{ label: 'Projects' }]);

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const handleCreate = (input: CreateProject) =>
    createProject.mutate(input, { onSuccess: close });
  const handleUpdate = (id: string) => (input: UpdateProject) =>
    updateProject.mutate({ id, ...input }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteProject.mutate(id, { onSuccess: close });

  const deleteItem = modal.type === 'delete' ? modal.item : null;

  const renderProjects = () => {
    if (isPending)
      return (
        showSkeleton && (
          <SkeletonStatus label="Loading projects…">
            <ResourceSkeleton viewMode={viewMode} />
          </SkeletonStatus>
        )
      );
    if (projects?.length === 0)
      return (
        <EmptyState
          title="No projects yet"
          description="Projects group your test suites and runs."
        />
      );

    return (
      <div
        className={
          viewMode === 'list'
            ? 'flex flex-col gap-2'
            : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
        }
      >
        {projects?.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            viewMode={viewMode}
            onEdit={() => openEdit(project)}
            onDelete={() => openDelete(project)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="mt-0.5 text-sm text-base-content/70">
            Manage and organise your testing projects
          </p>
        </div>
        <ViewToggle />
      </header>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <ListToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search projects…"
        >
          <button className="btn btn-sm btn-primary" onClick={openCreate}>
            <PlusIcon className="size-4" aria-hidden="true" />
            New Project
          </button>
        </ListToolbar>
        <div className="min-h-80">{renderProjects()}</div>
      </section>

      <Modal
        isOpen={modal.type === 'create'}
        onClose={close}
        title="New Project"
      >
        {modal.type === 'create' && (
          <ProjectForm
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createProject.isPending}
          />
        )}
      </Modal>
      <Modal
        isOpen={modal.type === 'edit'}
        onClose={close}
        title="Edit Project"
      >
        {modal.type === 'edit' && (
          <ProjectForm
            key={modal.item.id}
            defaultValues={{
              name: modal.item.name,
              description: modal.item.description ?? '',
            }}
            onSubmit={handleUpdate(modal.item.id)}
            onCancel={close}
            isLoading={updateProject.isPending}
          />
        )}
      </Modal>
      <ConfirmDialog
        isOpen={modal.type === 'delete'}
        onClose={close}
        onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
        title="Delete Project"
        description={
          deleteItem
            ? `Delete "${deleteItem.name}"? This cannot be undone.`
            : ''
        }
        isLoading={deleteProject.isPending}
      />
    </div>
  );
};
