import type { AllureResultItem } from "@testcraft/types";
import { useState } from "react";

import { FileDropZone } from "@/components/ui/FileDropZone";
import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";

interface AllureImportFormProps {
  onSubmit: (data: {
    results: AllureResultItem[];
    environment: string;
    name?: string;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const AllureImportForm = ({
  onSubmit,
  onCancel,
  isLoading,
}: AllureImportFormProps) => {
  const [environment, setEnvironment] = useState("");
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<AllureResultItem[]>([]);
  const [errors, setErrors] = useState<{
    environment?: string;
    files?: string;
  }>({});

  const handleFilesChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setResults([]);
    if (newFiles.length === 0) {
      setErrors((prev) => ({ ...prev, files: undefined }));
      return;
    }
    const texts = await Promise.all(newFiles.map((file) => file.text()));
    const parsed: AllureResultItem[] = [];
    for (let index = 0; index < texts.length; index++) {
      try {
        parsed.push(JSON.parse(texts[index]) as AllureResultItem);
      } catch {
        setErrors((prev) => ({
          ...prev,
          files: `"${newFiles[index].name}" is not valid JSON`,
        }));
        return;
      }
    }
    setErrors((prev) => ({ ...prev, files: undefined }));
    setResults(parsed);
  };

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!environment.trim()) next.environment = "Environment is required";
    if (results.length === 0)
      next.files = "Please select at least one *-result.json file";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      results,
      environment: environment.trim(),
      name: name.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Result files (*-result.json)"
        htmlFor="allure-files"
        error={errors.files}
      >
        <FileDropZone
          id="allure-files"
          accept=".json,application/json"
          multiple
          files={files}
          onFilesChange={handleFilesChange}
          hint="Select one or more *-result.json files"
          hasError={!!errors.files}
        />
      </FormField>

      <FormField
        label="Environment"
        htmlFor="allure-environment"
        error={errors.environment}
      >
        <input
          id="allure-environment"
          className={`input input-bordered bg-base-200 w-full${errors.environment ? " input-error" : ""}`}
          placeholder="staging"
          value={environment}
          onChange={(event) => setEnvironment(event.target.value)}
        />
      </FormField>

      <FormField label="Run name (optional)" htmlFor="allure-name">
        <input
          id="allure-name"
          className="input input-bordered bg-base-200 w-full"
          placeholder="Defaults to 'Allure Import'"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </FormField>

      <FormActions onCancel={onCancel} isLoading={isLoading} label="Import" />
    </form>
  );
};
