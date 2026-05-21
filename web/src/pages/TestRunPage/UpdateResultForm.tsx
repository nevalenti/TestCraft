import { useState } from "react";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import {
  statusOptions,
  TestResultStatus,
  type UpdateTestResultDto,
} from "@/types";

interface UpdateResultFormProps {
  defaultValues: { status: TestResultStatus; notes: string };
  onSubmit: (data: UpdateTestResultDto) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const UpdateResultForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: UpdateResultFormProps) => {
  const [status, setStatus] = useState<TestResultStatus>(defaultValues.status);
  const [notes, setNotes] = useState(defaultValues.notes);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ status, notes: notes || undefined });
      }}
      className="space-y-4"
    >
      <FormField label="Status" htmlFor="update-result-status">
        <select
          id="update-result-status"
          autoFocus
          className="select select-bordered w-full"
          value={status}
          onChange={(e) =>
            setStatus(Number(e.target.value) as TestResultStatus)
          }
          required
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Notes" htmlFor="update-result-notes">
        <textarea
          id="update-result-notes"
          className="textarea textarea-bordered bg-base-200 w-full"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
          rows={2}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
