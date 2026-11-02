import { zodResolver } from "@hookform/resolvers/zod";
import {
  DefectType,
  TestResultStatus,
  type UpdateTestResult,
} from "@testcraft/types";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/form/FormActions";
import { FormField } from "@/components/ui/form/FormField";
import { FormSelect } from "@/components/ui/form/FormSelect";
import { FormTextarea } from "@/components/ui/form/FormTextarea";
import { STATUS_OPTIONS } from "@/features/testResults/resultStatus";

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
          defect_type:
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
        <FormSelect
          id="update-result-status"
          className="select-bordered select w-full"
          autoFocus
          {...register("status")}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormSelect>
      </FormField>
      {status === TestResultStatus.Failed && (
        <FormField
          label="Defect Type"
          htmlFor="update-result-defect-type"
          error={errors.defectType?.message}
        >
          <FormSelect
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
          </FormSelect>
        </FormField>
      )}
      <FormField
        label="Notes"
        htmlFor="update-result-notes"
        optional
        error={errors.notes?.message}
      >
        <FormTextarea
          id="update-result-notes"
          placeholder="What happened, links to logs or tickets"
          rows={2}
          {...register("notes")}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
