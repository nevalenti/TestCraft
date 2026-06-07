import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateTestSuite, UpdateTestSuite } from "@testcraft/types";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000),
});

type FormValues = z.infer<typeof schema>;

interface SuiteFormProps {
  defaultValues?: { name: string; description: string };
  onSubmit: (data: CreateTestSuite | UpdateTestSuite) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const SuiteForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: SuiteFormProps) => {
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
      <FormField label="Name" htmlFor="suite-name" error={errors.name?.message}>
        <input
          id="suite-name"
          className={`input-bordered input w-full bg-base-200${errors.name ? " input-error" : ""}`}
          placeholder="Login Flow"
          autoFocus
          {...register("name")}
        />
      </FormField>
      <FormField
        label="Description"
        htmlFor="suite-description"
        error={errors.description?.message}
      >
        <textarea
          id="suite-description"
          className="textarea-bordered textarea w-full bg-base-200"
          placeholder="Optional"
          rows={2}
          {...register("description")}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
