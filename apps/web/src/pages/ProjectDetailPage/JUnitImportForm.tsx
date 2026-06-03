import { useState } from "react";

import { FileDropZone } from "@/components/ui/FileDropZone";
import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";

interface JUnitImportFormProps {
  onSubmit: (data: { xml: string; environment: string; name?: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const JUnitImportForm = ({
  onSubmit,
  onCancel,
  isLoading,
}: JUnitImportFormProps) => {
  const [environment, setEnvironment] = useState("");
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [xml, setXml] = useState("");
  const [errors, setErrors] = useState<{ environment?: string; file?: string }>(
    {},
  );

  const handleFilesChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setErrors((prev) => ({ ...prev, file: undefined }));
    if (newFiles.length === 0) {
      setXml("");
      return;
    }
    setXml(await newFiles[0].text());
  };

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!environment.trim()) next.environment = "Environment is required";
    if (!xml) next.file = "Please select a JUnit XML file";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      xml,
      environment: environment.trim(),
      name: name.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="XML File" htmlFor="junit-file" error={errors.file}>
        <FileDropZone
          id="junit-file"
          accept=".xml,application/xml,text/xml"
          files={files}
          onFilesChange={handleFilesChange}
          hint="JUnit XML report"
          hasError={!!errors.file}
        />
      </FormField>

      <FormField
        label="Environment"
        htmlFor="junit-environment"
        error={errors.environment}
      >
        <input
          id="junit-environment"
          className={`input input-bordered bg-base-200 w-full${errors.environment ? " input-error" : ""}`}
          placeholder="staging"
          value={environment}
          onChange={(event) => setEnvironment(event.target.value)}
        />
      </FormField>

      <FormField label="Run name (optional)" htmlFor="junit-name">
        <input
          id="junit-name"
          className="input input-bordered bg-base-200 w-full"
          placeholder="Derived from XML if left blank"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </FormField>

      <FormActions onCancel={onCancel} isLoading={isLoading} label="Import" />
    </form>
  );
};
