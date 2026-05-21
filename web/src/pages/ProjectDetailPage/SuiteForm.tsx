import { useState } from "react";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import type { CreateTestSuiteDto, UpdateTestSuiteDto } from "@/types";

interface SuiteFormProps {
  defaultValues?: { name: string; description: string };
  onSubmit: (data: CreateTestSuiteDto | UpdateTestSuiteDto) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const SuiteForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: SuiteFormProps) => {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(
    defaultValues?.description ?? "",
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, description: description || undefined });
      }}
      className="space-y-4"
    >
      <FormField label="Name" htmlFor="suite-name">
        <input
          id="suite-name"
          className="input input-bordered bg-base-200 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={255}
          placeholder="Login Flow"
          autoFocus
        />
      </FormField>
      <FormField label="Description" htmlFor="suite-description">
        <textarea
          id="suite-description"
          className="textarea textarea-bordered bg-base-200 w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
          rows={2}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
