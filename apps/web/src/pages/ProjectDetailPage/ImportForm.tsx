import { CheckCircleIcon } from '@heroicons/react/24/solid';
import type { AllureResultItem } from '@testcraft/types';
import { useState } from 'react';

import { FormActions } from '@/components/ui/FormActions';
import { FormField } from '@/components/ui/FormField';
import { cn } from '@/lib/cn';
import { FileDropZone } from '@/pages/ProjectDetailPage/FileDropZone';

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

type DetectedFormat = 'junit' | 'allure' | 'mixed' | null;
type FormErrors = { files?: string; environment?: string };

const detectFormat = (files: File[]): DetectedFormat => {
  if (files.length === 0) return null;
  if (files.every((file) => file.name.toLowerCase().endsWith('.xml')))
    return 'junit';
  if (files.every((file) => file.name.toLowerCase().endsWith('.json')))
    return 'allure';

  return 'mixed';
};

const validateImport = (
  files: File[],
  environment: string,
  detectedFormat: DetectedFormat,
): FormErrors => {
  const next: FormErrors = {};

  if (!environment.trim()) next.environment = 'Environment is required';
  if (files.length === 0) next.files = 'Please drop a file to import';
  else if (detectedFormat === 'mixed')
    next.files = 'All files must be the same type (.xml or .json)';
  else if (detectedFormat === 'junit' && files.length > 1)
    next.files = 'JUnit import supports a single XML file';
  else {
    const MAX = 5 * 1024 * 1024;
    const oversized = files.find((file) => file.size > MAX);

    if (oversized)
      next.files = `"${oversized.name}" exceeds the 5 MB size limit`;
  }

  return next;
};

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
  const [files, setFiles] = useState<File[]>([]);
  const [environment, setEnvironment] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const detectedFormat = detectFormat(files);

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setErrors((previous) => ({ ...previous, files: undefined }));
  };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = validateImport(files, environment, detectedFormat);

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (detectedFormat === 'junit') {
      const xml = await files[0].text();

      onSubmit({
        type: 'junit',
        xml,
        environment: environment.trim(),
        name: name.trim() || undefined,
      });
    } else if (detectedFormat === 'allure') {
      const allureData = await parseAllureFiles(files);

      if ('fileError' in allureData) {
        setErrors((previous) => ({ ...previous, files: allureData.fileError }));

        return;
      }

      onSubmit({
        type: 'allure',
        results: allureData.results,
        environment: environment.trim(),
        name: name.trim() || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="File" htmlFor="import-files" error={errors.files}>
        <FileDropZone
          id="import-files"
          accept=".xml,.json,application/xml,text/xml,application/json"
          multiple
          files={files}
          onFilesChange={handleFilesChange}
          hint="Drop a .xml (JUnit) or .json (Allure) file"
          hasError={!!errors.files}
          color="secondary"
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
        error={errors.environment}
      >
        <input
          id="import-environment"
          className={cn(
            'input-bordered input w-full bg-base-200',
            errors.environment && 'input-error',
          )}
          placeholder="staging"
          value={environment}
          onChange={(event) => setEnvironment(event.target.value)}
        />
      </FormField>

      <FormField label="Run name (optional)" htmlFor="import-name">
        <input
          id="import-name"
          className="input-bordered input w-full bg-base-200"
          placeholder="Derived from file if left blank"
          value={name}
          onChange={(event) => setName(event.target.value)}
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
