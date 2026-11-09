import { useForm } from "react-hook-form";

import { FormField } from "@/components/ui/form/FormField";
import { FormInput } from "@/components/ui/form/FormInput";

interface RunFromPlanFormProps {
  planName: string;
  onSubmit: (data: { name: string; environment: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const RunFromPlanForm = ({
  planName,
  onSubmit,
  onCancel,
  isLoading,
}: RunFromPlanFormProps) => {
  const { register, handleSubmit } = useForm<{
    name: string;
    environment: string;
  }>({ defaultValues: { name: "", environment: "" } });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Run Name" htmlFor="run-name">
        <FormInput
          id="run-name"
          autoFocus
          placeholder={`${planName} – Run 1`}
          {...register("name", { required: true })}
        />
      </FormField>
      <FormField label="Environment (optional)" htmlFor="run-env">
        <FormInput
          id="run-env"
          placeholder="e.g. staging"
          {...register("environment")}
        />
      </FormField>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-sm btn-primary"
          disabled={isLoading}
        >
          Start Run
        </button>
      </div>
    </form>
  );
};
