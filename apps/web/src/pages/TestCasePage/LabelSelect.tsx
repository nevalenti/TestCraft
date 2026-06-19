import { CheckIcon, TagIcon } from "@heroicons/react/24/solid";
import type { Label } from "@testcraft/types";
import { useRef, useState } from "react";

import { LabelBadge } from "@/components/ui/LabelBadge";
import {
  useAddTestCaseLabel,
  useLabels,
  useRemoveTestCaseLabel,
} from "@/hooks/useLabels";

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

  const assignedIds = new Set(assigned.map((l) => l.id));
  const isPending = add.isPending || remove.isPending;

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
      <button
        type="button"
        className="btn gap-1 text-base-content/50 btn-ghost btn-xs hover:text-base-content"
        onClick={() => setOpen((v) => !v)}
        aria-label="Manage labels"
      >
        <TagIcon className="size-3.5" />
        Add label
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-0 z-20 mt-1 w-52 rounded-lg border border-border bg-base-100 p-1 shadow-lg">
            {!allLabels || allLabels.length === 0 ? (
              <p className="px-3 py-2 text-xs text-base-content/50">
                No labels yet — create some in the Labels tab
              </p>
            ) : (
              allLabels.map((label) => {
                const isAssigned = assignedIds.has(label.id);

                return (
                  <button
                    key={label.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => toggle(label)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-base-200 disabled:opacity-50"
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      {isAssigned && (
                        <CheckIcon className="size-3.5 text-success" />
                      )}
                    </span>
                    <LabelBadge label={label} />
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
