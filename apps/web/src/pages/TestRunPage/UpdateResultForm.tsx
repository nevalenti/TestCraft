import { zodResolver } from "@hookform/resolvers/zod";
import { TestResultStatus, type UpdateTestResult } from "@testcraft/types";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import { FormTextarea } from "@/components/ui/FormTextarea";
import { statusOptions } from "@/lib/constants";

const schema = z.object({
  status: z.nativeEnum(TestResultStatus),
  notes: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface UpdateResultFormProps {
  defaultValues: { status: TestResultStatus; notes: string };
  onSubmit: (data: UpdateTestResult) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const UpdateResultForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: UpdateResultFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({ ...data, notes: data.notes || undefined }),
      )}
      className="space-y-4"
    >
      <FormField
        label="Status"
        htmlFor="update-result-status"
        error={errors.status?.message}
      >
        <select
          id="update-result-status"
          className="select-bordered select w-full"
          autoFocus
          {...register("status")}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField
        label="Notes"
        htmlFor="update-result-notes"
        error={errors.notes?.message}
      >
        <FormTextarea
          id="update-result-notes"
          placeholder="Optional"
          rows={2}
          {...register("notes")}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
