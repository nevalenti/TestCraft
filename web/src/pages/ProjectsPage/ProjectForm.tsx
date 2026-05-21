import { useState } from "react";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import type { CreateProjectDto, UpdateProjectDto } from "@/types";

interface ProjectFormProps {
  defaultValues?: { name: string; description: string };
  onSubmit: (data: CreateProjectDto | UpdateProjectDto) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const ProjectForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: ProjectFormProps) => {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(
    defaultValues?.description ?? "",
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, description: description || undefined });
      }}
      className="space-y-4"
    >
      <FormField label="Name" htmlFor="project-name">
        <input
          id="project-name"
          className="input input-bordered bg-base-200 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={255}
          placeholder="My Project"
          autoFocus
        />
      </FormField>
      <FormField label="Description" htmlFor="project-description">
        <textarea
          id="project-description"
          className="textarea textarea-bordered bg-base-200 w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
          rows={2}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
