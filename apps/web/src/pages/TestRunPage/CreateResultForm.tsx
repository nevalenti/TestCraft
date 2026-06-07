import { zodResolver } from "@hookform/resolvers/zod";
import { type CreateTestResult, TestResultStatus } from "@testcraft/types";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import { useProjectTestCases } from "@/hooks/useTestCases";
import { statusOptions } from "@/lib/constants";
import { toDatetimeLocal } from "@/lib/format";

const schema = z.object({
  testCaseId: z.string().min(1, "Select a test case"),
  status: z.nativeEnum(TestResultStatus),
  notes: z.string(),
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
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      testCaseId: "",
      status: TestResultStatus.Passed,
      notes: "",
      executedAt: toDatetimeLocal(new Date().toISOString()),
    },
  });

  let defaultOptionText: string;
  if (loadingCases) defaultOptionText = "Loading…";
  else if (cases?.length === 0) defaultOptionText = "No test cases in project";
  else defaultOptionText = "Select a test case";

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          testCaseId: data.testCaseId,
          status: data.status,
          notes: data.notes || undefined,
          executedAt: new Date(data.executedAt).toISOString(),
        }),
      )}
      className="space-y-4"
    >
      <FormField
        label="Test Case"
        htmlFor="result-test-case"
        error={errors.testCaseId?.message}
      >
        <select
          id="result-test-case"
          className={`select-bordered select w-full${errors.testCaseId ? " select-error" : ""}`}
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
        </select>
      </FormField>
      <FormField
        label="Status"
        htmlFor="result-status"
        error={errors.status?.message}
      >
        <select
          id="result-status"
          className="select-bordered select w-full"
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
        label="Executed At"
        htmlFor="result-executed-at"
        error={errors.executedAt?.message}
      >
        <input
          id="result-executed-at"
          type="datetime-local"
          className="input-bordered input w-full bg-base-200"
          {...register("executedAt")}
        />
      </FormField>
      <FormField
        label="Notes"
        htmlFor="result-notes"
        error={errors.notes?.message}
      >
        <textarea
          id="result-notes"
          className="textarea-bordered textarea w-full bg-base-200"
          placeholder="Optional"
          rows={2}
          {...register("notes")}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
