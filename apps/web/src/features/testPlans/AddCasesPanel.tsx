import { PlusIcon } from "@heroicons/react/24/solid";
import type { TestCase } from "@testcraft/types";
import { useState } from "react";

import { SearchInput } from "@/components/ui/SearchInput";

interface AddCasesPanelProps {
  availableCases: TestCase[];
  onAdd: (testCaseId: string) => void;
  onAddAll?: (testCaseIds: string[]) => void;
  isAddingAll?: boolean;
}

export const AddCasesPanel = ({
  availableCases,
  onAdd,
  onAddAll,
  isAddingAll,
}: AddCasesPanelProps) => {
  const [search, setSearch] = useState("");
  const filtered = availableCases.filter((testCase) =>
    testCase.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search test cases…"
          className="flex-1"
        />
        {onAddAll && filtered.length > 1 && (
          <button
            type="button"
            className="btn shrink-0 btn-ghost btn-sm"
            onClick={() => onAddAll(filtered.map((testCase) => testCase.id))}
            disabled={isAddingAll}
          >
            {isAddingAll ? (
              <span className="loading size-3.5 loading-spinner" />
            ) : (
              <PlusIcon className="size-3.5" aria-hidden="true" />
            )}
            Add all {filtered.length}
          </button>
        )}
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-fg-subtle">
          {search ? "No matches." : "All test cases are in the plan."}
        </p>
      ) : (
        <ul className="max-h-[28rem] overflow-y-auto rounded-xl border border-border bg-base-100">
          {filtered.map((testCase) => (
            <li
              key={testCase.id}
              className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5 transition-colors last:border-b-0 hover:bg-base-content/5"
            >
              <span className="min-w-0 truncate text-sm font-medium">
                {testCase.name}
              </span>
              <button
                className="btn shrink-0 text-primary btn-ghost btn-xs"
                type="button"
                aria-label={`Add ${testCase.name}`}
                onClick={() => onAdd(testCase.id)}
              >
                <PlusIcon className="size-3.5" aria-hidden="true" />
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
