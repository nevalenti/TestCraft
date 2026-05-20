import { useState } from "react";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import { useTestCases } from "@/hooks/useTestCases";
import { useTestSuites } from "@/hooks/useTestSuites";
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

const caseSelectPlaceholder = (
  selectedSuiteId: string,
  loadingCases: boolean,
  caseCount: number | undefined,
) => {
  if (!selectedSuiteId) return "Select a suite first";
  if (loadingCases) return "Loading…";
  if (caseCount === 0) return "No test cases in this suite";
  return "Select a test case";
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
  const [selectedSuiteId, setSelectedSuiteId] = useState("");
  const [testCaseId, setTestCaseId] = useState("");
  const [status, setStatus] = useState<TestResultStatus>(
    TestResultStatus.Passed,
  );
  const [notes, setNotes] = useState("");
  const [executedAt, setExecutedAt] = useState(
    toDatetimeLocal(new Date().toISOString()),
  );
  const { data: suites, isPending: loadingSuites } = useTestSuites(projectId);
  const { data: cases, isPending: loadingCases } = useTestCases(
    projectId,
    selectedSuiteId,
  );

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
      <FormField label="Test Suite">
        <select
          className="select select-bordered w-full"
          value={selectedSuiteId}
          onChange={(e) => {
            setSelectedSuiteId(e.target.value);
            setTestCaseId("");
          }}
          required
          disabled={loadingSuites}
        >
          <option value="">
            {loadingSuites ? "Loading…" : "Select a suite"}
          </option>
          {suites?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Test Case">
        <select
          className="select select-bordered w-full"
          value={testCaseId}
          onChange={(e) => setTestCaseId(e.target.value)}
          required
          disabled={!selectedSuiteId || loadingCases}
        >
          <option value="">
            {caseSelectPlaceholder(
              selectedSuiteId,
              loadingCases,
              cases?.length,
            )}
          </option>
          {cases?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Status">
        <select
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
      <FormField label="Executed At">
        <input
          type="datetime-local"
          className="input input-bordered bg-base-200 w-full"
          value={executedAt}
          onChange={(e) => setExecutedAt(e.target.value)}
          required
        />
      </FormField>
      <FormField label="Notes">
        <textarea
          className="textarea textarea-bordered bg-base-200 w-full"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
          rows={4}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
