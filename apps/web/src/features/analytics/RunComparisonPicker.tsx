import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import type { TestRun } from "@testcraft/types";

import { FormField } from "@/components/ui/form/FormField";
import { FormSelect } from "@/components/ui/form/FormSelect";

interface RunComparisonPickerProps {
  runs: TestRun[] | undefined;
  runA: string;
  runB: string;
  canCompare: boolean;
  onChangeRunA: (id: string) => void;
  onChangeRunB: (id: string) => void;
  onCompare: () => void;
}

export const RunComparisonPicker = ({
  runs,
  runA,
  runB,
  canCompare,
  onChangeRunA,
  onChangeRunB,
  onCompare,
}: RunComparisonPickerProps) => (
  <div className="flex flex-wrap items-end gap-2">
    <div className="min-w-36 flex-1">
      <FormField label="Run A" htmlFor="run-a">
        <FormSelect
          id="run-a"
          className="select-sm"
          value={runA}
          onChange={(event) => onChangeRunA(event.target.value)}
        >
          <option value="">Select…</option>
          {(runs ?? []).map((run) => (
            <option key={run.id} value={run.id} disabled={run.id === runB}>
              {run.name}
            </option>
          ))}
        </FormSelect>
      </FormField>
    </div>

    <span className="pb-1.5 text-xs font-semibold text-fg-subtle select-none">
      VS
    </span>

    <div className="min-w-36 flex-1">
      <FormField label="Run B" htmlFor="run-b">
        <FormSelect
          id="run-b"
          className="select-sm"
          value={runB}
          onChange={(event) => onChangeRunB(event.target.value)}
        >
          <option value="">Select…</option>
          {(runs ?? []).map((run) => (
            <option key={run.id} value={run.id} disabled={run.id === runA}>
              {run.name}
            </option>
          ))}
        </FormSelect>
      </FormField>
    </div>

    <button
      className="btn shrink-0 btn-sm btn-primary"
      disabled={!canCompare}
      onClick={onCompare}
    >
      <ArrowsRightLeftIcon className="size-3.5" />
      Compare
    </button>
  </div>
);
