import { zodResolver } from "@hookform/resolvers/zod";
import {
  DefectType,
  TestResultStatus,
  type UpdateTestResult,
} from "@testcraft/types";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import { FormTextarea } from "@/components/ui/FormTextarea";
import { statusOptions } from "@/lib/constants";

const defectTypeOptions = [
  { value: DefectType.ProductBug, label: "Product Bug" },
  { value: DefectType.AutomationBug, label: "Automation Bug" },
  { value: DefectType.EnvironmentIssue, label: "Environment Issue" },
  { value: DefectType.ToInvestigate, label: "To Investigate" },
];

const schema = z.object({
  status: z.nativeEnum(TestResultStatus),
  notes: z.string(),
  defectType: z.union([z.nativeEnum(DefectType), z.literal("")]).optional(),
});

type FormValues = z.infer<typeof schema>;

interface UpdateResultFormProps {
  defaultValues: {
    status: TestResultStatus;
    notes: string;
    defectType?: DefectType;
  };
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
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const status = useWatch({ control, name: "status" });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          status: data.status,
          notes: data.notes || undefined,
          defectType:
            data.status === TestResultStatus.Failed && data.defectType !== ""
              ? data.defectType
              : undefined,
        }),
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
      {status === TestResultStatus.Failed && (
        <FormField
          label="Defect Type"
          htmlFor="update-result-defect-type"
          error={errors.defectType?.message}
        >
          <select
            id="update-result-defect-type"
            className="select-bordered select w-full"
            {...register("defectType")}
          >
            <option value="">Select defect type (optional)</option>
            {defectTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      )}
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
