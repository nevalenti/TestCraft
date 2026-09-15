import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import type { TestRun } from '@testcraft/types';

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
      <label
        htmlFor="run-a"
        className="mb-1 block text-xs font-medium text-base-content/75"
      >
        Run A
      </label>
      <select
        id="run-a"
        className="select-bordered select w-full select-sm"
        value={runA}
        onChange={(event) => onChangeRunA(event.target.value)}
      >
        <option value="">Select…</option>
        {(runs ?? []).map((run) => (
          <option key={run.id} value={run.id} disabled={run.id === runB}>
            {run.name}
          </option>
        ))}
      </select>
    </div>

    <span className="pb-1.5 text-xs font-semibold text-base-content/55 select-none">
      VS
    </span>

    <div className="min-w-36 flex-1">
      <label
        htmlFor="run-b"
        className="mb-1 block text-xs font-medium text-base-content/75"
      >
        Run B
      </label>
      <select
        id="run-b"
        className="select-bordered select w-full select-sm"
        value={runB}
        onChange={(event) => onChangeRunB(event.target.value)}
      >
        <option value="">Select…</option>
        {(runs ?? []).map((run) => (
          <option key={run.id} value={run.id} disabled={run.id === runA}>
            {run.name}
          </option>
        ))}
      </select>
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
