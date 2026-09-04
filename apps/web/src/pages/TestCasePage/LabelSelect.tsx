import {
  CheckIcon,
  PencilSquareIcon,
  TagIcon,
} from '@heroicons/react/24/solid';
import type { Label } from '@testcraft/types';
import { useRef, useState } from 'react';

import {
  useAddTestCaseLabel,
  useLabels,
  useRemoveTestCaseLabel,
} from '@/features/labels/hooks';

interface LabelSelectProps {
  projectId: string;
  suiteId: string;
  caseId: string;
  assigned: Label[];
}

export const LabelSelect = ({
  projectId,
  suiteId,
  caseId,
  assigned,
}: LabelSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: allLabels } = useLabels(projectId);
  const add = useAddTestCaseLabel(projectId, suiteId, caseId);
  const remove = useRemoveTestCaseLabel(projectId, suiteId, caseId);

  const assignedIds = new Set(assigned.map((label) => label.id));
  const isPending = add.isPending || remove.isPending;
  const hasLabels = assigned.length > 0;

  const toggle = (label: Label) => {
    if (isPending) return;
    if (assignedIds.has(label.id)) {
      remove.mutate(label.id);
    } else {
      add.mutate(label.id);
    }
  };

  return (
    <div ref={ref} className="relative">
      {hasLabels ? (
        <button
          type="button"
          className="btn text-base-content/55 btn-ghost btn-xs hover:text-base-content"
          onClick={() => setOpen((prevOpen) => !prevOpen)}
          aria-label="Manage labels"
        >
          <PencilSquareIcon className="size-3" />
        </button>
      ) : (
        <button
          type="button"
          className="btn gap-1 text-base-content/55 btn-ghost btn-xs hover:text-base-content"
          onClick={() => setOpen((prevOpen) => !prevOpen)}
          aria-label="Add labels"
        >
          <TagIcon className="size-3" />
          Add label
        </button>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-0 z-20 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-base-100 shadow-xl">
            <div className="border-b border-border px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-base-content/55 uppercase">
                Labels
              </p>
            </div>
            {!allLabels || allLabels.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <TagIcon className="mx-auto mb-1.5 size-5 text-base-content/35" />
                <p className="text-xs font-medium text-base-content/70">
                  No labels yet
                </p>
                <p className="mt-0.5 text-xs text-base-content/55">
                  Create labels in the Labels tab
                </p>
              </div>
            ) : (
              <div className="p-1">
                {allLabels.map((label) => {
                  const isAssigned = assignedIds.has(label.id);

                  return (
                    <button
                      key={label.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => toggle(label)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-base-200 disabled:opacity-50"
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center">
                        {isAssigned ? (
                          <CheckIcon className="size-3.5 text-success" />
                        ) : (
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                        )}
                      </span>
                      <span className="flex-1 text-sm">{label.name}</span>
                      {isAssigned && (
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
