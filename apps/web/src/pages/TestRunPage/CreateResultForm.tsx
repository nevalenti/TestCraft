import { zodResolver } from "@hookform/resolvers/zod";
import { type CreateTestResult, TestResultStatus } from "@testcraft/types";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import { useProjectTestCases } from "@/hooks/useTestCases";
import { statusOptions } from "@/lib/constants";

const toDatetimeLocal = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
};

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
          className={`select select-bordered w-full${errors.testCaseId ? " select-error" : ""}`}
          disabled={loadingCases}
          autoFocus
          {...register("testCaseId")}
        >
          <option value="">
            {loadingCases
              ? "Loading…"
              : cases?.length === 0
                ? "No test cases in project"
                : "Select a test case"}
          </option>
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
          className="select select-bordered w-full"
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
          className="input input-bordered bg-base-200 w-full"
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
          className="textarea textarea-bordered bg-base-200 w-full"
          placeholder="Optional"
          rows={2}
          {...register("notes")}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
