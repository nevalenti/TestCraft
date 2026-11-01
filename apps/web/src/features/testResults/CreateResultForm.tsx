import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateTestResult,
  DefectType,
  TestResultStatus,
} from "@testcraft/types";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/form/FormActions";
import { FormField } from "@/components/ui/form/FormField";
import { FormInput } from "@/components/ui/form/FormInput";
import { FormSelect } from "@/components/ui/form/FormSelect";
import { FormTextarea } from "@/components/ui/form/FormTextarea";
import { useProjectTestCases } from "@/features/testCases/hooks";
import { EXECUTED_STATUS_OPTIONS } from "@/features/testResults/resultStatus";
import { cn } from "@/lib/cn";
import { toDatetimeLocal } from "@/lib/format";

const defectTypeOptions = [
  { value: DefectType.ProductBug, label: "Product Bug" },
  { value: DefectType.AutomationBug, label: "Automation Bug" },
  { value: DefectType.EnvironmentIssue, label: "Environment Issue" },
  { value: DefectType.ToInvestigate, label: "To Investigate" },
];

const schema = z.object({
  testCaseId: z.string().min(1, "Select a test case"),
  status: z.enum([
    TestResultStatus.Passed,
    TestResultStatus.Failed,
    TestResultStatus.Blocked,
    TestResultStatus.Skipped,
  ]),
  notes: z.string(),
  durationMs: z.coerce
    .number()
    .int()
    .nonnegative()
    .optional()
    .or(z.literal("")),
  defectType: z.union([z.nativeEnum(DefectType), z.literal("")]).optional(),
  executedAt: z.string().min(1, "Executed at is required"),
});

type FormValues = z.infer<typeof schema>;

interface CreateResultFormProps {
  projectId: string;
  onSubmit: (data: CreateTestResult) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const CreateResultForm = ({
  projectId,
  onSubmit,
  onCancel,
  isLoading,
}: CreateResultFormProps) => {
  const { data: cases, isPending: loadingCases } =
    useProjectTestCases(projectId);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      testCaseId: "",
      status: TestResultStatus.Passed,
      notes: "",
      durationMs: "",
      executedAt: toDatetimeLocal(new Date().toISOString()),
    },
  });

  const status = useWatch({ control, name: "status" });

  let defaultOptionText: string;

  if (loadingCases) defaultOptionText = "Loading…";
  else if (cases?.length === 0) defaultOptionText = "No test cases in project";
  else defaultOptionText = "Select a test case";

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          test_case_id: data.testCaseId,
          status: data.status,
          notes: data.notes || undefined,
          duration_ms: data.durationMs === "" ? undefined : data.durationMs,
          defect_type:
            data.status === TestResultStatus.Failed && data.defectType !== ""
              ? data.defectType
              : undefined,
          executed_at: new Date(data.executedAt).toISOString(),
        }),
      )}
      className="space-y-4"
    >
      <FormField
        label="Test Case"
        htmlFor="result-test-case"
        error={errors.testCaseId?.message}
      >
        <FormSelect
          id="result-test-case"
          className={cn(
            "select-bordered select w-full",
            errors.testCaseId && "select-error",
          )}
          disabled={loadingCases}
          autoFocus
          {...register("testCaseId")}
        >
          <option value="">{defaultOptionText}</option>
          {cases?.map((testCase) => (
            <option key={testCase.id} value={testCase.id}>
              {testCase.name}
            </option>
          ))}
        </FormSelect>
      </FormField>
      <FormField
        label="Status"
        htmlFor="result-status"
        error={errors.status?.message}
      >
        <FormSelect
          id="result-status"
          className="select-bordered select w-full"
          {...register("status")}
        >
          {EXECUTED_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormSelect>
      </FormField>
      {status === TestResultStatus.Failed && (
        <FormField
          label="Defect Type"
          htmlFor="result-defect-type"
          error={errors.defectType?.message}
        >
          <FormSelect
            id="result-defect-type"
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
        label="Duration (ms)"
        htmlFor="result-duration"
        optional
        error={errors.durationMs?.message}
      >
        <FormInput
          id="result-duration"
          type="number"
          placeholder="1500"
          min={0}
          {...register("durationMs")}
        />
      </FormField>
      <FormField
        label="Executed At"
        htmlFor="result-executed-at"
        error={errors.executedAt?.message}
      >
        <FormInput
          id="result-executed-at"
          type="datetime-local"
          {...register("executedAt")}
        />
      </FormField>
      <FormField
        label="Notes"
        htmlFor="result-notes"
        optional
        error={errors.notes?.message}
      >
        <FormTextarea
          id="result-notes"
          placeholder="What happened, links to logs or tickets"
          rows={2}
          {...register("notes")}
        />
      </FormField>
      <FormActions
        onCancel={onCancel}
        isLoading={isLoading}
        label="Add result"
      />
    </form>
  );
};
