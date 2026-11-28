import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import type { TestCase } from "@testcraft/types";
import { useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
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
        <EmptyState
          compact
          icon={
            search ? (
              <MagnifyingGlassIcon className="size-5" />
            ) : (
              <CheckCircleIcon className="size-5 text-success" />
            )
          }
          title={
            search ? "No matching test cases" : "All test cases are in the plan"
          }
          description={
            search
              ? "Try a different name or clear the search."
              : "Every test case in this project is already part of this plan."
          }
          action={
            search && (
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            )
          }
        />
      ) : (
        <ul className="max-h-112 overflow-y-auto rounded-xl border border-border bg-base-100">
          {filtered.map((testCase) => (
            <li
              key={testCase.id}
              className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5 transition-colors last:border-b-0 hover:bg-base-content/5"
            >
              <span className="min-w-0 truncate text-sm font-medium">
                {testCase.name}
              </span>
              <button
                className="btn shrink-0 text-secondary btn-ghost btn-xs"
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
