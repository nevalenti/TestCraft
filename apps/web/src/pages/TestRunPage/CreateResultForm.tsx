import { zodResolver } from '@hookform/resolvers/zod';
import {
  type CreateTestResult,
  DefectType,
  TestResultStatus,
} from '@testcraft/types';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { FormActions } from '@/components/ui/FormActions';
import { FormField } from '@/components/ui/FormField';
import { FormInput } from '@/components/ui/FormInput';
import { FormTextarea } from '@/components/ui/FormTextarea';
import { useProjectTestCases } from '@/hooks/useTestCases';
import { cn } from '@/lib/cn';
import { statusOptions } from '@/lib/constants';
import { toDatetimeLocal } from '@/lib/format';

const defectTypeOptions = [
  { value: DefectType.ProductBug, label: 'Product Bug' },
  { value: DefectType.AutomationBug, label: 'Automation Bug' },
  { value: DefectType.EnvironmentIssue, label: 'Environment Issue' },
  { value: DefectType.ToInvestigate, label: 'To Investigate' },
];

const schema = z.object({
  testCaseId: z.string().min(1, 'Select a test case'),
  status: z.nativeEnum(TestResultStatus),
  notes: z.string(),
  durationMs: z.coerce
    .number()
    .int()
    .nonnegative()
    .optional()
    .or(z.literal('')),
  defectType: z.union([z.nativeEnum(DefectType), z.literal('')]).optional(),
  executedAt: z.string().min(1, 'Executed at is required'),
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
      testCaseId: '',
      status: TestResultStatus.Passed,
      notes: '',
      durationMs: '',
      executedAt: toDatetimeLocal(new Date().toISOString()),
    },
  });

  const status = useWatch({ control, name: 'status' });

  let defaultOptionText: string;

  if (loadingCases) defaultOptionText = 'Loading…';
  else if (cases?.length === 0) defaultOptionText = 'No test cases in project';
  else defaultOptionText = 'Select a test case';

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          testCaseId: data.testCaseId,
          status: data.status,
          notes: data.notes || undefined,
          durationMs: data.durationMs === '' ? undefined : data.durationMs,
          defectType:
            data.status === TestResultStatus.Failed && data.defectType !== ''
              ? data.defectType
              : undefined,
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
          className={cn(
            'select-bordered select w-full',
            errors.testCaseId && 'select-error',
          )}
          disabled={loadingCases}
          autoFocus
          {...register('testCaseId')}
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
          {...register('status')}
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
          htmlFor="result-defect-type"
          error={errors.defectType?.message}
        >
          <select
            id="result-defect-type"
            className="select-bordered select w-full"
            {...register('defectType')}
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
        label="Duration (ms, optional)"
        htmlFor="result-duration"
        error={errors.durationMs?.message}
      >
        <FormInput
          id="result-duration"
          type="number"
          placeholder="1500"
          min={0}
          {...register('durationMs')}
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
          {...register('executedAt')}
        />
      </FormField>
      <FormField
        label="Notes"
        htmlFor="result-notes"
        error={errors.notes?.message}
      >
        <FormTextarea
          id="result-notes"
          placeholder="Optional"
          rows={2}
          {...register('notes')}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
