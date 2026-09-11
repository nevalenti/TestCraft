import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import type { TestCase } from '@testcraft/types';
import { useState } from 'react';

export const AddCasesPanel = ({
  availableCases,
  onAdd,
}: {
  availableCases: TestCase[];
  onAdd: (testCaseId: string) => void;
}) => {
  const [search, setSearch] = useState('');
  const filtered = availableCases.filter((testCase) =>
    testCase.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="relative mb-3">
        <MagnifyingGlassIcon className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-base-content/65" />
        <input
          className="input-bordered input input-sm w-full pl-8"
          placeholder="Search test cases…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-base-content/65">
          {search ? 'No matches.' : 'All test cases are in the plan.'}
        </p>
      ) : (
        <ul className="max-h-96 space-y-2 overflow-y-auto">
          {filtered.map((testCase) => (
            <li
              key={testCase.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-base-100 px-4 py-2.5"
            >
              <span className="text-sm font-medium">{testCase.name}</span>
              <button
                className="btn text-primary btn-ghost btn-xs"
                onClick={() => onAdd(testCase.id)}
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
