import { useState } from "react";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import { priorityOptions, TestCasePriority } from "@/types";

interface TestCaseFormProps {
  defaultValues?: {
    name: string;
    description: string;
    priority: TestCasePriority;
  };
  onSubmit: (data: {
    name: string;
    description?: string;
    priority: TestCasePriority;
  }) => void;
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
  const [priority, setPriority] = useState<TestCasePriority>(
    defaultValues?.priority ?? TestCasePriority.Medium,
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, description: description || undefined, priority });
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
      <FormField label="Priority" htmlFor="case-priority">
        <select
          id="case-priority"
          className="select select-bordered w-full"
          value={priority}
          onChange={(e) =>
            setPriority(Number(e.target.value) as TestCasePriority)
          }
        >
          {priorityOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
