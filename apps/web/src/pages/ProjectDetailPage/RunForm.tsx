import { zodResolver } from "@hookform/resolvers/zod";
import { TestRunStatus } from "@testcraft/types";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import { runStatusOptions } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  environment: z.string().min(1, "Environment is required").max(255),
  status: z.nativeEnum(TestRunStatus),
});

type FormValues = z.infer<typeof schema>;

interface RunFormProps {
  defaultValues?: { name: string; environment: string; status: TestRunStatus };
  onSubmit: (data: {
    name: string;
    environment: string;
    status: TestRunStatus;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const RunForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: RunFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      environment: defaultValues?.environment ?? "",
      status: defaultValues?.status ?? TestRunStatus.Active,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data))}
      className="space-y-4"
    >
      <FormField label="Name" htmlFor="run-name" error={errors.name?.message}>
        <input
          id="run-name"
          className={`input-bordered input w-full bg-base-200${errors.name ? " input-error" : ""}`}
          placeholder="Sprint 42 Regression"
          autoFocus
          {...register("name")}
        />
      </FormField>
      <FormField
        label="Environment"
        htmlFor="run-environment"
        error={errors.environment?.message}
      >
        <input
          id="run-environment"
          className={`input-bordered input w-full bg-base-200${errors.environment ? " input-error" : ""}`}
          placeholder="staging"
          {...register("environment")}
        />
      </FormField>
      <FormField
        label="Status"
        htmlFor="run-status"
        error={errors.status?.message}
      >
        <select
          id="run-status"
          className="select-bordered select w-full"
          {...register("status")}
        >
          {runStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
