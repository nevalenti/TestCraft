import { useState } from "react";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import { useProjectTestCases } from "@/hooks/useTestCases";
import {
  type CreateTestResultDto,
  statusOptions,
  TestResultStatus,
} from "@/types";

const toDatetimeLocal = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
};

interface CreateResultFormProps {
  projectId: string;
  onSubmit: (data: CreateTestResultDto) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const CreateResultForm = ({
  projectId,
  onSubmit,
  onCancel,
  isLoading,
}: CreateResultFormProps) => {
  const [testCaseId, setTestCaseId] = useState("");
  const [status, setStatus] = useState<TestResultStatus>(
    TestResultStatus.Passed,
  );
  const [notes, setNotes] = useState("");
  const [executedAt, setExecutedAt] = useState(
    toDatetimeLocal(new Date().toISOString()),
  );
  const { data: cases, isPending: loadingCases } =
    useProjectTestCases(projectId);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          testCaseId,
          status,
          notes: notes || undefined,
          executedAt: new Date(executedAt).toISOString(),
        });
      }}
      className="space-y-4"
    >
      <FormField label="Test Case" htmlFor="result-test-case">
        <select
          id="result-test-case"
          className="select select-bordered w-full"
          value={testCaseId}
          onChange={(e) => setTestCaseId(e.target.value)}
          required
          disabled={loadingCases}
          autoFocus
        >
          <option value="">
            {loadingCases
              ? "Loading…"
              : cases?.length === 0
                ? "No test cases in project"
                : "Select a test case"}
          </option>
          {cases?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Status" htmlFor="result-status">
        <select
          id="result-status"
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
      <FormField label="Executed At" htmlFor="result-executed-at">
        <input
          id="result-executed-at"
          type="datetime-local"
          className="input input-bordered bg-base-200 w-full"
          value={executedAt}
          onChange={(e) => setExecutedAt(e.target.value)}
          required
        />
      </FormField>
      <FormField label="Notes" htmlFor="result-notes">
        <textarea
          id="result-notes"
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
