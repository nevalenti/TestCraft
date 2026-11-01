import { zodResolver } from "@hookform/resolvers/zod";
import { TestCasePriority } from "@testcraft/types";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/form/FormActions";
import { FormField } from "@/components/ui/form/FormField";
import { FormInput } from "@/components/ui/form/FormInput";
import { FormSelect } from "@/components/ui/form/FormSelect";
import { FormTextarea } from "@/components/ui/form/FormTextarea";

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  priority: z.nativeEnum(TestCasePriority),
  description: z.string().max(1000),
});

type FormValues = z.infer<typeof schema>;

interface CaseFormProps {
  defaultValues?: {
    name: string;
    description: string;
    priority: TestCasePriority;
  };
  onSubmit: (data: {
    name: string;
    description?: string;
    priority: TestCasePriority;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const CaseForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: CaseFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      priority: defaultValues?.priority ?? TestCasePriority.Medium,
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
      <FormField label="Name" htmlFor="case-name" error={errors.name?.message}>
        <FormInput
          id="case-name"
          hasError={!!errors.name}
          placeholder="User can log in with valid credentials"
          autoFocus
          {...register("name")}
        />
      </FormField>
      <FormField
        label="Priority"
        htmlFor="case-priority"
        error={errors.priority?.message}
      >
        <FormSelect
          id="case-priority"
          className="select-bordered select w-full"
          {...register("priority")}
        >
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormSelect>
      </FormField>
      <FormField
        label="Description"
        htmlFor="case-description"
        optional
        error={errors.description?.message}
      >
        <FormTextarea
          id="case-description"
          placeholder="Preconditions, scope or links"
          rows={2}
          {...register("description")}
        />
      </FormField>
      <FormActions
        onCancel={onCancel}
        isLoading={isLoading}
        label={defaultValues ? "Save" : "Create"}
      />
    </form>
  );
};
