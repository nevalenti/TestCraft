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
      <FormField label="Name">
        <input
          className="input input-bordered w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={255}
          placeholder="User can log in with valid credentials"
        />
      </FormField>
      <FormField label="Description">
        <textarea
          className="textarea textarea-bordered w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
          rows={4}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
