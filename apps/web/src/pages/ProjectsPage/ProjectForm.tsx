import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateProjectInput, UpdateProjectInput } from "@testcraft/types";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000),
});

type FormValues = z.infer<typeof schema>;

interface ProjectFormProps {
  defaultValues?: { name: string; description: string };
  onSubmit: (data: CreateProjectInput | UpdateProjectInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const ProjectForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: ProjectFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({ ...data, description: data.description || undefined }),
      )}
      className="space-y-4"
    >
      <FormField
        label="Name"
        htmlFor="project-name"
        error={errors.name?.message}
      >
        <input
          id="project-name"
          className={`input input-bordered bg-base-200 w-full${errors.name ? " input-error" : ""}`}
          placeholder="My Project"
          autoFocus
          {...register("name")}
        />
      </FormField>
      <FormField
        label="Description"
        htmlFor="project-description"
        error={errors.description?.message}
      >
        <textarea
          id="project-description"
          className="textarea textarea-bordered bg-base-200 w-full"
          placeholder="Optional"
          rows={2}
          {...register("description")}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
