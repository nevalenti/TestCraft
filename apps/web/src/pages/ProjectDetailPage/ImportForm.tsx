import { CheckCircleIcon } from "@heroicons/react/24/solid";
import type { AllureResultItem } from "@testcraft/types";
import { useState } from "react";

import { FileDropZone } from "@/components/ui/FileDropZone";
import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";

type ImportData =
  | { type: "junit"; xml: string; environment: string; name?: string }
  | {
      type: "allure";
      results: AllureResultItem[];
      environment: string;
      name?: string;
    };

interface ImportFormProps {
  onSubmit: (data: ImportData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const detectFormat = (files: File[]) => {
  if (files.length === 0) return null;
  if (files.every((f) => f.name.toLowerCase().endsWith(".xml"))) return "junit";
  if (files.every((f) => f.name.toLowerCase().endsWith(".json")))
    return "allure";
  return "mixed";
};

export const ImportForm = ({
  onSubmit,
  onCancel,
  isLoading,
}: ImportFormProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [environment, setEnvironment] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{
    files?: string;
    environment?: string;
  }>({});

  const detectedFormat = detectFormat(files);

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setErrors((prev) => ({ ...prev, files: undefined }));
  };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!environment.trim()) next.environment = "Environment is required";
    if (files.length === 0) next.files = "Please drop a file to import";
    else if (detectedFormat === "mixed")
      next.files = "All files must be the same type (.xml or .json)";
    else if (detectedFormat === "junit" && files.length > 1)
      next.files = "JUnit import supports a single XML file";
    else {
      const MAX = 5 * 1024 * 1024;
      const oversized = files.find((f) => f.size > MAX);
      if (oversized)
        next.files = `"${oversized.name}" exceeds the 5 MB size limit`;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (detectedFormat === "junit") {
      const xml = await files[0].text();
      onSubmit({
        type: "junit",
        xml,
        environment: environment.trim(),
        name: name.trim() || undefined,
      });
    } else if (detectedFormat === "allure") {
      const texts = await Promise.all(files.map((f) => f.text()));
      const results: AllureResultItem[] = [];
      for (let i = 0; i < texts.length; i++) {
        try {
          const parsed = JSON.parse(texts[i]) as
            | AllureResultItem
            | AllureResultItem[];
          if (Array.isArray(parsed)) results.push(...parsed);
          else results.push(parsed);
        } catch {
          setErrors((prev) => ({
            ...prev,
            files: `"${files[i].name}" is not valid JSON`,
          }));
          return;
        }
      }
      onSubmit({
        type: "allure",
        results,
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
        />
        {detectedFormat && detectedFormat !== "mixed" && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-success">
            <CheckCircleIcon className="size-3.5" aria-hidden="true" />
            {detectedFormat === "junit"
              ? "JUnit XML detected"
              : "Allure JSON detected"}
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
          className={`input input-bordered bg-base-200 w-full${errors.environment ? " input-error" : ""}`}
          placeholder="staging"
          value={environment}
          onChange={(event) => setEnvironment(event.target.value)}
        />
      </FormField>

      <FormField label="Run name (optional)" htmlFor="import-name">
        <input
          id="import-name"
          className="input input-bordered bg-base-200 w-full"
          placeholder="Derived from file if left blank"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </FormField>

      <FormActions onCancel={onCancel} isLoading={isLoading} label="Import" />
    </form>
  );
};
