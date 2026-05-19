import { useState } from "react";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import type { CreateTestRunDto, UpdateTestRunDto } from "@/types";

interface RunFormProps {
  defaultValues?: { name: string; environment: string };
  onSubmit: (data: CreateTestRunDto | UpdateTestRunDto) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const RunForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: RunFormProps) => {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [environment, setEnvironment] = useState(
    defaultValues?.environment ?? "",
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, environment });
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
          placeholder="Sprint 42 Regression"
        />
      </FormField>
      <FormField label="Environment">
        <input
          className="input input-bordered w-full"
          value={environment}
          onChange={(e) => setEnvironment(e.target.value)}
          required
          maxLength={255}
          placeholder="staging"
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
