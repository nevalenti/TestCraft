import { useState } from "react";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import { runStatusOptions, TestRunStatus } from "@/types";

interface RunFormProps {
  defaultValues?: { name: string; environment: string; status: TestRunStatus };
  onSubmit: (data: {
    name: string;
    environment: string;
    status: TestRunStatus;
  }) => void;
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
  const [status, setStatus] = useState<TestRunStatus>(
    defaultValues?.status ?? TestRunStatus.Active,
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, environment, status });
      }}
      className="space-y-4"
    >
      <FormField label="Name" htmlFor="run-name">
        <input
          id="run-name"
          className="input input-bordered bg-base-200 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={255}
          placeholder="Sprint 42 Regression"
          autoFocus
        />
      </FormField>
      <FormField label="Environment" htmlFor="run-environment">
        <input
          id="run-environment"
          className="input input-bordered bg-base-200 w-full"
          value={environment}
          onChange={(e) => setEnvironment(e.target.value)}
          required
          maxLength={255}
          placeholder="staging"
        />
      </FormField>
      <FormField label="Status" htmlFor="run-status">
        <select
          id="run-status"
          className="select select-bordered w-full"
          value={status}
          onChange={(e) => setStatus(Number(e.target.value) as TestRunStatus)}
        >
          {runStatusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
