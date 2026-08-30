import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AllureResultItem } from '@testcraft/types';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormActions } from '@/components/ui/FormActions';
import { FormField } from '@/components/ui/FormField';
import { FileDropZone } from '@/features/testRuns/resultImport/FileDropZone';
import { detectFormat } from '@/features/testRuns/resultImport/importFormat';
import { cn } from '@/lib/cn';

type ImportData =
  | { type: 'junit'; xml: string; environment: string; name?: string }
  | {
      type: 'allure';
      results: AllureResultItem[];
      environment: string;
      name?: string;
    };

interface ImportFormProps {
  onSubmit: (data: ImportData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const schema = z.object({
  files: z.array(z.instanceof(File)).superRefine((files, ctx) => {
    if (files.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please drop a file to import',
      });
      return;
    }

    const format = detectFormat(files);

    if (format === 'mixed') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'All files must be the same type (.xml or .json)',
      });
      return;
    }

    if (format === 'junit' && files.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JUnit import supports a single XML file',
      });
      return;
    }

    const oversized = files.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `"${oversized.name}" exceeds the 5 MB size limit`,
      });
    }
  }),
  environment: z.string().min(1, 'Environment is required'),
  name: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const parseAllureFiles = async (
  files: File[],
): Promise<{ results: AllureResultItem[] } | { fileError: string }> => {
  const texts = await Promise.all(files.map((file) => file.text()));
  const results: AllureResultItem[] = [];

  for (const [i, text] of texts.entries()) {
    try {
      const parsed = JSON.parse(text) as AllureResultItem | AllureResultItem[];
      if (Array.isArray(parsed)) results.push(...parsed);
      else results.push(parsed);
    } catch {
      return { fileError: `"${files[i].name}" is not valid JSON` };
    }
  }

  return { results };
};

export const ImportForm = ({
  onSubmit,
  onCancel,
  isLoading,
}: ImportFormProps) => {
  const {
    control,
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { files: [], environment: '', name: '' },
  });

  const detectedFormat = detectFormat(watch('files'));

  const submit = handleSubmit(async (data) => {
    const format = detectFormat(data.files);

    if (format === 'junit') {
      const xml = await data.files[0].text();

      onSubmit({
        type: 'junit',
        xml,
        environment: data.environment.trim(),
        name: data.name?.trim() || undefined,
      });
    } else if (format === 'allure') {
      const allureData = await parseAllureFiles(data.files);

      if ('fileError' in allureData) {
        setError('files', { message: allureData.fileError });
        return;
      }

      onSubmit({
        type: 'allure',
        results: allureData.results,
        environment: data.environment.trim(),
        name: data.name?.trim() || undefined,
      });
    }
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField
        label="File"
        htmlFor="import-files"
        error={errors.files?.message}
      >
        <Controller
          control={control}
          name="files"
          render={({ field }) => (
            <FileDropZone
              id="import-files"
              accept=".xml,.json,application/xml,text/xml,application/json"
              multiple
              files={field.value}
              onFilesChange={field.onChange}
              hint="Drop a .xml (JUnit) or .json (Allure) file"
              hasError={!!errors.files}
              color="secondary"
            />
          )}
        />
        {detectedFormat && detectedFormat !== 'mixed' && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-success">
            <CheckCircleIcon className="size-3.5" aria-hidden="true" />
            {detectedFormat === 'junit'
              ? 'JUnit XML detected'
              : 'Allure JSON detected'}
          </span>
        )}
      </FormField>

      <FormField
        label="Environment"
        htmlFor="import-environment"
        error={errors.environment?.message}
      >
        <input
          id="import-environment"
          className={cn(
            'input-bordered input w-full bg-base-200',
            errors.environment && 'input-error',
          )}
          placeholder="staging"
          {...register('environment')}
        />
      </FormField>

      <FormField
        label="Run name (optional)"
        htmlFor="import-name"
        hint="Derived from the imported file if left blank."
      >
        <input
          id="import-name"
          className="input-bordered input w-full bg-base-200"
          placeholder="e.g. api-run-42"
          {...register('name')}
        />
      </FormField>

      <FormActions
        onCancel={onCancel}
        isLoading={isLoading}
        label="Import"
        variant="secondary"
      />
    </form>
  );
};
