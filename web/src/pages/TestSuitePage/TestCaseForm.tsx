import { useState } from "react";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import type { CreateTestCaseDto, UpdateTestCaseDto } from "@/types";

interface TestCaseFormProps {
  defaultValues?: { name: string; description: string };
  onSubmit: (data: CreateTestCaseDto | UpdateTestCaseDto) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const TestCaseForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: TestCaseFormProps) => {
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
      <FormField label="Name" htmlFor="case-name">
        <input
          id="case-name"
          className="input input-bordered bg-base-200 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={255}
          placeholder="User can log in with valid credentials"
          autoFocus
        />
      </FormField>
      <FormField label="Description" htmlFor="case-description">
        <textarea
          id="case-description"
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
